import { prisma } from "@/lib/prisma";
import type { RegistrationAction } from "@prisma/client";

export async function logRegistrationAction(params: {
  userId: string;
  eventId: string;
  performedById?: string | null;
  action: RegistrationAction;
  previousStatus?: string | null;
  newStatus?: string | null;
  reason?: string | null;
  adminNotes?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    await prisma.registrationHistory.create({
      data: {
        userId: params.userId,
        eventId: params.eventId,
        action: params.action,
        previousStatus: params.previousStatus ?? null,
        newStatus: params.newStatus ?? null,
        reason: params.reason ?? null,
        adminNotes: params.adminNotes ?? null,
        performedById: params.performedById ?? null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch {
    // Best-effort audit; do not throw
  }
}
