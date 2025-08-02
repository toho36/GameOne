import { NextRequest, NextResponse } from "next/server";
import { verifyVercelCronSecret } from "@/lib/auth";
import { processScheduledNotifications } from "@/lib/notifications";

/**
 * Notifications Processing Cron Job
 * Runs every 15 minutes
 * Processes pending notifications, reminders, and automated messages
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

    console.log('📧 Starting notifications processing job...');
    const startTime = Date.now();

    // Process various types of notifications
    const notificationResults = await processScheduledNotifications({
      // Send event reminders (24h, 1h before events)
      eventReminders: true,
      
      // Process waiting list notifications when spots open
      waitingListPromotions: true,
      
      // Send registration confirmations
      registrationConfirmations: true,
      
      // Payment reminder notifications
      paymentReminders: true,
      
      // Weekly digest emails for active users
      weeklyDigests: false, // Only on specific days
      
      // Birthday notifications for users
      birthdayNotifications: false, // Daily job, not every 15min
      
      // Event feedback requests (sent 1 day after event)
      feedbackRequests: true,
      
      // Retry failed notifications (max 3 attempts)
      retryFailedNotifications: true,
      
      // System maintenance notifications
      systemNotifications: true,
    });

    const duration = Date.now() - startTime;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      message: "Notifications processing completed successfully",
      results: notificationResults,
    };

    console.log('✅ Notifications processing completed:', response);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ Notifications processing failed:', error);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        message: "Notifications processing failed",
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