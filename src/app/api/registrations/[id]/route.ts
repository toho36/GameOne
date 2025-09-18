import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, checkUserPermissions } from "@/lib/api/common/auth";
import { generateQRCodeURL } from "@/lib/qr-code";

function toPlainNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toNumber" in (value as any)) {
    try {
      return (value as any).toNumber();
    } catch {
      return Number(String(value));
    }
  }
  return Number(value ?? 0);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.success) return auth.response;
    const user = auth.data.user;

    const registration = await prisma.registration.findUnique({
      where: { id: params.id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            price: true,
            currency: true,
            bankAccountId: true,
            allowWaitingList: true,
            capacity: true,
            requiresPayment: true,
          },
        },
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, error: "REGISTRATION_NOT_FOUND" },
        { status: 404 }
      );
    }

    const isOwner = registration.userId === user.id;
    const isAdmin = checkUserPermissions(user, ["registrations.review"]).hasPermission;
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    // Precompute QR code URL for client convenience
    let qrCodeUrl: string | undefined = undefined;
    try {
      const amount = toPlainNumber(registration.event?.price);
      const date = registration.event?.startDate
        ? new Date(registration.event.startDate).toISOString().slice(0, 10)
        : undefined;
      if (registration.event?.title && typeof amount === "number" && date) {
        qrCodeUrl = generateQRCodeURL(registration.event.title, date, amount);
      }
    } catch {
      // QR code generation failed, continue without it
    }

    return NextResponse.json(
      { success: true, data: { ...registration, qrCodeUrl } },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load registration";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/registrations/[id] — unregister
// Auth: owner or registrations.update
// Allowed only before event startDate
export async function DELETE(
  _req: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.success) return auth.response;

    const raw: any = (context as any).params;
    const { id } = raw && typeof raw.then === "function" ? await raw : raw;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { event: true, payment: true, pendingPayment: true, user: true },
    });

    if (!registration) {
      return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const isOwner = registration.userId && registration.userId === auth.data.user.id;
    const isAdmin = checkUserPermissions(auth.data.user, ["registrations.update"]).hasPermission;
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    // Cancellation policy: only before event start
    const now = new Date();
    if (registration.event.startDate <= now) {
      return NextResponse.json(
        { success: false, error: "CANCELLATION_WINDOW_CLOSED" },
        { status: 400 }
      );
    }

    // Payments handling
    if (registration.requiresPayment) {
      if (registration.pendingPaymentId) {
        await prisma.pendingPayment.update({
          where: { id: registration.pendingPaymentId },
          data: { status: "CANCELLED", cancelledAt: new Date(), notes: "Cancelled by user" },
        });
      }
      if (registration.paymentId) {
        await prisma.payment.update({
          where: { id: registration.paymentId },
          data: { status: "REFUNDED", refundedAt: new Date(), notes: "Refund due to cancellation" },
        });
      }
    }

    await prisma.registration.update({
      where: { id: registration.id },
      data: { status: "CANCELLED", cancelledAt: new Date(), paymentStatus: "REJECTED" },
    });

    if (registration.event.allowWaitingList) {
      try {
        await import("@/lib/api/events/waiting-list").then((m) =>
          m.promoteNextWaitingListEntry(registration.eventId)
        );
      } catch {
        // Waiting list promotion failed, continue
      }
    }

    try {
      const { sendEmail } = await import("@/lib/email/resend");
      const subject = `Registration cancelled — ${registration.event.title}`;
      const html = `<p>Your registration for <strong>${registration.event.title}</strong> has been cancelled.</p>`;
      if (registration.user?.email) {
        await sendEmail({ to: registration.user.email, subject, html });
      }
    } catch {
      // Email sending failed, continue
    }

    return NextResponse.json({ success: true, data: { id } }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
