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

import { hasCapacity } from "@/lib/api/events/capacity";

export async function promoteNextWaitingListEntry(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return null;
  if (!(await hasCapacity(eventId, event.capacity))) return null;

  const entry = await prisma.waitingList.findFirst({
    where: { eventId },
    orderBy: { position: "asc" },
  });
  if (!entry) return null;

  // Create a registration for the waiting list entry
  const registration = await prisma.registration.create({
    data: {
      eventId,
      userId: entry.userId ?? null,
      status: "PENDING",
      groupSize: entry.groupSize ?? 1,
      paymentStatus: event.requiresPayment ? "PENDING_VERIFICATION" : "PAYMENT_VERIFIED",
      paymentVerifiedAt: event.requiresPayment ? undefined : new Date(),
      requiresPayment: !!event.requiresPayment,
      registrationSource: "WAITING_LIST_PROMOTION",
      promotedFromWaitingList: true,
      promotedAt: new Date(),
    },
  });

  await prisma.waitingList.delete({ where: { id: entry.id } });

  return { registration, entry };
}
