/**
 * Batch email sending handler for GameOne
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { sendBatchEmails } from "@/lib/email";
import type { BatchEmailConfig } from "@/types/email";
import { batchEmailSchema } from "@/lib/api/email/types";

/**
 * Handles batch email sending
 */
export async function handleSendBatchEmails(body: any) {
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
