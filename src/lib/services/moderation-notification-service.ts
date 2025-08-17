import { sendEmail, createEmailFromTemplate } from "@/lib/email";
import { logger } from "@/lib/logger";
import { EmailTemplateType, type EmailAddress } from "@/types/email";

export interface ModerationNotificationData {
  eventTitle: string;
  eventId: string;
  creatorName: string;
  creatorEmail: string;
  adminName?: string;
  reason?: string | undefined;
  actionUrl?: string;
}

export interface ModerationEmailConfig {
  from?: EmailAddress;
  replyTo?: EmailAddress;
}

/**
 * Sends email notification when an event is approved
 */
export async function sendEventApprovedNotification(
  data: ModerationNotificationData,
  config?: ModerationEmailConfig
) {
  try {
    const emailConfig = createEmailFromTemplate(EmailTemplateType.NOTIFICATION, {
      to: { email: data.creatorEmail, name: data.creatorName },
      subject: `Event Approved: ${data.eventTitle}`,
      from: config?.from || { email: "noreply@gameone.com", name: "GameOne" },
      templateData: {
        name: data.creatorName,
        message: `Great news! Your event "${data.eventTitle}" has been approved and is now published.`,
        actionUrl: data.actionUrl || `/events/${data.eventId}`,
        eventTitle: data.eventTitle,
        status: "approved",
      },
    });

    if (config?.replyTo) {
      emailConfig.replyTo = config.replyTo;
    }

    // Add HTML template for approved events
    emailConfig.html = generateModerationEmailTemplate("APPROVED", data);

    const result = await sendEmail(emailConfig);

    if (result.success) {
      logger.info(`Event approved notification sent to ${data.creatorEmail}`, {
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        emailId: result.data?.id,
      });
    } else {
      logger.error(`Failed to send event approved notification to ${data.creatorEmail}`, {
        eventId: data.eventId,
        error: result.error?.message,
      });
    }

    return result;
  } catch (error) {
    logger.error("Error sending event approved notification:", error);
    throw error;
  }
}

/**
 * Sends email notification when an event is rejected
 */
export async function sendEventRejectedNotification(
  data: ModerationNotificationData,
  config?: ModerationEmailConfig
) {
  try {
    const emailConfig = createEmailFromTemplate(EmailTemplateType.NOTIFICATION, {
      to: { email: data.creatorEmail, name: data.creatorName },
      subject: `Event Requires Changes: ${data.eventTitle}`,
      from: config?.from || { email: "noreply@gameone.com", name: "GameOne" },
      templateData: {
        name: data.creatorName,
        message: `Your event "${data.eventTitle}" requires changes before it can be published.`,
        actionUrl: data.actionUrl || `/events/${data.eventId}/edit`,
        eventTitle: data.eventTitle,
        reason: data.reason,
        status: "rejected",
      },
    });

    if (config?.replyTo) {
      emailConfig.replyTo = config.replyTo;
    }

    // Add HTML template for rejected events
    emailConfig.html = generateModerationEmailTemplate("REJECTED", data);

    const result = await sendEmail(emailConfig);

    if (result.success) {
      logger.info(`Event rejected notification sent to ${data.creatorEmail}`, {
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        emailId: result.data?.id,
      });
    } else {
      logger.error(`Failed to send event rejected notification to ${data.creatorEmail}`, {
        eventId: data.eventId,
        error: result.error?.message,
      });
    }

    return result;
  } catch (error) {
    logger.error("Error sending event rejected notification:", error);
    throw error;
  }
}

/**
 * Sends email notification when an event is suspended
 */
export async function sendEventSuspendedNotification(
  data: ModerationNotificationData,
  config?: ModerationEmailConfig
) {
  try {
    const emailConfig = createEmailFromTemplate(EmailTemplateType.NOTIFICATION, {
      to: { email: data.creatorEmail, name: data.creatorName },
      subject: `Event Suspended: ${data.eventTitle}`,
      from: config?.from || { email: "noreply@gameone.com", name: "GameOne" },
      templateData: {
        name: data.creatorName,
        message: `Your event "${data.eventTitle}" has been temporarily suspended.`,
        actionUrl: data.actionUrl || `/events/${data.eventId}`,
        eventTitle: data.eventTitle,
        reason: data.reason,
        status: "suspended",
      },
    });

    if (config?.replyTo) {
      emailConfig.replyTo = config.replyTo;
    }

    // Add HTML template for suspended events
    emailConfig.html = generateModerationEmailTemplate("SUSPENDED", data);

    const result = await sendEmail(emailConfig);

    if (result.success) {
      logger.info(`Event suspended notification sent to ${data.creatorEmail}`, {
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        emailId: result.data?.id,
      });
    } else {
      logger.error(`Failed to send event suspended notification to ${data.creatorEmail}`, {
        eventId: data.eventId,
        error: result.error?.message,
      });
    }

    return result;
  } catch (error) {
    logger.error("Error sending event suspended notification:", error);
    throw error;
  }
}

/**
 * Sends email notification when an event is restored
 */
