import { prisma } from "@/lib/prisma";
import type { RegistrationPaymentStatus } from "@prisma/client";

// Registration payment statuses that count towards event capacity
export const TAKES_SPOT: readonly RegistrationPaymentStatus[] = [
  "PAYMENT_SENT_AWAITING_VERIFICATION",
  "PAYMENT_VERIFIED",
  "VERIFIED_CASH",
] as const;

export type TakesSpotStatus = (typeof TAKES_SPOT)[number];

// Pure helper for testing without DB
export function countSpotsFromStatuses(statuses: readonly string[]): number {
  const set = new Set<string>(TAKES_SPOT as readonly string[]);
  return statuses.reduce((acc, s) => (set.has(s) ? acc + 1 : acc), 0);
}

// DB-backed helpers
export async function countSpotsTaken(eventId: string): Promise<number> {
  return prisma.registration.count({
    where: { eventId, paymentStatus: { in: TAKES_SPOT as RegistrationPaymentStatus[] } },
  });
}

export async function getAvailableSpots(eventId: string, capacity: number): Promise<number> {
  const taken = await countSpotsTaken(eventId);
  return Math.max(0, capacity - taken);
}

export async function hasCapacity(eventId: string, capacity: number): Promise<boolean> {
  const available = await getAvailableSpots(eventId, capacity);
  return available > 0;
}
