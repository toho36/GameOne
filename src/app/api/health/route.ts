import { NextResponse } from "next/server";
import { checkDatabaseConnection, getDatabaseMetrics } from "@/lib/prisma";

export async function GET() {
  try {
    // Check database connectivity
    const isDatabaseHealthy = await checkDatabaseConnection();
    
    // Get basic database metrics (optional, can be disabled in production)
    let metrics = null;
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DB_METRICS === 'true') {
      try {
        metrics = await getDatabaseMetrics();
      } catch (error) {
        console.warn('Could not fetch database metrics:', error);
      }
    }

    const healthStatus = {
      status: isDatabaseHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      message: "GameOne Event Management System",
      services: {
        database: {
          status: isDatabaseHealthy ? "connected" : "disconnected",
          provider: "Neon PostgreSQL",
          region: process.env.VERCEL_REGION ?? "local",
        },
        application: {
          status: "running",
          version: process.env.npm_package_version ?? "unknown",
          environment: process.env.NODE_ENV ?? "development",
          runtime: "Bun",
        },
      },
      metrics: metrics ? {
        database: metrics,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      } : undefined,
    };

    return NextResponse.json(
      healthStatus,
      { 
        status: isDatabaseHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        message: "GameOne Event Management System - Health check failed",
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error',
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}
