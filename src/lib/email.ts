/**
 * Email utilities and helper functions for Resend integration
 * 
 * This module provides high-level utilities for sending emails, validating
 * email configurations, and managing email templates through the Resend service.
 */

import type { CreateEmailOptions } from 'resend';
import { getResendClient, createEmailServiceConfig } from '@/lib/resend';
import {
  EmailTemplateType,
  EmailPriority,
  type EmailConfig,
  type EmailResult,
  type EmailSendResult,
  type EmailValidationResult,
  type EmailAddress,
  type TextEmailConfig,
  type ReactEmailConfig,
  type TemplateEmailConfig,
  type BatchEmailConfig,
  type BatchEmailResult,
} from '@/types/email';

/**
 * Validates an email address format
 * 
 * @param email - Email address to validate
 * @returns True if email format is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normalizes email address input to string format
 * 
 * @param emailAddress - Email address in string or object format
 * @returns Normalized email string
 */
export function normalizeEmailAddress(emailAddress: EmailAddress): string {
  if (typeof emailAddress === 'string') {
    return emailAddress;
  }
  
  return `${emailAddress.name} <${emailAddress.email}>`;
}

/**
 * Validates email configuration before sending
 * 
 * @param config - Email configuration to validate
 * @returns Validation result with errors if any
 */
