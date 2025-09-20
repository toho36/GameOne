import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermissions } from "@/lib/api/common/auth";
import { addToWaitingList } from "@/lib/api/events/waiting-list";

const bodySchema = z.object({
  action: z.enum(["approve", "decline", "verify_payment", "reject_payment"]),
  reason: z.string().optional(),
  moveToWaitingList: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requirePermissions(["registrations.update"]);
    if (!auth.success) return auth.response;

    const parse = bodySchema.safeParse(await req.json());
    if (!parse.success) {
      return NextResponse.json(
        { success: false, error: "INVALID_REQUEST", details: parse.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const registration = await prisma.registration.findUnique({
      where: { id: params.id },
      include: { event: true },
    });
    if (!registration) {
      return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const { action, reason, moveToWaitingList } = parse.data;
    let updated;

    if (action === "approve") {
      updated = await prisma.registration.update({
        where: { id: registration.id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
      });
    } else if (action === "decline") {
      updated = await prisma.registration.update({
        where: { id: registration.id },
        data: { status: "CANCELLED", cancelledAt: new Date(), notes: reason ?? registration.notes },
      });
    } else if (action === "verify_payment") {
      updated = await prisma.registration.update({
        where: { id: registration.id },
        data: { paymentStatus: "PAYMENT_VERIFIED", paymentVerifiedAt: new Date() },
      });
    } else if (action === "reject_payment") {
      updated = await prisma.registration.update({
        where: { id: registration.id },
        data: {
          paymentStatus: "REJECTED",
          paymentRejectedAt: new Date(),
          paymentRejectionReason: reason,
        },
      });

      if (moveToWaitingList && registration.event.allowWaitingList) {
        await addToWaitingList({
          eventId: registration.eventId,
          userId: registration.userId ?? undefined,
          groupSize: registration.groupSize ?? 1,
        });
      }
    }

    return NextResponse.json({ success: true, data: { id: updated!.id } });
  } catch {
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
