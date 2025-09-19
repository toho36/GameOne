import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api/common/auth";

// GET /api/events/[id]/registration
// Returns current user's registration status for the given event
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.success) return auth.response;

    const userId = auth.data.user.id;
    const eventId = params.id;

    const [registration, waiting] = await Promise.all([
      prisma.registration.findFirst({
        where: { eventId, userId, status: { not: "CANCELLED" } },
        select: { id: true, status: true, paymentStatus: true },
      }),
      prisma.waitingList.findFirst({
        where: { eventId, userId },
        select: { position: true },
        orderBy: { position: "asc" },
      }),
    ]);

    if (!registration && !waiting) {
      return NextResponse.json({ success: true, data: { hasRegistration: false } });
    }

    return NextResponse.json({
      success: true,
      data: {
        hasRegistration: Boolean(registration),
        registrationId: registration?.id,
        status: registration?.status,
        paymentStatus: registration?.paymentStatus,
        waitingListPosition: waiting?.position ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check registration";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/events/[id]/registration — unregister current user
// If user has an active registration, cancel it and promote waiting list.
// If user is only on waiting list, remove their waiting list entry.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.success) return auth.response;
    const user = auth.data.user;

    const eventId = params.id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ success: false, error: "EVENT_NOT_FOUND" }, { status: 404 });
    }

    const now = new Date();
    if (event.startDate <= now) {
      return NextResponse.json(
        { success: false, error: "CANCELLATION_WINDOW_CLOSED" },
        { status: 400 }
      );
    }

    const registration = await prisma.registration.findFirst({
      where: { eventId, userId: user.id, status: { not: "CANCELLED" } },
      include: { pendingPayment: true, payment: true },
    });

    if (!registration) {
      // Remove from waiting list if present
      const wl = await prisma.waitingList.findFirst({ where: { eventId, userId: user.id } });
      if (wl) {
        await prisma.$transaction(async (tx) => {
          await tx.waitingList.delete({ where: { id: wl.id } });
          // Recalculate positions compactly
          const rest = await tx.waitingList.findMany({
            where: { eventId },
            orderBy: { position: "asc" },
          });
          for (let i = 0; i < rest.length; i++) {
            const entry = rest[i]!;
            if (entry.position !== i + 1) {
              await tx.waitingList.update({ where: { id: entry.id }, data: { position: i + 1 } });
            }
          }
        });
        return NextResponse.json({ success: true, data: { removedFromWaitingList: true } });
      }

      return NextResponse.json(
        { success: false, error: "REGISTRATION_NOT_FOUND" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Refund finalized payments if applicable and fully remove registration + pending payment
      if (registration.paymentId) {
        await tx.payment.update({
          where: { id: registration.paymentId },
          data: { status: "REFUNDED", refundedAt: new Date(), notes: "Refund due to cancellation" },
        });
      }

      // Delete registration first to release unique constraints for re-registration
      await tx.registration.delete({ where: { id: registration.id } });

      // Remove any pending payment so a fresh one (and QR) will be generated on next registration
      if (registration.pendingPaymentId) {
        await tx.pendingPayment.delete({ where: { id: registration.pendingPaymentId } });
      }
    });

    if (event.allowWaitingList) {
      try {
        const { promoteNextWaitingListEntry } = await import("@/lib/api/events/waiting-list");
        await promoteNextWaitingListEntry(eventId);
      } catch {
        // ignore
      }
    }

    try {
      const { sendEmail } = await import("@/lib/email/resend");
      const subject = `Registration cancelled — ${event.title}`;
      const html = `<p>Your registration for <strong>${event.title}</strong> has been cancelled.</p>`;
      if (user.email) {
        await sendEmail({ to: user.email, subject, html });
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, data: { id: registration.id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to unregister";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
