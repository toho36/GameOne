/* eslint-disable no-console */
import type { NextRequest } from "next/server";

/**
 * Verifies that a cron request is coming from Vercel
 * Uses Vercel's cron secret for authentication
 */
export async function verifyVercelCronSecret(request: NextRequest): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return {
        success: false,
        error: "Missing authorization header"
      };
    }

    // Extract the bearer token
    const token = authHeader.replace('Bearer ', '');
    
    // Get the expected cron secret from environment
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret) {
      console.warn('CRON_SECRET environment variable not set');
      return {
        success: false,
        error: "Cron secret not configured"
      };
    }

    // Compare tokens
    if (token !== expectedSecret) {
      return {
        success: false,
        error: "Invalid cron secret"
      };
    }

    // Additional Vercel-specific headers verification
    const userAgent = request.headers.get('user-agent');
    const vercelSource = request.headers.get('x-vercel-source');
    
    // Verify it's coming from Vercel (optional additional security)
    if (process.env.NODE_ENV === 'production') {
      if (!userAgent?.includes('vercel') && !vercelSource) {
        return {
          success: false,
          error: "Request not from Vercel"
        };
      }
    }

    return { success: true };

  } catch (error) {
    console.error('Error verifying cron secret:', error);
    return {
      success: false,
      error: "Authentication error"
    };
  }
}

/**
 * Rate limiting for cron jobs to prevent abuse
 */
export function isRateLimited(_jobName: string, _windowMs: number = 60000): boolean {
  // In a real implementation, you'd use Redis or a database
  // For now, we'll use in-memory storage (not ideal for production)
  
  // This is a simplified implementation
  // In production, use Redis or database-backed rate limiting
  return false; // Allow all requests for now
}

/**
 * Log cron job execution for monitoring
 */
export async function logCronExecution(
  jobName: string, 
  success: boolean, 
  duration: number, 
  details?: Record<string, unknown>
): Promise<void> {
  const logEntry = {
    jobName,
    success,
    duration,
    timestamp: new Date().toISOString(),
    details,
  };

  // Log to console (in production, you might want to use a proper logging service)
  console.log('Cron job execution:', JSON.stringify(logEntry, null, 2));

  // TODO: In production, store this in your database for monitoring
  // await prisma.cronJobLog.create({ data: logEntry });
}