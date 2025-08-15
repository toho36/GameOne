/**
 * Email service types and interfaces for Resend integration
 */

import type React from 'react';

/**
 * Email address type - can be string or object with name and email
 */
export type EmailAddress = string | { name: string; email: string };

/**
 * Email template data for dynamic content replacement
 */
export interface EmailTemplateData {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Base email configuration interface
 */
export interface BaseEmailConfig {
  /** Sender email address */
  from: EmailAddress;
  /** Recipient email address(es) */
  to: EmailAddress | EmailAddress[];
  /** Email subject line */
  subject: string;
  /** Optional CC recipients */
  cc?: EmailAddress | EmailAddress[];
  /** Optional BCC recipients */
  bcc?: EmailAddress | EmailAddress[];
  /** Optional reply-to address */
  replyTo?: EmailAddress;
  /** Optional email tags for categorization */
  tags?: Array<{ name: string; value: string }>;
  /** Optional email headers */
  headers?: Record<string, string>;
}

/**
 * Email configuration for plain text and HTML emails
 */
export interface TextEmailConfig extends BaseEmailConfig {
  /** Plain text content */
  text?: string;
  /** HTML content */
  html?: string;
}

/**
 * Email configuration using React components as templates
 */
export interface ReactEmailConfig extends BaseEmailConfig {
  /** React component to render as email */
  react: React.ReactElement;
}

/**
 * Email configuration using predefined templates
 */
export interface TemplateEmailConfig extends BaseEmailConfig {
  /** Template identifier */
  template: string;
  /** Data to populate template variables */
  templateData?: EmailTemplateData;
}

/**
 * Union type for all supported email configurations
 */
export type EmailConfig = TextEmailConfig | ReactEmailConfig | TemplateEmailConfig;

/**
 * Email sending result from Resend API
 */
export interface EmailSendResult {
  /** Unique email ID from Resend */
  id: string;
  /** Sender email address */
  from: string;
  /** Recipient email addresses */
  to: string[];
  /** Timestamp when email was created */
  createdAt: string;
}

/**
 * Email sending error from Resend API
 */
export interface EmailSendError {
  /** Error message */
  message: string;
  /** HTTP status code */
  statusCode?: number;
  /** Additional error details */
  details?: unknown;
}

/**
 * Result wrapper for email operations
 */
export type EmailResult<T> = 
  | { success: true; data: T }
  | { success: false; error: EmailSendError };

/**
 * Email validation result
 */
export interface EmailValidationResult {
  /** Whether the email configuration is valid */
  isValid: boolean;
  /** Validation error messages */
  errors: string[];
}

/**
 * Email template types supported by the application
 */
export const EmailTemplateType = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password-reset',
  EMAIL_VERIFICATION: 'email-verification',
  NOTIFICATION: 'notification',
  INVITATION: 'invitation',
  RECEIPT: 'receipt',
} as const;

export type EmailTemplateType = typeof EmailTemplateType[keyof typeof EmailTemplateType];

/**
 * Email priority levels
 */
export const EmailPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
} as const;

export type EmailPriority = typeof EmailPriority[keyof typeof EmailPriority];

/**
 * Extended email configuration with additional metadata
 */
export interface ExtendedEmailConfig extends BaseEmailConfig {
  /** Email priority level */
  priority?: EmailPriority;
  /** Whether to track email opens */
  trackOpens?: boolean;
  /** Whether to track link clicks */
  trackClicks?: boolean;
  /** Custom metadata for the email */
  metadata?: Record<string, string>;
  /** Scheduled send time (ISO string) */
  scheduledAt?: string;
}

/**
 * Email batch sending configuration
 */
export interface BatchEmailConfig {
  /** Array of email configurations to send */
  emails: EmailConfig[];
  /** Maximum number of concurrent sends */
  maxConcurrency?: number;
  /** Delay between batches in milliseconds */
  batchDelay?: number;
}

/**
 * Email batch result
 */
export interface BatchEmailResult {
  /** Total number of emails processed */
  total: number;
  /** Number of successfully sent emails */
  successful: number;
  /** Number of failed emails */
  failed: number;
  /** Detailed results for each email */
  results: Array<{
    index: number;
    result: EmailResult<EmailSendResult>;
  }>;
}

/**
 * Email service configuration
 */
export interface EmailServiceConfig {
  /** Resend API key */
  apiKey: string;
  /** Default sender email */
  defaultFrom?: EmailAddress;
  /** Default reply-to email */
  defaultReplyTo?: EmailAddress;
  /** Whether to enable test mode */
  testMode?: boolean;
  /** Rate limiting configuration */
  rateLimit?: {
    /** Maximum requests per minute */
    maxRequestsPerMinute: number;
    /** Maximum requests per hour */
    maxRequestsPerHour: number;
  };
}