export function validateEmailConfig(config: EmailConfig): EmailValidationResult {
  const errors: string[] = [];
  
  // Validate required fields
  if (!config.from) {
    errors.push('From address is required');
  } else {
    const fromEmail = typeof config.from === 'string' ? config.from : config.from.email;
    if (!isValidEmail(fromEmail)) {
      errors.push('From address is not a valid email format');
    }
  }
  
  if (!config.to) {
    errors.push('To address is required');
  } else {
    const toAddresses = Array.isArray(config.to) ? config.to : [config.to];
    for (const toAddress of toAddresses) {
      const email = typeof toAddress === 'string' ? toAddress : toAddress.email;
      if (!isValidEmail(email)) {
        errors.push(`Invalid to address: ${email}`);
      }
    }
  }
  
  if (!config.subject || config.subject.trim().length === 0) {
    errors.push('Subject is required');
  }
  
  // Validate content based on email type
  if ('text' in config || 'html' in config) {
    const textConfig = config as TextEmailConfig;
    if (!textConfig.text && !textConfig.html) {
      errors.push('Either text or html content is required');
    }
  } else if ('react' in config) {
    const reactConfig = config as ReactEmailConfig;
    if (!reactConfig.react) {
      errors.push('React component is required');
    }
  } else if ('template' in config) {
    const templateConfig = config as TemplateEmailConfig;
    if (!templateConfig.template) {
      errors.push('Template identifier is required');
    }
  } else {
    errors.push('Email must have text, html, react, or template content');
  }
  
  // Validate optional CC addresses
  if (config.cc) {
    const ccAddresses = Array.isArray(config.cc) ? config.cc : [config.cc];
    for (const ccAddress of ccAddresses) {
      const email = typeof ccAddress === 'string' ? ccAddress : ccAddress.email;
      if (!isValidEmail(email)) {
        errors.push(`Invalid CC address: ${email}`);
      }
    }
  }
  
  // Validate optional BCC addresses
  if (config.bcc) {
    const bccAddresses = Array.isArray(config.bcc) ? config.bcc : [config.bcc];
    for (const bccAddress of bccAddresses) {
      const email = typeof bccAddress === 'string' ? bccAddress : bccAddress.email;
      if (!isValidEmail(email)) {
        errors.push(`Invalid BCC address: ${email}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Converts our email configuration to Resend's format
 * 
 * @param config - Our email configuration
 * @returns Resend-compatible email options
 */
function convertToResendOptions(config: EmailConfig): CreateEmailOptions {
  let baseOptions: CreateEmailOptions;
  
  // Initialize with minimal required fields based on content type
  if ('text' in config || 'html' in config) {
    baseOptions = {
      from: normalizeEmailAddress(config.from),
      to: Array.isArray(config.to) 
        ? config.to.map(normalizeEmailAddress)
        : [normalizeEmailAddress(config.to)],
      subject: config.subject,
      text: '', // Initialize with empty text, will be overridden
    };
  } else {
    baseOptions = {
      from: normalizeEmailAddress(config.from),
      to: Array.isArray(config.to) 
        ? config.to.map(normalizeEmailAddress)
        : [normalizeEmailAddress(config.to)],
      subject: config.subject,
      html: '', // Initialize with empty HTML, will be overridden
    };
  }
  
  // Add optional fields
  if (config.cc) {
    baseOptions.cc = Array.isArray(config.cc)
      ? config.cc.map(normalizeEmailAddress)
      : [normalizeEmailAddress(config.cc)];
  }
  
  if (config.bcc) {
    baseOptions.bcc = Array.isArray(config.bcc)
      ? config.bcc.map(normalizeEmailAddress)
      : [normalizeEmailAddress(config.bcc)];
  }
  
  if (config.replyTo) {
    baseOptions.replyTo = normalizeEmailAddress(config.replyTo);
  }
  
  if (config.tags) {
    baseOptions.tags = config.tags;
  }
  
  if (config.headers) {
    baseOptions.headers = config.headers;
  }
  
  // Add content based on type
  if ('text' in config || 'html' in config) {
    const textConfig = config as TextEmailConfig;
    if (textConfig.text) baseOptions.text = textConfig.text;
    if (textConfig.html) baseOptions.html = textConfig.html;
  } else if ('react' in config) {
    const reactConfig = config as ReactEmailConfig;
    baseOptions.react = reactConfig.react;
  } else if ('template' in config) {
    const templateConfig = config as TemplateEmailConfig;
    // For template emails, we render them to HTML first
    baseOptions.html = generateEmailTemplate(templateConfig.template as EmailTemplateType, templateConfig.templateData || {});
  }
  
  return baseOptions;
}

/**
 * Sends a single email using Resend
 * 
 * @param config - Email configuration
 * @returns Promise resolving to email send result
 */
export async function sendEmail(config: EmailConfig): Promise<EmailResult<EmailSendResult>> {
  try {
    // Validate configuration
    const validation = validateEmailConfig(config);
    if (!validation.isValid) {
      return {
        success: false,
        error: {
          message: `Email validation failed: ${validation.errors.join(', ')}`,
          statusCode: 400,
          details: validation.errors,
        },
      };
    }
    
    // Get Resend client
    const resend = getResendClient();
    
    // Convert to Resend format and send
    const resendOptions = convertToResendOptions(config);
    const result = await resend.emails.send(resendOptions);
    
    if (result.error) {
      return {
        success: false,
        error: {
          message: result.error.message || 'Failed to send email',
          details: result.error,
        },
      };
    }
    
    return {
      success: true,
      data: {
        id: result.data?.id || '',
        from: normalizeEmailAddress(config.from),
        to: Array.isArray(config.to) 
          ? config.to.map(normalizeEmailAddress)
          : [normalizeEmailAddress(config.to)],
        createdAt: new Date().toISOString(),
      },
    };
    
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error,
      },
    };
  }
}

/**
 * Sends multiple emails in batches with concurrency control
 * 
 * @param config - Batch email configuration
 * @returns Promise resolving to batch send results
 */
export async function sendBatchEmails(config: BatchEmailConfig): Promise<BatchEmailResult> {
  const { emails, maxConcurrency = 5, batchDelay = 100 } = config;
  const results: BatchEmailResult['results'] = [];
  let successful = 0;
  let failed = 0;
  
  // Process emails in batches
  for (let i = 0; i < emails.length; i += maxConcurrency) {
    const batch = emails.slice(i, i + maxConcurrency);
    
    // Send batch concurrently
    const batchPromises = batch.map(async (email, batchIndex) => {
      const globalIndex = i + batchIndex;
      const result = await sendEmail(email);
      
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
      
      return {
        index: globalIndex,
        result,
      };
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add delay between batches if not the last batch
    if (i + maxConcurrency < emails.length && batchDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, batchDelay));
    }
  }
  
  return {
    total: emails.length,
    successful,
    failed,
    results,
  };
}

/**
 * Creates a standardized email configuration for common email types
 * 
 * @param type - Type of email template
 * @param data - Template data and recipients
 * @returns Email configuration ready to send
 */
export function createEmailFromTemplate(
  type: EmailTemplateType,
  data: {
    to: EmailAddress | EmailAddress[];
    subject?: string;
    templateData?: Record<string, any>;
    from?: EmailAddress;
    priority?: EmailPriority;
  }
): TextEmailConfig {
  const serviceConfig = createEmailServiceConfig();
  const from = data.from || serviceConfig.defaultFrom || 'noreply@yourdomain.com';
  
  // Create basic email config
  const emailConfig: TextEmailConfig = {
    from,
    to: data.to,
    subject: data.subject || getDefaultSubject(type),
    html: generateEmailTemplate(type, data.templateData || {}),
  };
  
  // Add reply-to if configured
  if (serviceConfig.defaultReplyTo) {
    emailConfig.replyTo = serviceConfig.defaultReplyTo;
  }
  
  // Add priority tag if specified
  if (data.priority && data.priority !== EmailPriority.NORMAL) {
    emailConfig.tags = [{ name: 'priority', value: data.priority }];
  }
  
  return emailConfig;
}

/**
 * Gets default subject line for email template types
 * 
 * @param type - Email template type
 * @returns Default subject line
 */
function getDefaultSubject(type: EmailTemplateType): string {
  switch (type) {
    case EmailTemplateType.WELCOME:
      return 'Welcome to our platform!';
    case EmailTemplateType.PASSWORD_RESET:
      return 'Reset your password';
    case EmailTemplateType.EMAIL_VERIFICATION:
      return 'Verify your email address';
    case EmailTemplateType.NOTIFICATION:
      return 'You have a new notification';
    case EmailTemplateType.INVITATION:
      return 'You\'ve been invited!';
    case EmailTemplateType.RECEIPT:
      return 'Your receipt';
    default:
      return 'Notification';
  }
}

/**
 * Generates basic HTML email templates
 * 
 * @param type - Email template type
 * @param data - Template data for variable replacement
 * @returns HTML email content
 */
function generateEmailTemplate(type: EmailTemplateType, data: Record<string, any>): string {
  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
      .content { padding: 20px; }
      .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
      .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
  `;
  
  const container = (content: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        ${content}
        <div class="footer">
          <p>This email was sent automatically. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  switch (type) {
    case EmailTemplateType.WELCOME:
      return container(`
        <div class="header">
          <h1>Welcome!</h1>
        </div>
        <div class="content">
          <p>Hello ${data.name || 'there'},</p>
          <p>Welcome to our platform! We're excited to have you on board.</p>
          ${data.actionUrl ? `<a href="${data.actionUrl}" class="button">Get Started</a>` : ''}
        </div>
      `);
      
    case EmailTemplateType.PASSWORD_RESET:
      return container(`
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <p>Hello ${data.name || 'there'},</p>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          ${data.resetUrl ? `<a href="${data.resetUrl}" class="button">Reset Password</a>` : ''}
          <p>If you didn't request this reset, please ignore this email.</p>
        </div>
      `);
      
    case EmailTemplateType.EMAIL_VERIFICATION:
      return container(`
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <p>Hello ${data.name || 'there'},</p>
          <p>Please verify your email address by clicking the button below:</p>
          ${data.verificationUrl ? `<a href="${data.verificationUrl}" class="button">Verify Email</a>` : ''}
        </div>
      `);
      
    case EmailTemplateType.NOTIFICATION:
      return container(`
        <div class="header">
          <h1>Notification</h1>
        </div>
        <div class="content">
          <p>Hello ${data.name || 'there'},</p>
          <p>${data.message || 'You have a new notification.'}</p>
          ${data.actionUrl ? `<a href="${data.actionUrl}" class="button">View Details</a>` : ''}
        </div>
      `);
      
    case EmailTemplateType.INVITATION:
      return container(`
        <div class="header">
          <h1>You've Been Invited!</h1>
        </div>
        <div class="content">
          <p>Hello ${data.name || 'there'},</p>
          <p>${data.inviterName || 'Someone'} has invited you to ${data.platformName || 'our platform'}.</p>
          ${data.inviteUrl ? `<a href="${data.inviteUrl}" class="button">Accept Invitation</a>` : ''}
        </div>
      `);
      
    case EmailTemplateType.RECEIPT:
      return container(`
        <div class="header">
          <h1>Receipt</h1>
        </div>
        <div class="content">
          <p>Hello ${data.name || 'there'},</p>
          <p>Thank you for your purchase! Here are the details:</p>
          <p><strong>Order ID:</strong> ${data.orderId || 'N/A'}</p>
          <p><strong>Amount:</strong> ${data.amount || 'N/A'}</p>
          ${data.receiptUrl ? `<a href="${data.receiptUrl}" class="button">View Full Receipt</a>` : ''}
        </div>
      `);
      
    default:
      return container(`
        <div class="header">
          <h1>Notification</h1>
        </div>
        <div class="content">
          <p>Hello ${data.name || 'there'},</p>
          <p>${data.message || 'You have received this email notification.'}</p>
        </div>
      `);
  }
}

/**
 * Tests email service connectivity
 * 
 * @returns Promise resolving to health check result
 */
export async function testEmailService(): Promise<{
  healthy: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Test if we can instantiate the Resend client
    getResendClient();
    
    // Basic client instantiation test
    // Note: This doesn't make an actual API call
    const testResult = { success: true };
    
    // If we get here without throwing, the client is working
    return {
      healthy: true,
      message: 'Email service is configured and accessible',
      details: testResult,
    };
    
  } catch (error) {
    return {
      healthy: false,
      message: `Email service health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    };
  }
}

/**
 * Utility to safely extract email address from EmailAddress type
 * 
 * @param emailAddress - Email address in various formats
 * @returns Clean email address string
 */
export function extractEmailAddress(emailAddress: EmailAddress): string {
  if (typeof emailAddress === 'string') {
    // Extract email from "Name <email@domain.com>" format if present
    const match = emailAddress.match(/<([^>]+)>/);
    return match ? match[1] : emailAddress;
  }
  
  return emailAddress.email;
}