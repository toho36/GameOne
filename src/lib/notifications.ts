/* eslint-disable no-console */
/**
 * Notification processing library
 * Since we disabled the notification cron, this is a simplified stub
 */

export interface NotificationOptions {
  eventReminders?: boolean;
  waitingListPromotions?: boolean;
  registrationConfirmations?: boolean;
  paymentReminders?: boolean;
  weeklyDigests?: boolean;
  birthdayNotifications?: boolean;
  feedbackRequests?: boolean;
  retryFailedNotifications?: boolean;
  systemNotifications?: boolean;
}

export interface NotificationResults {
  eventReminders?: number;
  waitingListPromotions?: number;
  registrationConfirmations?: number;
  paymentReminders?: number;
  weeklyDigests?: number;
  birthdayNotifications?: number;
  feedbackRequests?: number;
  retryFailedNotifications?: number;
  systemNotifications?: number;
  errors?: string[];
}

/**
 * Process scheduled notifications
 * Since cron is disabled, this is a stub implementation
 */
export async function processScheduledNotifications(
  _options: NotificationOptions
): Promise<NotificationResults> {
  // Stub implementation - notifications are disabled
  console.log('📧 Notification processing is disabled (cron jobs disabled)');
  
  return {
    eventReminders: 0,
    waitingListPromotions: 0,
    registrationConfirmations: 0,
    paymentReminders: 0,
    weeklyDigests: 0,
    birthdayNotifications: 0,
    feedbackRequests: 0,
    retryFailedNotifications: 0,
    systemNotifications: 0,
    errors: []
  };
}