import { prisma } from "./prisma";
import { logger } from "./logger";

export interface CleanupOptions {
  expiredUserRoles?: boolean;
  oldAuditLogs?: boolean;
  failedPayments?: boolean;
  expiredWaitingList?: boolean;
  cancelledRegistrations?: boolean;
  oldNotificationLogs?: boolean;
  optimizeDatabase?: boolean;
}

export interface CleanupResults {
  expiredUserRoles?: number;
  oldAuditLogs?: number;
  failedPayments?: number;
  expiredWaitingList?: number;
  cancelledRegistrations?: number;
  oldNotificationLogs?: number;
  errors?: string[];
}

export async function performDatabaseCleanup(options: CleanupOptions): Promise<CleanupResults> {
  const results: CleanupResults = {};
  const errors: string[] = [];

  try {
    if (options.expiredUserRoles) {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const deletedRoles = await prisma.userRole.deleteMany({
          where: {
            expiresAt: {
              lt: thirtyDaysAgo,
            },
            isActive: false,
          },
        });

        results.expiredUserRoles = deletedRoles.count;
        logger.info(`🗑️ Cleaned up ${deletedRoles.count} expired user roles`);
      } catch (error) {
        errors.push(`Failed to clean expired user roles: ${(error as Error).message}`);
      }
    }

    // Clean up old audit logs (older than 90 days)
    if (options.oldAuditLogs) {
      try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const deletedLogs = await prisma.auditLog.deleteMany({
          where: {
            timestamp: {
              lt: ninetyDaysAgo,
            },
          },
        });

        results.oldAuditLogs = deletedLogs.count;
        logger.info(`🗑️ Cleaned up ${deletedLogs.count} old audit logs`);
      } catch (error) {
        errors.push(`Failed to clean audit logs: ${(error as Error).message}`);
      }
    }

    // Clean up failed payment records (older than 7 days)
    if (options.failedPayments) {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const deletedPayments = await prisma.payment.deleteMany({
          where: {
            status: "FAILED",
            createdAt: {
              lt: sevenDaysAgo,
            },
          },
        });

        results.failedPayments = deletedPayments.count;
        logger.info(`🗑️ Cleaned up ${deletedPayments.count} failed payments`);
      } catch (error) {
        errors.push(`Failed to clean failed payments: ${(error as Error).message}`);
      }
    }

    // Clean up expired waiting list entries
    if (options.expiredWaitingList) {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Find events that ended more than 7 days ago
        const expiredEvents = await prisma.event.findMany({
          where: {
            endDate: {
              lt: sevenDaysAgo,
            },
          },
          select: { id: true },
        });

        if (expiredEvents.length > 0) {
          const deletedWaitingList = await prisma.waitingList.deleteMany({
            where: {
              eventId: {
                in: expiredEvents.map((e) => e.id),
              },
            },
          });

          results.expiredWaitingList = deletedWaitingList.count;
          logger.info(`🗑️ Cleaned up ${deletedWaitingList.count} expired waiting list entries`);
        } else {
          results.expiredWaitingList = 0;
        }
      } catch (error) {
        errors.push(`Failed to clean waiting list: ${(error as Error).message}`);
      }
    }

    // Clean up old cancelled registrations (older than 30 days)
    if (options.cancelledRegistrations) {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const deletedRegistrations = await prisma.registration.deleteMany({
          where: {
            status: "CANCELLED",
            cancelledAt: {
              lt: thirtyDaysAgo,
            },
          },
        });

        results.cancelledRegistrations = deletedRegistrations.count;
        logger.info(`🗑️ Cleaned up ${deletedRegistrations.count} old cancelled registrations`);
      } catch (error) {
        errors.push(`Failed to clean cancelled registrations: ${(error as Error).message}`);
      }
    }

    // Clean up old notification logs (older than 60 days)
    if (options.oldNotificationLogs) {
      try {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const deletedNotifications = await prisma.notificationLog.deleteMany({
          where: {
            createdAt: {
              lt: sixtyDaysAgo,
            },
            status: {
              in: ["SENT", "DELIVERED", "FAILED", "BOUNCED"],
            },
          },
        });

        results.oldNotificationLogs = deletedNotifications.count;
        logger.info(`🗑️ Cleaned up ${deletedNotifications.count} old notification logs`);
      } catch (error) {
        errors.push(`Failed to clean notification logs: ${(error as Error).message}`);
      }
    }

    // Optimize database (PostgreSQL VACUUM and ANALYZE)
    if (options.optimizeDatabase) {
      try {
        // Note: Prisma doesn't directly support VACUUM/ANALYZE
        // In production, you might want to use a raw query or separate script
        logger.info("🔧 Database optimization would run here (VACUUM, ANALYZE)");

        // Example of what you could do with raw queries:
        // await prisma.$executeRawUnsafe('VACUUM ANALYZE');

        // For now, just update statistics
        await prisma.$executeRawUnsafe("ANALYZE");
        logger.info("📊 Database statistics updated");
      } catch (error) {
        errors.push(`Failed to optimize database: ${(error as Error).message}`);
      }
    }

    // Add errors to results if any occurred
    if (errors.length > 0) {
      results.errors = errors;
    }

    return results;
  } catch (error) {
    logger.error("Database cleanup failed:", error);
    throw new Error(`Database cleanup failed: ${(error as Error).message}`);
  }
}
