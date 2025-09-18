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
  emergencyContact: z
    .object({
      name: z.string().min(1),
      phone: z.string().min(3),
      email: z.string().email().optional(),
    })
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

    // Derive emergency contact from authenticated user if not provided in payload
    const userProfile = auth.data.user as any;
    const derivedEmergencyContact = body.emergencyContact ?? {
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

    // If event requires payment, create or reuse pending payment and link; otherwise auto-verify (free events)
    let registration;
    if (event.requiresPayment && event.price) {
      // Create pending payment; if unique constraint fails, reuse existing
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
        // Unique constraint on (userId, eventId, type)
        if (typeof e?.message === "string" && e.message.includes("Unique constraint failed")) {
          pending = await prisma.pendingPayment.findFirst({
            where: { userId, eventId: event.id, type: "REGISTRATION" },
          });
          if (!pending) throw new Error("PENDING_PAYMENT_NOT_FOUND");
        } else {
          throw e;
        }
      }

      // Create registration; if exists, reuse and ensure it links to pending payment
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
              emergencyContact: derivedEmergencyContact,
              guestDetails: body.guestDetails,
              registrationDate: new Date().toISOString(),
            }),
          },
        });
      } catch (e: any) {
        if (typeof e?.message === "string" && e.message.includes("Unique constraint failed")) {
          registration = await prisma.registration.findFirst({ where: { eventId, userId } });
          if (!registration) throw e;
          if (!registration.pendingPaymentId) {
            registration = await prisma.registration.update({
              where: { id: registration.id },
              data: {
                pendingPaymentId: pending.id,
                paymentStatus: registration.paymentStatus ?? "PENDING_VERIFICATION",
              },
            });
          }
        } else {
          throw e;
        }
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

    // Free event: immediately take a spot by marking payment verified (no PendingPayment)
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
            emergencyContact: derivedEmergencyContact,
            guestDetails: body.guestDetails,
            registrationDate: new Date().toISOString(),
            freeEvent: true,
          }),
        },
      });
    } catch (e: any) {
      if (typeof e?.message === "string" && e.message.includes("Unique constraint failed")) {
        registration = await prisma.registration.findFirst({ where: { eventId, userId } });
        if (!registration) throw e;
      } else {
        throw e;
      }
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
