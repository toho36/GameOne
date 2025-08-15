/**
 * Resend email service configuration and client setup
 * 
 * This module provides a configured Resend client instance and related utilities
 * for sending emails through the Resend API service.
 */

import { Resend } from 'resend';
import type { EmailServiceConfig } from '@/types/email';

/**
 * Validates the Resend API key format
 * 
 * @param apiKey - The API key to validate
 * @returns True if the API key appears to be valid format
 */
function validateApiKey(apiKey: string): boolean {
  // Resend API keys start with 're_' and are at least 10 characters long
  return typeof apiKey === 'string' && 
         apiKey.startsWith('re_') && 
         apiKey.length >= 10;
}

/**
 * Gets the Resend API key from environment variables
 * 
 * @throws {Error} If RESEND_API_KEY is not configured or invalid
 * @returns The validated API key
 */
function getResendApiKey(): string {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY environment variable is not configured. ' +
      'Please add your Resend API key to your .env file.'
    );
  }
  
  if (!validateApiKey(apiKey)) {
    throw new Error(
      'Invalid RESEND_API_KEY format. ' +
      'Resend API keys should start with "re_" and be at least 10 characters long.'
    );
  }
  
  return apiKey;
}

/**
 * Creates email service configuration from environment variables and defaults
 * 
 * @returns Complete email service configuration
 */
export function createEmailServiceConfig(): EmailServiceConfig {
  const apiKey = getResendApiKey();
  
  return {
    apiKey,
    defaultFrom: process.env.DEFAULT_FROM_EMAIL || 'noreply@yourdomain.com',
    defaultReplyTo: process.env.DEFAULT_REPLY_TO_EMAIL,
    testMode: process.env.NODE_ENV === 'test' || process.env.EMAIL_TEST_MODE === 'true',
    rateLimit: {
      maxRequestsPerMinute: parseInt(process.env.EMAIL_RATE_LIMIT_PER_MINUTE || '10', 10),
      maxRequestsPerHour: parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '100', 10),
    },
  };
}

/**
 * Singleton Resend client instance
 * 
 * This ensures we only create one Resend client throughout the application
 * lifecycle, which is more efficient and prevents potential issues with
 * multiple client instances.
 */
let resendClient: Resend | null = null;

/**
 * Gets or creates the Resend client instance
 * 
 * @returns Configured Resend client
 * @throws {Error} If unable to initialize the client
 */
export function getResendClient(): Resend {
  if (!resendClient) {
    try {
      const apiKey = getResendApiKey();
      resendClient = new Resend(apiKey);
    } catch (error) {
      throw new Error(
        `Failed to initialize Resend client: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  return resendClient;
}

/**
 * Creates a new Resend client with custom configuration
 * 
 * This is useful for testing or when you need a client with different
 * configuration than the default singleton.
 * 
 * @param config - Custom email service configuration
 * @returns New Resend client instance
 */
export function createResendClient(config: EmailServiceConfig): Resend {
  if (!validateApiKey(config.apiKey)) {
    throw new Error('Invalid API key provided to createResendClient');
  }
  
  return new Resend(config.apiKey);
}

/**
 * Checks if the Resend service is properly configured and available
 * 
 * This function performs basic validation without making API calls.
 * For a full health check that tests API connectivity, use the
 * email utilities in lib/email.ts
 * 
 * @returns Object indicating configuration status and any issues
 */
export function checkResendConfiguration(): {
  isConfigured: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  try {
    const config = createEmailServiceConfig();
    
    if (!config.apiKey) {
      issues.push('RESEND_API_KEY is not configured');
    }
    
    if (!validateApiKey(config.apiKey)) {
      issues.push('RESEND_API_KEY format is invalid');
    }
    
    if (!config.defaultFrom) {
      issues.push('DEFAULT_FROM_EMAIL is not configured (recommended)');
    }
    
  } catch (error) {
    issues.push(error instanceof Error ? error.message : 'Unknown configuration error');
  }
  
  return {
    isConfigured: issues.length === 0,
    issues,
  };
}

/**
 * Resets the singleton Resend client
 * 
 * This is primarily useful for testing scenarios where you need to
 * reinitialize the client with different configuration.
 */
export function resetResendClient(): void {
  resendClient = null;
}

/**
 * Default export: the singleton Resend client
 * 
 * Import this when you need to use the Resend client directly:
 * ```typescript
 * import resend from '@/lib/resend';
 * await resend.emails.send({ ... });
 * ```
 */
const resend = getResendClient();
export default resend;