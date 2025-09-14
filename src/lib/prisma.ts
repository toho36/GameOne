/**
 * Prisma Client Configuration for Serverless Environment
 * Optimized for Vercel deployment with connection pooling
 */

import { PrismaClient } from "@prisma/client";

// Prisma client singleton (serverless-safe)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Health check function
export async function checkDatabaseHealth(): Promise<{
  status: "healthy" | "unhealthy";
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "healthy",
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Pagination helper
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function paginate<T>(
  model: any,
  options: PaginationOptions = {},
  where?: any,
  include?: any,
  orderBy?: any
): Promise<PaginatedResult<T>> {
  const { page: inputPage = 1, limit: inputLimit = 20 } = options;
  const page = Math.max(1, inputPage);
  const limit = Math.min(100, Math.max(1, inputLimit));
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      include,
      orderBy,
      skip: offset,
      take: limit,
    }),
    model.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
