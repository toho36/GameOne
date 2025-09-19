import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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

    // Atomic capacity re-check + claim inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Recompute capacity inside txn
      const taken = await tx.registration.count({
        where: {
          eventId: registration.eventId,
          paymentStatus: {
            in: ["PAYMENT_SENT_AWAITING_VERIFICATION", "PAYMENT_VERIFIED", "VERIFIED_CASH"],
          } as any,
        },
      });
      const hasSpot = taken < (registration.event.capacity ?? 0);
      if (!hasSpot) {
        if (registration.event.allowWaitingList) {
          const entry = await tx.waitingList.create({
            data: {
              eventId: registration.eventId,
              userId: registration.userId ?? null,
              position:
                (await tx.waitingList.count({ where: { eventId: registration.eventId } })) + 1,
              groupSize: registration.groupSize ?? 1,
            },
          });
          return { kind: "WAITING_LIST" as const, entry };
        }
        return { kind: "FULL" as const };
      }

      const payment = await tx.payment.create({
        data: {
          userId,
          eventId: registration.eventId,
          registrationId: registration.id,
          amount: registration.event.price ?? (0 as any),
          currency: registration.event.currency,
          method: "BANK_TRANSFER",
          status: "PENDING",
          bankAccountId: registration.event.bankAccountId ?? undefined,
          claimedAt: new Date(),
          pendingPaymentId: registration.pendingPaymentId ?? undefined,
          description: parse.data.notes ?? undefined,
          reference: parse.data.transactionId ?? undefined,
        },
      });

      const updated = await tx.registration.update({
        where: { id: registrationId },
        data: {
          paymentStatus: "PAYMENT_SENT_AWAITING_VERIFICATION",
          paymentClaimedAt: new Date(),
          paymentMethod: "BANK_TRANSFER",
          paymentId: payment.id,
        },
      });

      await tx.registrationHistory.create({
        data: {
          userId: updated.userId ?? "",
          eventId: updated.eventId,
          action: "PAYMENT_COMPLETED",
          previousStatus: "PENDING_VERIFICATION",
          newStatus: updated.paymentStatus,
        },
      });

      return { kind: "OK" as const, payment, updated };
    });

    if (result.kind === "WAITING_LIST") {
      return NextResponse.json(
        {
          success: true,
          data: {
            waitingListId: result.entry.id,
            position: result.entry.position,
            status: "WAITING_LIST",
            message: "Event just reached capacity. You have been added to the waiting list.",
          },
        },
        { status: 201 }
      );
    }
    if (result.kind === "FULL") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "EVENT_FULL_NOW", message: "Event just reached capacity." },
        },
        { status: 409 }
      );
    }

    // Notify (stub)
    await sendPaymentClaimReceived(userId, registration.eventId, registration.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          registrationId: result.updated.id,
          paymentId: result.payment.id,
          status: result.updated.paymentStatus,
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
