/**
 * Email API endpoint - Thin handler for GameOne
 * Refactored from 466 lines to <100 lines following project standards
 */

import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/api/email/service";
import { logger } from "@/lib/logger";

/**
 * Handles POST requests for sending emails
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      logger.error("JSON parsing error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          details: { message: error instanceof Error ? error.message : "Unknown JSON error" },
        },
        { status: 400 }
      );
    }

    // Delegate to email service
    return await emailService.processEmailRequest(request, body);
  } catch (error) {
    logger.error("Email API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Handles GET requests for service health check
 */
export async function GET() {
  try {
    const healthStatus = emailService.getHealthStatus();

    return NextResponse.json(healthStatus, {
      status: healthStatus.status === "healthy" ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        service: "Email API",
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
