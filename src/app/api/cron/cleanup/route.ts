import { NextResponse, type NextRequest } from "next/server";
import { verifyVercelCronSecret } from "@/lib/auth";
import { performDatabaseCleanup } from "@/lib/cleanup";

/**
 * Database Cleanup Cron Job
 * Runs daily at 2:00 AM UTC
 * Cleans up expired data, old logs, and orphaned records
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate Vercel cron request
    const authResult = await verifyVercelCronSecret(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: "Unauthorized", message: authResult.error },
        { status: 401 }
      );
    }

     
    console.log('🧹 Starting database cleanup job...');
    const startTime = Date.now();

    // Perform cleanup operations
    const cleanupResults = await performDatabaseCleanup({
      // Clean up expired user roles (older than 30 days)
      expiredUserRoles: true,
      
      // Remove old audit logs (older than 90 days)
      oldAuditLogs: true,
      
      // Clean up failed payment records (older than 7 days)
      failedPayments: true,
      
      // Remove expired waiting list entries (event ended + 7 days)
      expiredWaitingList: true,
      
      
      // Remove cancelled registrations (older than 30 days)
      cancelledRegistrations: true,
      
      // Clean up notification logs (older than 60 days)
      oldNotificationLogs: true,
      
      // Optimize database (VACUUM, ANALYZE)
      optimizeDatabase: true,
    });

    const duration = Date.now() - startTime;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      message: "Database cleanup completed successfully",
      results: cleanupResults,
    };

     
    console.log('✅ Database cleanup completed:', response);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        message: "Database cleanup failed",
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Only allow GET requests
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}