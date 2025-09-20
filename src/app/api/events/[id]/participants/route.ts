import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, checkUserPermissions } from "@/lib/api/common/auth";

// GET /api/events/[id]/participants
// Returns
// {
//   counts: { confirmed: number; waiting: number },
//   confirmed?: Array<{ id: string; name: string; registrationStatus?: string; paymentStatus?: string }>,
//   waiting?: Array<{ id: string; name: string; registrationStatus?: string; paymentStatus?: string }>
// }
// Names are returned only for event creator/manager or users with events.view permission

type ParamsArg = { params: { id: string } } | { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: ParamsArg) {
  try {
    const raw: any = (context as any).params;
    const { id: eventId } = raw && typeof raw.then === "function" ? await raw : raw;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });

    // Participants that take capacity spots (per analysis)
    const capacityPaymentStatuses = [
      "PAYMENT_SENT_AWAITING_VERIFICATION",
      "PAYMENT_VERIFIED",
      "VERIFIED_CASH",
    ] as const;

    const [confirmedRegs, pendingRegs, waitingEntries] = await Promise.all([
      prisma.registration.findMany({
        where: {
          eventId,
          paymentStatus: { in: capacityPaymentStatuses as any },
          status: { notIn: ["CANCELLED", "REJECTED"] as any },
        },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { registeredAt: "asc" },
        take: 1000,
      }),
      prisma.registration.findMany({
        where: {
          eventId,
          paymentStatus: "PENDING_VERIFICATION" as any,
          status: { in: ["PENDING"] as any },
        },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { registeredAt: "asc" },
        take: 1000,
      }),
      prisma.waitingList.findMany({
        where: { eventId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { position: "asc" },
        take: 1000,
      }),
    ]);

    const counts = {
      confirmed: confirmedRegs.length,
      waiting: (pendingRegs.length ?? 0) + (waitingEntries.length ?? 0),
    };

    // Authorization for returning names
    let canSeeNames = false;
    const auth = await getAuthenticatedUser();
    if (auth.success) {
      const user = auth.data.user;
      const isOwner =
        user.id === event.creatorId || (event.managerId ? user.id === event.managerId : false);
      const hasEventsView = checkUserPermissions(user, ["events.view"]).hasPermission;
      canSeeNames = isOwner || hasEventsView;
    }

    const payload: any = { counts };

    if (canSeeNames) {
      payload.confirmed = confirmedRegs.map((r: any) => ({
        id: r.user?.id || r.id,
        name: r.user?.name || r.guestName || "Participant",
        registrationStatus: r.status,
        paymentStatus: r.paymentStatus as any,
      }));

      const waitingFromPending = pendingRegs.map((r: any) => ({
        id: r.user?.id || r.id,
        name: r.user?.name || r.guestName || "Participant",
        registrationStatus: r.status,
        paymentStatus: r.paymentStatus as any,
      }));

      const waitingFromList = waitingEntries.map((w) => ({
        id: w.user?.id || w.id,
        name: w.user?.name || w.guestName || "Participant",
        registrationStatus: "WAITING_LIST",
        paymentStatus: undefined,
      }));

      payload.waiting = [...waitingFromPending, ...waitingFromList];
    }

    return NextResponse.json({ success: true, data: payload });
  } catch {
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
