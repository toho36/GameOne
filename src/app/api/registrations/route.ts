import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermissions } from "@/lib/api/common/auth";

const querySchema = z.object({
  paymentStatus: z
    .enum([
      "PENDING_VERIFICATION",
      "PAYMENT_SENT_AWAITING_VERIFICATION",
      "PAYMENT_VERIFIED",
      "VERIFIED_CASH",
      "REJECTED",
    ])
    .optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermissions(["registrations.review"]);
    if (!auth.success) return auth.response;

    const url = new URL(req.url);
    const parse = querySchema.safeParse({
      paymentStatus: url.searchParams.get("paymentStatus") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    });
    if (!parse.success) {
      return NextResponse.json(
        { success: false, error: "INVALID_QUERY", details: parse.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const where = parse.data.paymentStatus ? { paymentStatus: parse.data.paymentStatus } : {};

    const [items, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        include: {
          event: { select: { id: true, title: true, startDate: true } },
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { paymentClaimedAt: "asc" },
        take: parse.data.limit,
        skip: parse.data.offset,
      }),
      prisma.registration.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: { items, total, limit: parse.data.limit, offset: parse.data.offset },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list registrations";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
