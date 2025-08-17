import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// QR code generation request schema
const qrRequestSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["EUR", "CZK"]),
  registrationId: z.string().min(1),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;
    const body = await request.json();

    // Validate request data
    const validatedData = qrRequestSchema.parse(body);

    // TODO: Implement proper authentication and authorization
    // - Verify user has access to this event
    // - Check if user is event organizer or has payment access

    // TODO: Fetch event and bank account details from database
    // const event = await db.event.findUnique({
    //   where: { id: eventId },
    //   include: { bankAccount: true }
    // });

    // For now, simulate secure server-side generation
    const variableSymbol = generateSecureVariableSymbol(eventId, validatedData.registrationId);

    // Generate QR code data securely on server
    const qrData = {
      iban: "SK8975000000000012345678", // TODO: Get from database
      amount: validatedData.amount,
      currency: validatedData.currency,
      variableSymbol,
      message: `Payment for Event ${eventId}`,
      // Add additional secure fields
      timestamp: new Date().toISOString(),
      checksum: generateChecksum(variableSymbol, validatedData.amount.toString()),
    };

    // TODO: Store payment request in database for tracking
    // await db.paymentRequest.create({
    //   data: {
    //     eventId,
    //     registrationId: validatedData.registrationId,
    //     amount: validatedData.amount,
    //     currency: validatedData.currency,
    //     variableSymbol,
    //     status: "PENDING"
    //   }
    // });

    return NextResponse.json({
      success: true,
      qrData,
      // Return QR code as base64 or URL for secure access
      qrCodeUrl: `/api/events/${eventId}/payment-qr/${variableSymbol}/image`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    // Log error for debugging in development
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("QR generation error:", error);
    }
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}

/**
 * Generate a secure variable symbol for Slovak banking
 * Combines event ID, registration ID, and timestamp for uniqueness
 */
function generateSecureVariableSymbol(eventId: string, registrationId: string): string {
  const timestamp = Date.now().toString().slice(-6);
  const eventHash = eventId.slice(-2);
  const regHash = registrationId.slice(-2);

  return `${timestamp}${eventHash}${regHash}`;
}

/**
 * Generate a checksum for payment verification
 */
function generateChecksum(variableSymbol: string, amount: string): string {
  const combined = `${variableSymbol}${amount}`;
  let checksum = 0;

  for (let i = 0; i < combined.length; i++) {
    checksum += combined.charCodeAt(i);
  }

  return (checksum % 97).toString().padStart(2, "0");
}
