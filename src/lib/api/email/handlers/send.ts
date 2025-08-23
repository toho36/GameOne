/**
 * Email sending handlers for GameOne
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { sendEmail, createEmailFromTemplate, validateEmailConfig } from "@/lib/email";
import type { EmailConfig } from "@/types/email";
import { sendEmailSchema, sendTemplateEmailSchema } from "@/lib/api/email/types";

/**
 * Handles basic email sending
 */
export async function handleSendEmail(body: any) {
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
export async function handleSendTemplateEmail(body: any) {
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
 * Handles email validation without sending
 */
export async function handleValidateEmail(body: any) {
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
