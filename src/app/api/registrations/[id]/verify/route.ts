import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPaymentVerified } from "@/lib/api/email/registration";

const verifySchema = z.object({
  method: z.enum(["BANK_TRANSFER", "CASH"]).default("BANK_TRANSFER"),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const registrationId = params.id;
    const json = await request.json().catch(() => ({}));
    const parse = verifySchema.safeParse(json);

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
            message: "Only pending verification claims can be approved",
          },
        },
        { status: 400 }
      );
    }

    const newStatus = parse.data.method === "CASH" ? "VERIFIED_CASH" : "PAYMENT_VERIFIED";

    // Update registration and linked payment (if exists)
    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: newStatus,
        paymentVerifiedAt: new Date(),
        paymentMethod: parse.data.method,
        paymentRejectionReason: null,
      },
    });

    if (updated.paymentId) {
      await prisma.payment.update({
        where: { id: updated.paymentId },
        data: {
          status: "COMPLETED",
          verifiedAt: new Date(),
          method: parse.data.method,
          verificationNotes: parse.data.notes ?? undefined,
        },
      });
    }

    await sendPaymentVerified(updated.userId ?? "", updated.eventId, updated.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          registrationId: updated.id,
          status: updated.paymentStatus,
          message: "Payment verified.",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
