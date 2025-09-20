import { prisma } from "@/lib/prisma";

export async function getNextWaitingListPosition(eventId: string): Promise<number> {
  const last = await prisma.waitingList.findFirst({
    where: { eventId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return (last?.position ?? 0) + 1;
}

export interface CreateWaitingListParams {
  eventId: string;
  userId?: string | null;
  groupSize?: number;
  guestEmail?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  notes?: string | null;
}

export async function addToWaitingList(params: CreateWaitingListParams) {
  const position = await getNextWaitingListPosition(params.eventId);
  return prisma.waitingList.create({
    data: {
      eventId: params.eventId,
      userId: params.userId ?? null,
      position,
      groupSize: params.groupSize ?? 1,
      guestEmail: params.guestEmail ?? null,
      guestName: params.guestName ?? null,
      guestPhone: params.guestPhone ?? null,
      notes: params.notes ?? null,
    },
  });
}

export async function promoteNextWaitingListEntry(eventId: string) {
  // Wrap entire flow in a transaction to avoid double-promotion
  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) return null;

    // Re-check capacity within the transaction
    const taken = await tx.registration.count({
      where: {
        eventId,
        paymentStatus: {
          in: ["PAYMENT_SENT_AWAITING_VERIFICATION", "PAYMENT_VERIFIED", "VERIFIED_CASH"],
        } as any,
      },
    });
    if (taken >= event.capacity) return null;

    const entry = await tx.waitingList.findFirst({
      where: { eventId },
      orderBy: { position: "asc" },
    });
    if (!entry) return null;

    let pendingPaymentId: string | undefined = undefined;
    if (event.requiresPayment && event.price) {
      const pp = await tx.pendingPayment.create({
        data: {
          userId: entry.userId ?? "", // For guest entries there might not be a userId
          eventId,
          amount: event.price,
          currency: event.currency,
          type: "WAITING_LIST_PROMOTION",
          status: "PENDING",
          paymentMethod: "BANK_TRANSFER",
          bankAccountId: event.bankAccountId ?? undefined,
          description: `Waiting list promotion for ${event.title}`,
        },
      });
      pendingPaymentId = pp.id;
    }

    const registration = await tx.registration.create({
      data: {
        eventId,
        userId: entry.userId ?? null,
        status: "PENDING",
        groupSize: entry.groupSize ?? 1,
        paymentStatus: event.requiresPayment ? "PENDING_VERIFICATION" : "PAYMENT_VERIFIED",
        paymentVerifiedAt: event.requiresPayment ? undefined : new Date(),
        requiresPayment: !!event.requiresPayment,
        pendingPaymentId,
        registrationSource: "WAITING_LIST_PROMOTION",
        promotedFromWaitingList: true,
        promotedAt: new Date(),
      },
    });

    await tx.waitingList.delete({ where: { id: entry.id } });

    await tx.registrationHistory.create({
      data: {
        userId: registration.userId ?? "",
        eventId,
        action: "PROMOTED_FROM_WAITING_LIST",
        newStatus: registration.paymentStatus,
      },
    });

    return { registration, entry } as const;
  });

  // Optional: send email outside of transaction
  try {
    if (result?.registration?.requiresPayment) {
      const { sendPaymentClaimReceived } = await import("@/lib/api/email/registration");
      await sendPaymentClaimReceived(
        result.registration.userId ?? "",
        eventId,
        result.registration.id
      );
    }
  } catch {
    // ignore email errors
  }

  return result;
}
