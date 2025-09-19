import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermissions } from "@/lib/api/common/auth";
import { sendPaymentRejected } from "@/lib/api/email/registration";

const rejectSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermissions(["registrations.review"]);
    if (!auth.success) return auth.response;

    const raw: any = (context as any).params;
    const { id: registrationId } = raw && typeof raw.then === "function" ? await raw : raw;

    const json = await request.json().catch(() => ({}));
    const parse = rejectSchema.safeParse(json);

    if (!parse.success) {
      return NextResponse.json(
        { success: false, error: "INVALID_REQUEST", details: parse.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const registration = await prisma.registration.findUnique({ where: { id: registrationId } });
    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "REGISTRATION_NOT_FOUND", message: "Registration not found" },
        },
        { status: 404 }
      );
    }

    if (registration.paymentStatus !== "PAYMENT_SENT_AWAITING_VERIFICATION") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: "Only pending verification claims can be rejected",
          },
        },
        { status: 400 }
      );
    }

    const [updated] = await prisma.$transaction(async (tx) => {
      const u = await tx.registration.update({
        where: { id: registrationId },
        data: {
          paymentStatus: "REJECTED",
          paymentRejectedAt: new Date(),
          paymentRejectionReason: parse.data.reason ?? null,
        },
      });

      if (u.paymentId) {
        await tx.payment.update({
          where: { id: u.paymentId },
          data: {
            status: "FAILED",
            notes: parse.data.reason ?? undefined,
          },
        });
      }

      await tx.registrationHistory.create({
        data: {
          userId: u.userId ?? "",
          eventId: u.eventId,
          action: "ADMIN_REJECTED",
          previousStatus: "PAYMENT_SENT_AWAITING_VERIFICATION",
          newStatus: u.paymentStatus,
          reason: parse.data.reason ?? null,
          performedById: auth.data.user.id,
        },
      });

      return [u] as const;
    });

    await sendPaymentRejected(updated.userId ?? "", updated.eventId, updated.id, parse.data.reason);

    return NextResponse.json(
      {
        success: true,
        data: {
          registrationId: updated.id,
          status: updated.paymentStatus,
          message: "Payment rejected.",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rejection failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
