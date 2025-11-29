/**
 * Email API types for GameOne
 */

import { z } from "zod";
import { EmailTemplateType, EmailPriority } from "@/types/global/email.types";

/**
 * Validation schema for email address
 */
export const emailAddressSchema = z.union([
  z.string().email("Invalid email address"),
  z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
  }),
]);

/**
 * Validation schema for basic email sending
 */
export const sendEmailSchema = z
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
  .refine((data) => data.text || data.html, {
    message: "Either text or html content is required",
  });

/**
 * Validation schema for template-based email sending
 */
export const sendTemplateEmailSchema = z.object({
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
export const batchEmailSchema = z.object({
  emails: z
    .array(sendEmailSchema)
    .min(1, "At least one email is required")
    .max(100, "Maximum 100 emails per batch"),
  maxConcurrency: z.number().int().min(1).max(10).optional(),
  batchDelay: z.number().int().min(0).max(5000).optional(),
});

/**
 * Email action types
 */
export type EmailAction = "send" | "send-template" | "send-batch" | "validate";

/**
 * Email API request body
 */
export interface EmailApiRequest {
  action?: EmailAction;
  [key: string]: any;
}

/**
 * Email API response
 */
export interface EmailApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  details?: any;
}
