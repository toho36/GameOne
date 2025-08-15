/**
 * Email sending API endpoint using Resend service
 *
 * This endpoint provides a secure, rate-limited way to send emails through
 * the Resend service with proper validation and error handling.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  sendEmail,
  sendBatchEmails,
  createEmailFromTemplate,
  validateEmailConfig,
} from "@/lib/email";
import { checkResendConfiguration } from "@/lib/resend";
import {
  EmailTemplateType,
  EmailPriority,
  type EmailConfig,
  type BatchEmailConfig,
} from "@/types/email";

/**
 * Validation schema for email address
 */
const emailAddressSchema = z.union([
  z.string().email("Invalid email address"),
  z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
  }),
]);

/**
 * Validation schema for basic email sending
 */
const sendEmailSchema = z
  .object({
    from: emailAddressSchema.optional(),
    to: z.union([emailAddressSchema, z.array(emailAddressSchema)]),
    subject: z.string().min(1, "Subject is required"),
    text: z.string().optional(),
    html: z.string().optional(),
    cc: z.union([emailAddressSchema, z.array(emailAddressSchema)]).optional(),
    bcc: z.union([emailAddressSchema, z.array(emailAddressSchema)]).optional(),
    replyTo: emailAddressSchema.optional(),
    tags: z
      .array(
        z.object({
          name: z.string(),
          value: z.string(),
        })
      )
      .optional(),
    headers: z.record(z.string(), z.string()).optional(),
  })
  .refine((data) => data.text || data.html, { message: "Either text or html content is required" });

/**
 * Validation schema for template-based email sending
 */
const sendTemplateEmailSchema = z.object({
  to: z.union([emailAddressSchema, z.array(emailAddressSchema)]),
  template: z.enum([
    EmailTemplateType.WELCOME,
    EmailTemplateType.PASSWORD_RESET,
    EmailTemplateType.EMAIL_VERIFICATION,
    EmailTemplateType.NOTIFICATION,
    EmailTemplateType.INVITATION,
    EmailTemplateType.RECEIPT,
  ]),
  subject: z.string().optional(),
  templateData: z.record(z.string(), z.any()).optional(),
  from: emailAddressSchema.optional(),
  priority: z.enum([EmailPriority.LOW, EmailPriority.NORMAL, EmailPriority.HIGH]).optional(),
});

/**
 * Validation schema for batch email sending
 */
const batchEmailSchema = z.object({
  emails: z
    .array(sendEmailSchema)
    .min(1, "At least one email is required")
    .max(100, "Maximum 100 emails per batch"),
  maxConcurrency: z.number().int().min(1).max(10).optional(),
  batchDelay: z.number().int().min(0).max(5000).optional(),
});

/**
 * Rate limiting configuration
 */
const rateLimitConfig = {
  maxRequestsPerMinute: 10,
  maxRequestsPerHour: 100,
};

/**
 * Simple in-memory rate limiter
 * Note: In production, use Redis or a proper rate limiting service
 */
class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Checks if a request is within rate limits
   *
   * @param key - Identifier for the client (IP, user ID, etc.)
   * @param windowMs - Time window in milliseconds
   * @param maxRequests - Maximum requests in the window
   * @returns True if request is allowed
   */
  isAllowed(key: string, windowMs: number, maxRequests: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove requests outside the window
    const validRequests = requests.filter((time) => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }
}

const rateLimiter = new SimpleRateLimiter();

/**
 * Extracts client identifier for rate limiting
 *
 * @param request - The incoming request
 * @returns Client identifier string
 */
function getClientId(request: NextRequest): string {
  // Try to get IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";

  // In production, you might want to use user ID if authenticated
  return `ip:${ip}`;
}

/**
 * Validates rate limits for the request
 *
 * @param request - The incoming request
 * @returns True if request is within limits
 */
function checkRateLimit(request: NextRequest): boolean {
  const clientId = getClientId(request);

  // Check per-minute limit
  if (!rateLimiter.isAllowed(clientId, 60 * 1000, rateLimitConfig.maxRequestsPerMinute)) {
    return false;
  }

  // Check per-hour limit
  if (
    !rateLimiter.isAllowed(`${clientId}:hour`, 60 * 60 * 1000, rateLimitConfig.maxRequestsPerHour)
  ) {
    return false;
  }

  return true;
}

/**
 * Handles POST requests for sending emails
 */
