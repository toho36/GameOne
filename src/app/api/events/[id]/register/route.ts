import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hasCapacity } from "@/lib/api/events/capacity";
import { addToWaitingList } from "@/lib/api/events/waiting-list";
import { getAuthenticatedUser } from "@/lib/api/common/auth";

const createRegistrationSchema = z.object({
  eventId: z.string(),
  numberOfGuests: z.number().int().min(0).max(5), // max 5 friends per user (global)
  guestDetails: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        dietaryRestrictions: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .default([]),
  contact: z
    .union([
      z.string().min(1),
      z.object({
        name: z.string().min(1),
        phone: z.string().min(3),
        email: z.string().email().optional(),
      }),
    ])
    .optional(),
});

type ParamsArg = { params: { id: string } } | { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: ParamsArg) {
  try {
    const raw = (context as any).params;
    const resolvedParams: { id: string } = raw && typeof raw.then === "function" ? await raw : raw;
    const eventId = resolvedParams.id;
    const json = await request.json();
    const parse = createRegistrationSchema.safeParse({ ...json, eventId });

    if (!parse.success) {
      return NextResponse.json(
        { success: false, error: "INVALID_REQUEST", details: parse.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const body = parse.data;

    // Require authentication to create registration and pending payment
    const auth = await getAuthenticatedUser();
    if (!auth.success) {
      return auth.response;
    }

    // Derive contact from authenticated user if not provided in payload
    const userProfile = auth.data.user as any;
    const derivedContact = body.contact ?? {
      name:
        userProfile?.name ||
        [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(" ") ||
        userProfile?.email ||
        "User",
      phone: userProfile?.phoneNumber ?? "",
      email: userProfile?.email ?? undefined,
    };
    const userId = auth.data.user.id as string;

    // Validate event exists and is open for registration
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return NextResponse.json(
        { success: false, error: { code: "EVENT_NOT_FOUND", message: "Event not found" } },
        { status: 404 }
      );
    }

    if (event.status !== "PUBLISHED") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "EVENT_NOT_OPEN", message: "Event is not open for registration" },
        },
        { status: 400 }
      );
    }

    if (!event.bankAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "BANK_ACCOUNT_REQUIRED", message: "Event is missing bank account" },
        },
        { status: 400 }
      );
    }

    // Check registration dates
    const now = new Date();
    const registrationStart = event.registrationStartDate || event.createdAt;
    const registrationEnd = event.registrationEndDate || event.startDate;

    if (now < registrationStart || now > registrationEnd) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "REGISTRATION_CLOSED", message: "Registration is not open at this time" },
        },
        { status: 400 }
      );
    }

    // Capacity check based on paymentStatus semantics
    if (!(await hasCapacity(event.id, event.capacity))) {
      if (event.allowWaitingList) {
        const entry = await addToWaitingList({
          eventId: event.id,
          userId: auth.data.user.id,
          groupSize: body.numberOfGuests || 1,
        });
        return NextResponse.json(
          {
            success: true,
            data: {
              waitingListId: entry.id,
              position: entry.position,
              status: "WAITING_LIST",
              message: "Event is full. You have been added to the waiting list.",
            },
          },
          { status: 201 }
        );
      }
      return NextResponse.json(
        { success: false, error: { code: "EVENT_FULL", message: "Event is full" } },
        { status: 400 }
      );
    }

    // Basic sanity: guestDetails length should match numberOfGuests if provided
    if (body.guestDetails && body.guestDetails.length !== body.numberOfGuests) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GUEST_MISMATCH",
            message: "guestDetails count must match numberOfGuests",
          },
        },
        { status: 400 }
      );
    }

    // Ensure fresh registration on re-register: delete any previous CANCELLED registration and its pending payment
    const existing = await prisma.registration.findFirst({
      where: { eventId, userId },
      include: { pendingPayment: true },
    });
    if (existing) {
      if (existing.status !== "CANCELLED") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "ALREADY_REGISTERED",
              message: "You are already registered for this event",
            },
          },
          { status: 409 }
        );
      }
      await prisma.$transaction(async (tx) => {
        await tx.registration.delete({ where: { id: existing.id } });
        if (existing.pendingPaymentId) {
          await tx.pendingPayment.delete({ where: { id: existing.pendingPaymentId } });
        }
      });
    }

    // If event requires payment, create a brand-new pending payment and registration
    let registration;
    if (event.requiresPayment && event.price) {
      let pending;
      try {
        pending = await prisma.pendingPayment.create({
          data: {
            userId,
            eventId: event.id,
            amount: event.price,
            currency: event.currency,
            type: "REGISTRATION",
            status: "PENDING",
            paymentMethod: "BANK_TRANSFER",
            bankAccountId: event.bankAccountId,
            description: `Registration payment for ${event.title}`,
          },
        });
      } catch (e: any) {
        if (typeof e?.message === "string" && e.message.includes("Unique constraint failed")) {
          // This should be rare after cleanup; surface a clear conflict
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "DUPLICATE_PENDING_PAYMENT",
                message: "A previous pending payment still exists.",
              },
            },
            { status: 409 }
          );
        }
        throw e;
      }

      // Create fresh registration linked to the new pending payment
      try {
        registration = await prisma.registration.create({
          data: {
            eventId,
            userId,
            status: "PENDING",
            groupSize: body.numberOfGuests || 0,
            paymentStatus: "PENDING_VERIFICATION",
            pendingPaymentId: pending.id,
            requiresPayment: true,
            notes: JSON.stringify({
              contact: derivedContact,
              guestDetails: body.guestDetails,
              registrationDate: new Date().toISOString(),
            }),
          },
        });
      } catch (e: any) {
        if (typeof e?.message === "string" && e.message.includes("Unique constraint failed")) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "ALREADY_REGISTERED",
                message: "You are already registered for this event",
              },
            },
            { status: 409 }
          );
        }
        throw e;
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            registrationId: registration.id,
            status: registration.paymentStatus ?? "PENDING_VERIFICATION",
            pendingPaymentId: pending.id,
            message: "Registration ready. Payment details available on the registration page.",
          },
        },
        { status: 201 }
      );
    }

    // Free event: create a fresh registration (no PendingPayment)
    try {
      registration = await prisma.registration.create({
        data: {
          eventId,
          userId,
          status: "PENDING",
          groupSize: body.numberOfGuests || 0,
          paymentStatus: "PAYMENT_VERIFIED",
          requiresPayment: false,
          paymentMethod: "OTHER",
          paymentVerifiedAt: new Date(),
          notes: JSON.stringify({
            contact: derivedContact,
            guestDetails: body.guestDetails,
            registrationDate: new Date().toISOString(),
            freeEvent: true,
          }),
        },
      });
    } catch (e: any) {
      if (typeof e?.message === "string" && e.message.includes("Unique constraint failed")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "ALREADY_REGISTERED",
              message: "You are already registered for this event",
            },
          },
          { status: 409 }
        );
      }
      throw e;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          registrationId: registration.id,
          status: registration.paymentStatus ?? "PAYMENT_VERIFIED",
          message: "Registration completed for free event.",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
