import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/prisma";
import { logger } from "@/lib/logger";
export async function GET() {
  try {
    // Check database health
    const dbHealth = await checkDatabaseHealth();

    // Get system information
    const systemInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env["npm_package_version"] || "1.0.0",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    // Overall health status
    const isHealthy = dbHealth.status === "healthy";

    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "unhealthy",
        timestamp: systemInfo.timestamp,
        environment: systemInfo.environment,
        version: systemInfo.version,
        uptime: systemInfo.uptime,
        memory: systemInfo.memory,
        database: dbHealth,
      },
      {
        status: isHealthy ? 200 : 503,
      }
    );
  } catch (error) {
    logger.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