export async function sendEventRestoredNotification(
  data: ModerationNotificationData,
  config?: ModerationEmailConfig
) {
  try {
    const emailConfig = createEmailFromTemplate(EmailTemplateType.NOTIFICATION, {
      to: { email: data.creatorEmail, name: data.creatorName },
      subject: `Event Restored: ${data.eventTitle}`,
      from: config?.from || { email: "noreply@gameone.com", name: "GameOne" },
      templateData: {
        name: data.creatorName,
        message: `Your event "${data.eventTitle}" has been restored and is now active again.`,
        actionUrl: data.actionUrl || `/events/${data.eventId}`,
        eventTitle: data.eventTitle,
        status: "restored",
      },
    });

    if (config?.replyTo) {
      emailConfig.replyTo = config.replyTo;
    }

    // Add HTML template for restored events
    emailConfig.html = generateModerationEmailTemplate("RESTORED", data);

    const result = await sendEmail(emailConfig);

    if (result.success) {
      logger.info(`Event restored notification sent to ${data.creatorEmail}`, {
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        emailId: result.data?.id,
      });
    } else {
      logger.error(`Failed to send event restored notification to ${data.creatorEmail}`, {
        eventId: data.eventId,
        error: result.error?.message,
      });
    }

    return result;
  } catch (error) {
    logger.error("Error sending event restored notification:", error);
    throw error;
  }
}

/**
 * Sends email notification when changes are requested for an event
 */
export async function sendEventChangesRequestedNotification(
  data: ModerationNotificationData,
  config?: ModerationEmailConfig
) {
  try {
    const emailConfig = createEmailFromTemplate(EmailTemplateType.NOTIFICATION, {
      to: { email: data.creatorEmail, name: data.creatorName },
      subject: `Changes Requested: ${data.eventTitle}`,
      from: config?.from || { email: "noreply@gameone.com", name: "GameOne" },
      templateData: {
        name: data.creatorName,
        message: `Changes have been requested for your event "${data.eventTitle}".`,
        actionUrl: data.actionUrl || `/events/${data.eventId}/edit`,
        eventTitle: data.eventTitle,
        reason: data.reason,
        status: "changes_requested",
      },
    });

    if (config?.replyTo) {
      emailConfig.replyTo = config.replyTo;
    }

    // Add HTML template for changes requested
    emailConfig.html = generateModerationEmailTemplate("REQUEST_CHANGES", data);

    const result = await sendEmail(emailConfig);

    if (result.success) {
      logger.info(`Event changes requested notification sent to ${data.creatorEmail}`, {
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        emailId: result.data?.id,
      });
    } else {
      logger.error(`Failed to send event changes requested notification to ${data.creatorEmail}`, {
        eventId: data.eventId,
        error: result.error?.message,
      });
    }

    return result;
  } catch (error) {
    logger.error("Error sending event changes requested notification:", error);
    throw error;
  }
}

/**
 * Sends admin note notification to event creator
 */
export async function sendAdminNoteNotification(
  data: ModerationNotificationData & { noteContent: string },
  config?: ModerationEmailConfig
) {
  try {
    const emailConfig = createEmailFromTemplate(EmailTemplateType.NOTIFICATION, {
      to: { email: data.creatorEmail, name: data.creatorName },
      subject: `Message from Admin: ${data.eventTitle}`,
      from: config?.from || { email: "noreply@gameone.com", name: "GameOne" },
      templateData: {
        name: data.creatorName,
        message: data.noteContent,
        actionUrl: data.actionUrl || `/events/${data.eventId}`,
        eventTitle: data.eventTitle,
        adminName: data.adminName,
      },
    });

    if (config?.replyTo) {
      emailConfig.replyTo = config.replyTo;
    }

    // Add HTML template for admin notes
    emailConfig.html = generateAdminNoteEmailTemplate(data);

    const result = await sendEmail(emailConfig);

    if (result.success) {
      logger.info(`Admin note notification sent to ${data.creatorEmail}`, {
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        emailId: result.data?.id,
      });
    } else {
      logger.error(`Failed to send admin note notification to ${data.creatorEmail}`, {
        eventId: data.eventId,
        error: result.error?.message,
      });
    }

    return result;
  } catch (error) {
    logger.error("Error sending admin note notification:", error);
    throw error;
  }
}

/**
 * Master function to send moderation notifications based on action type
 */
export async function sendModerationNotification(
  action: "APPROVE" | "REJECT" | "SUSPEND" | "RESTORE" | "REQUEST_CHANGES",
  data: ModerationNotificationData,
  config?: ModerationEmailConfig
) {
  switch (action) {
    case "APPROVE":
      return sendEventApprovedNotification(data, config);
    case "REJECT":
      return sendEventRejectedNotification(data, config);
    case "SUSPEND":
      return sendEventSuspendedNotification(data, config);
    case "RESTORE":
      return sendEventRestoredNotification(data, config);
    case "REQUEST_CHANGES":
      return sendEventChangesRequestedNotification(data, config);
    default:
      throw new Error(`Unknown moderation action: ${action}`);
  }
}

