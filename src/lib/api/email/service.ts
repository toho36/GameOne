/**
 * Email service for GameOne - handles business logic
 */

import { NextRequest, NextResponse } from "next/server";
import { checkResendConfiguration } from "@/lib/resend";
import { checkRateLimit, rateLimitConfig } from "./rate-limiter";
import { handleSendEmail, handleSendTemplateEmail, handleValidateEmail } from "./handlers/send";
import { handleSendBatchEmails } from "./handlers/batch";
import type { EmailApiRequest } from "./types";

/**
 * Main email service that handles all email operations
 */
export class EmailService {
  /**
   * Process email request based on action
   */
  async processEmailRequest(request: NextRequest, body: EmailApiRequest) {
    // Check Resend configuration
    const configCheck = checkResendConfiguration();
    if (!configCheck.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: "Email service is not properly configured",
          details: configCheck.issues,
        },
        { status: 500 }
      );
    }

    // Check rate limits
    if (!checkRateLimit(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
    }

    const action = body.action || "send";

    switch (action) {
      case "send":
        return await handleSendEmail(body);
      case "send-template":
        return await handleSendTemplateEmail(body);
      case "send-batch":
        return await handleSendBatchEmails(body);
      case "validate":
        return await handleValidateEmail(body);
      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
          },
          { status: 400 }
        );
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    const configCheck = checkResendConfiguration();

    return {
      service: "Email API",
      status: configCheck.isConfigured ? "healthy" : "unhealthy",
      configuration: configCheck,
      rateLimit: rateLimitConfig,
      timestamp: new Date().toISOString(),
    };
  }
}

export const emailService = new EmailService();
