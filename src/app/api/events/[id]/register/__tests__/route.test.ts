import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/events/[id]/register/route";
import { NextResponse } from "next/server";

vi.mock("@/lib/api/events/capacity", () => ({ hasCapacity: vi.fn() }));
vi.mock("@/lib/api/events/waiting-list", () => ({ addToWaitingList: vi.fn() }));
vi.mock("@/lib/api/common/auth", () => ({ getAuthenticatedUser: vi.fn() }));

// Prisma mock
vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: { findUnique: vi.fn() },
    pendingPayment: { create: vi.fn(), delete: vi.fn() },
    registration: { create: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(async (fn: any) => fn((await import("@/lib/prisma")).prisma)),
  },
}));

const { hasCapacity } = await import("@/lib/api/events/capacity");
const { addToWaitingList } = await import("@/lib/api/events/waiting-list");
const { getAuthenticatedUser } = await import("@/lib/api/common/auth");
const { prisma } = await import("@/lib/prisma");

function makeRequest(body: any) {
  return new Request("http://test.local/api/events/e1/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

const authUser = {
  id: "u1",
  email: "user@example.com",
  name: "Test User",
  firstName: "Test",
  lastName: "User",
  phoneNumber: "+420123456789",
};

const baseEvent = {
  id: "e1",
  title: "Great Event",
  status: "PUBLISHED",
  capacity: 10,
  requiresPayment: true,
  price: 100,
  currency: "CZK",
  bankAccountId: "ba1",
  startDate: new Date(),
  createdAt: new Date(Date.now() - 1000 * 60),
  registrationStartDate: new Date(Date.now() - 1000 * 60),
  registrationEndDate: new Date(Date.now() + 1000 * 60 * 60),
  allowWaitingList: true,
};

describe("POST /api/events/[id]/register", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (getAuthenticatedUser as any).mockResolvedValue({ success: true, data: { user: authUser } });
    (prisma.event.findUnique as any).mockResolvedValue(baseEvent);
    (hasCapacity as any).mockResolvedValue(true);
    (prisma.pendingPayment.create as any).mockResolvedValue({ id: "pp1" });
    (prisma.registration.findFirst as any).mockResolvedValue(null);
    (prisma.registration.create as any).mockResolvedValue({ id: "r1" });
    (addToWaitingList as any).mockResolvedValue({ id: "w1", position: 1 });
  });

  it("derives contact info and userId for authenticated users (paid event)", async () => {
    const req = makeRequest({ numberOfGuests: 0 });
    const res = await POST(req as any, { params: { id: baseEvent.id } });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe("PENDING_VERIFICATION");
    expect(prisma.pendingPayment.create).toHaveBeenCalled();
    expect(prisma.registration.create).toHaveBeenCalled();
    const regArgs = (prisma.registration.create as any).mock.calls[0][0].data;
    const notes = JSON.parse(regArgs.notes);
    expect(regArgs.userId).toBe(authUser.id);
    expect(notes.contact).toMatchObject({
      name: authUser.name,
      phone: authUser.phoneNumber,
      email: authUser.email,
    });
  });

  it("creates verified registration for free event", async () => {
    (prisma.event.findUnique as any).mockResolvedValue({ ...baseEvent, requiresPayment: false, price: null });
    const req = makeRequest({ numberOfGuests: 0 });
    const res = await POST(req as any, { params: { id: baseEvent.id } });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.data.status).toBe("PAYMENT_VERIFIED");
    const regArgs = (prisma.registration.create as any).mock.calls.at(-1)[0].data;
    const notes = JSON.parse(regArgs.notes);
    expect(regArgs.requiresPayment).toBe(false);
    expect(regArgs.paymentStatus).toBe("PAYMENT_VERIFIED");
    expect((notes.contact as any).name).toBe(authUser.name);
  });

  it("adds to waiting list when full and sets userId", async () => {
    (hasCapacity as any).mockResolvedValue(false);
    const req = makeRequest({ numberOfGuests: 1 });
    const res = await POST(req as any, { params: { id: baseEvent.id } });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.data.status).toBe("WAITING_LIST");
    expect(addToWaitingList).toHaveBeenCalledWith({ eventId: baseEvent.id, userId: authUser.id, groupSize: 1 });
  });

  it("returns 401 when unauthenticated", async () => {
    (getAuthenticatedUser as any).mockResolvedValue({ success: false, response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) });
    const req = makeRequest({ numberOfGuests: 1 });
    const res = await POST(req as any, { params: { id: baseEvent.id } });
    expect(res.status).toBe(401);
  });
});