/**
 * Generates HTML email template for moderation actions
 */
function generateModerationEmailTemplate(
  action: "APPROVED" | "REJECTED" | "SUSPENDED" | "RESTORED" | "REQUEST_CHANGES",
  data: ModerationNotificationData
): string {
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
      .container { max-width: 600px; margin: 0 auto; background-color: white; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; color: white; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
      .content { padding: 30px; }
      .event-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff; }
      .action-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 20px; }
      .approved { background-color: #d4edda; color: #155724; }
      .rejected { background-color: #f8d7da; color: #721c24; }
      .suspended { background-color: #fff3cd; color: #856404; }
      .restored { background-color: #d1ecf1; color: #0c5460; }
      .changes { background-color: #e2e3e5; color: #383d41; }
      .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 500; }
      .reason { background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ffc107; }
      .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #e9ecef; }
      .footer a { color: #007bff; text-decoration: none; }
    </style>
  `;

  const actionConfig = {
    APPROVED: {
      title: "Event Approved",
      badge: "approved",
      badgeText: "Approved",
      message: "Great news! Your event has been approved and is now published.",
      buttonText: "View Event",
      color: "#28a745",
    },
    REJECTED: {
      title: "Event Rejected",
      badge: "rejected",
      badgeText: "Rejected",
      message: "Your event requires changes before it can be published.",
      buttonText: "Edit Event",
      color: "#dc3545",
    },
    SUSPENDED: {
      title: "Event Suspended",
      badge: "suspended",
      badgeText: "Suspended",
      message: "Your event has been temporarily suspended.",
      buttonText: "View Event",
      color: "#ffc107",
    },
    RESTORED: {
      title: "Event Restored",
      badge: "restored",
      badgeText: "Restored",
      message: "Your event has been restored and is active again.",
      buttonText: "View Event",
      color: "#17a2b8",
    },
    REQUEST_CHANGES: {
      title: "Changes Requested",
      badge: "changes",
      badgeText: "Changes Requested",
      message: "Please review and make the requested changes to your event.",
      buttonText: "Edit Event",
      color: "#6c757d",
    },
  };

  const config = actionConfig[action];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${config.title}</title>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${config.title}</h1>
        </div>
        <div class="content">
          <div class="action-badge ${config.badge}">${config.badgeText}</div>
          
          <p>Hello ${data.creatorName},</p>
          
          <p>${config.message}</p>
          
          <div class="event-info">
            <h3 style="margin-top: 0; color: #495057;">Event Details</h3>
            <p><strong>Event:</strong> ${data.eventTitle}</p>
            <p><strong>Event ID:</strong> ${data.eventId}</p>
            ${data.adminName ? `<p><strong>Reviewed by:</strong> ${data.adminName}</p>` : ""}
          </div>
          
          ${
            data.reason
              ? `
            <div class="reason">
              <h4 style="margin-top: 0; color: #856404;">Reason</h4>
              <p style="margin-bottom: 0;">${data.reason}</p>
            </div>
          `
              : ""
          }
          
          ${
            data.actionUrl
              ? `
            <p style="text-align: center;">
              <a href="${data.actionUrl}" class="button" style="background-color: ${config.color};">
                ${config.buttonText}
              </a>
            </p>
          `
              : ""
          }
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
        </div>
        <div class="footer">
          <p>This email was sent automatically. Please do not reply to this email.</p>
          <p><a href="#">Contact Support</a> | <a href="#">Event Guidelines</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates HTML email template for admin notes
 */
function generateAdminNoteEmailTemplate(
  data: ModerationNotificationData & { noteContent: string }
): string {
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
      .container { max-width: 600px; margin: 0 auto; background-color: white; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; color: white; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
      .content { padding: 30px; }
      .event-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff; }
      .note { background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff; }
      .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 500; }
      .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #e9ecef; }
      .footer a { color: #007bff; text-decoration: none; }
    </style>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Message from Admin</title>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Message from Admin</h1>
        </div>
        <div class="content">
          <p>Hello ${data.creatorName},</p>
          
          <p>You have received a message from our moderation team regarding your event:</p>
          
          <div class="event-info">
            <h3 style="margin-top: 0; color: #495057;">Event Details</h3>
            <p><strong>Event:</strong> ${data.eventTitle}</p>
            <p><strong>Event ID:</strong> ${data.eventId}</p>
            ${data.adminName ? `<p><strong>Message from:</strong> ${data.adminName}</p>` : ""}
          </div>
          
          <div class="note">
            <h4 style="margin-top: 0; color: #0066cc;">Admin Message</h4>
            <p style="margin-bottom: 0;">${data.noteContent}</p>
          </div>
          
          ${
            data.actionUrl
              ? `
            <p style="text-align: center;">
              <a href="${data.actionUrl}" class="button">
                View Event
              </a>
            </p>
          `
              : ""
          }
          
          <p>If you have any questions about this message, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>This email was sent automatically. Please do not reply to this email.</p>
          <p><a href="#">Contact Support</a> | <a href="#">Event Guidelines</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}
