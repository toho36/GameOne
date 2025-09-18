import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, checkUserPermissions } from "@/lib/api/common/auth";

// GET /api/events/[id]/participants
// Returns { count, participants?: Array<{ id: string; name: string }> }
// Names are returned only for event creator/manager or users with events.view permission

type ParamsArg = { params: { id: string } } | { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: ParamsArg) {
  try {
    const raw: any = (context as any).params;
    const { id: eventId } = raw && typeof raw.then === "function" ? await raw : raw;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });

    const confirmed = await prisma.registration.findMany({
      where: { eventId, status: "CONFIRMED" },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { confirmedAt: "asc" },
      take: 500, // safety cap
    });

    const count = confirmed.length;

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

    const payload: any = { count };
    if (canSeeNames) {
      payload.participants = confirmed
        .map((r) => ({
          id: r.user?.id || r.id,
          name: r.user?.name || r.guestName || "Participant",
        }))
        .filter((p) => !!p.name);
    }

    return NextResponse.json({ success: true, data: payload });
  } catch {
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