export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("JSON parsing error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          details: { message: error instanceof Error ? error.message : "Unknown JSON error" },
        },
        { status: 400 }
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
  } catch (error) {
    console.error("Email API error:", error);

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
 * Handles basic email sending
 */
async function handleSendEmail(body: any) {
  try {
    const validatedData = sendEmailSchema.parse(body);

    const emailConfig: EmailConfig = {
      from: validatedData.from || process.env["DEFAULT_FROM_EMAIL"] || "noreply@yourdomain.com",
      to: validatedData.to,
      subject: validatedData.subject,
      ...(validatedData.text && { text: validatedData.text }),
      ...(validatedData.html && { html: validatedData.html }),
      ...(validatedData.cc && { cc: validatedData.cc }),
      ...(validatedData.bcc && { bcc: validatedData.bcc }),
      ...(validatedData.replyTo && { replyTo: validatedData.replyTo }),
      ...(validatedData.tags && { tags: validatedData.tags }),
      ...(validatedData.headers && { headers: validatedData.headers as Record<string, string> }),
    };

    const result = await sendEmail(emailConfig);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error.message,
          details: result.error.details,
        },
        { status: result.error.statusCode || 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    throw error;
  }
}

/**
 * Handles template-based email sending
 */
async function handleSendTemplateEmail(body: any) {
  try {
    const validatedData = sendTemplateEmailSchema.parse(body);

    const emailConfig = createEmailFromTemplate(validatedData.template, {
      to: validatedData.to,
      ...(validatedData.subject && { subject: validatedData.subject }),
      ...(validatedData.templateData && { templateData: validatedData.templateData }),
      ...(validatedData.from && { from: validatedData.from }),
      ...(validatedData.priority && { priority: validatedData.priority }),
    });

    const result = await sendEmail(emailConfig);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error.message,
          details: result.error.details,
        },
        { status: result.error.statusCode || 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    throw error;
  }
}

/**
 * Handles batch email sending
 */
async function handleSendBatchEmails(body: any) {
  try {
    const validatedData = batchEmailSchema.parse(body);

    const batchConfig: BatchEmailConfig = {
      emails: validatedData.emails.map((email) => ({
        from: email.from || process.env["DEFAULT_FROM_EMAIL"] || "noreply@yourdomain.com",
        to: email.to,
        subject: email.subject,
        ...(email.text && { text: email.text }),
        ...(email.html && { html: email.html }),
        ...(email.cc && { cc: email.cc }),
        ...(email.bcc && { bcc: email.bcc }),
        ...(email.replyTo && { replyTo: email.replyTo }),
        ...(email.tags && { tags: email.tags }),
        ...(email.headers && { headers: email.headers as Record<string, string> }),
      })),
      ...(validatedData.maxConcurrency && { maxConcurrency: validatedData.maxConcurrency }),
      ...(validatedData.batchDelay && { batchDelay: validatedData.batchDelay }),
    };

    const result = await sendBatchEmails(batchConfig);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    throw error;
  }
}

/**
 * Handles email validation without sending
 */
async function handleValidateEmail(body: any) {
  try {
    const validatedData = sendEmailSchema.parse(body);

    const emailConfig: EmailConfig = {
      from: validatedData.from || process.env["DEFAULT_FROM_EMAIL"] || "noreply@yourdomain.com",
      to: validatedData.to,
      subject: validatedData.subject,
      ...(validatedData.text && { text: validatedData.text }),
      ...(validatedData.html && { html: validatedData.html }),
      ...(validatedData.cc && { cc: validatedData.cc }),
      ...(validatedData.bcc && { bcc: validatedData.bcc }),
      ...(validatedData.replyTo && { replyTo: validatedData.replyTo }),
      ...(validatedData.tags && { tags: validatedData.tags }),
      ...(validatedData.headers && { headers: validatedData.headers as Record<string, string> }),
    };

    const validation = validateEmailConfig(emailConfig);

    return NextResponse.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    throw error;
  }
}

/**
 * Handles GET requests for service health check
 */
export async function GET() {
  try {
    const configCheck = checkResendConfiguration();

    return NextResponse.json({
      service: "Email API",
      status: configCheck.isConfigured ? "healthy" : "unhealthy",
      configuration: configCheck,
      rateLimit: rateLimitConfig,
      timestamp: new Date().toISOString(),
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
