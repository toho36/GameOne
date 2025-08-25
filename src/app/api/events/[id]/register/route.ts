import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CreateRegistrationRequest } from "@/types/features/event-registration";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;
    const body: CreateRegistrationRequest = await request.json();

    // Validate event exists and is open for registration
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: { status: "CONFIRMED" },
          select: { id: true },
        },
        _count: {
          select: {
            registrations: {
              where: { status: "CONFIRMED" },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EVENT_NOT_FOUND",
            message: "Event not found",
          },
        },
        { status: 404 }
      );
    }

    if (event.status !== "PUBLISHED") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EVENT_NOT_OPEN",
            message: "Event is not open for registration",
          },
        },
        { status: 400 }
      );
    }

    // Check if event is full
    if (event.capacity) {
      const confirmedRegistrations = event._count.registrations;
      if (confirmedRegistrations >= event.capacity) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "EVENT_FULL",
              message: "Event is full",
            },
          },
          { status: 400 }
        );
      }
    }

    // Check registration dates
    const now = new Date();
    const registrationStart = event.registrationStartDate || event.createdAt;
    const registrationEnd = event.registrationEndDate || event.startDate;

    if (now < registrationStart || now > registrationEnd) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "REGISTRATION_CLOSED",
            message: "Registration is not open at this time",
          },
        },
        { status: 400 }
      );
    }

    // Validate guest count - using a reasonable default since maxGuestsPerRegistration is not in schema
    if (body.numberOfGuests > 10) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TOO_MANY_GUESTS",
            message: "Maximum 10 guests allowed per registration",
          },
        },
        { status: 400 }
      );
    }

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        eventId,
        userId: "anonymous", // TODO: Get from authenticated user
        status: "PENDING",
        groupSize: body.numberOfGuests,
        specialRequests: body.specialRequirements,
        notes: JSON.stringify({
          emergencyContact: body.emergencyContact,
          marketingConsent: body.marketingConsent,
          acceptedTerms: body.acceptedTerms,
          guestDetails: body.guestDetails,
          registrationDate: new Date().toISOString(),
        }),
      },
    });

    // Store guest details in metadata since GuestRegistration model doesn't exist
    // Guest information will be stored in the registration metadata

    // Note: Payment creation is skipped for anonymous registrations
    // In a real implementation, you would create a PendingPayment record instead

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          registrationId: registration.id,
          status: "PENDING",
          message: "Registration successful!",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          version: "1.0.0",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
