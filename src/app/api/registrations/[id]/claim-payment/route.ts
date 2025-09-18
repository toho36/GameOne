import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasCapacity } from "@/lib/api/events/capacity";
import { addToWaitingList } from "@/lib/api/events/waiting-list";
import { getAuthenticatedUser } from "@/lib/api/common/auth";
import { sendPaymentClaimReceived } from "@/lib/api/email/registration";

const claimSchema = z.object({
  transactionId: z.string().min(1).optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const registrationId = params.id;
    const json = await request.json().catch(() => ({}));
    const parse = claimSchema.safeParse(json);

    if (!parse.success) {
      return NextResponse.json(
        { success: false, error: "INVALID_REQUEST", details: parse.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Require auth and ownership
    const auth = await getAuthenticatedUser();
    if (!auth.success) return auth.response;
    const userId = auth.data.user.id as string;

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration || !registration.event) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "REGISTRATION_NOT_FOUND", message: "Registration not found" },
        },
        { status: 404 }
      );
    }

    // Ownership
    if (registration.userId !== userId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not your registration" } },
        { status: 403 }
      );
    }

    // Allow claiming only from PENDING_VERIFICATION
    if (registration.paymentStatus !== "PENDING_VERIFICATION") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_STATUS", message: "Cannot claim from current status" },
        },
        { status: 400 }
      );
    }

    // Capacity re-check at claim time (counts as taking a spot)
    const event = registration.event;
    if (!(await hasCapacity(event.id, event.capacity))) {
      if (event.allowWaitingList) {
        const entry = await addToWaitingList({
          eventId: event.id,
          userId: registration.userId ?? null,
          groupSize: registration.groupSize ?? 1,
        });
        return NextResponse.json(
          {
            success: true,
            data: {
              waitingListId: entry.id,
              position: entry.position,
              status: "WAITING_LIST",
              message: "Event just reached capacity. You have been added to the waiting list.",
            },
          },
          { status: 201 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EVENT_FULL_NOW",
            message: "Event just reached capacity.",
          },
        },
        { status: 409 }
      );
    }

    // Create a Payment record linked to this registration and pending payment (if any)
    const payment = await prisma.payment.create({
      data: {
        userId,
        eventId: event.id,
        registrationId: registration.id,
        amount: event.price ?? (0 as any),
        currency: event.currency,
        method: "BANK_TRANSFER",
        status: "PENDING",
        bankAccountId: event.bankAccountId ?? undefined,
        claimedAt: new Date(),
        pendingPaymentId: registration.pendingPaymentId ?? undefined,
        description: parse.data.notes ?? undefined,
        reference: parse.data.transactionId ?? undefined,
      },
    });

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: "PAYMENT_SENT_AWAITING_VERIFICATION",
        paymentClaimedAt: new Date(),
        paymentMethod: "BANK_TRANSFER",
        paymentId: payment.id,
      },
    });

    // Notify (stub)
    await sendPaymentClaimReceived(userId, event.id, registration.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          registrationId: updated.id,
          paymentId: payment.id,
          status: updated.paymentStatus,
          message: "Payment claim received. Awaiting admin verification.",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Claim failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
