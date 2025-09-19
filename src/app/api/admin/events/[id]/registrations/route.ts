import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermissions } from "@/lib/api/common/auth";

const querySchema = z.object({
  status: z
    .enum(["PENDING", "CONFIRMED", "CANCELLED", "REJECTED", "ATTENDED", "NO_SHOW"])
    .optional(),
  paymentStatus: z
    .enum([
      "PENDING_VERIFICATION",
      "PAYMENT_SENT_AWAITING_VERIFICATION",
      "PAYMENT_VERIFIED",
      "VERIFIED_CASH",
      "REJECTED",
      "WAITING_LIST_PROMOTED",
    ])
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requirePermissions(["registrations.review"]);
    if (!auth.success) return auth.response;

    const url = new URL(req.url);
    const parse = querySchema.safeParse({
      status: url.searchParams.get("status") ?? undefined,
      paymentStatus: url.searchParams.get("paymentStatus") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
    if (!parse.success) {
      return NextResponse.json(
        { success: false, error: "INVALID_QUERY", details: parse.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, paymentStatus, page, limit } = parse.data;
    const where: any = { eventId: params.id };
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const [items, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        include: { user: true },
        orderBy: { registeredAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.registration.count({ where }),
    ]);

    const data = items.map((r) => ({
      id: r.id,
      userId: r.userId,
      participantName: r.user?.name ?? r.guestName ?? "-",
      participantEmail: r.user?.email ?? r.guestEmail ?? "-",
      status: r.status,
      paymentStatus: r.paymentStatus,
      registeredAt: r.registeredAt,
      contact: (() => {
        try {
          const notes = r.notes ? JSON.parse(r.notes) : {};
          return notes.contact ?? null;
        } catch {
          return null;
        }
      })(),
    }));

    return NextResponse.json({ success: true, data: { items: data, total, page, limit } });
  } catch {
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
