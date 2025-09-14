import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Helper function to create user with default role and active status
async function createUserWithDefaults(kindeUser: any) {
  // Get default USER role
  const defaultRole = await prisma.role.findUnique({
    where: { name: "USER" },
  });

  return await prisma.user.create({
    data: {
      kindeId: kindeUser.id,
      email: kindeUser.email || "",
      name: kindeUser.given_name || kindeUser.family_name || kindeUser.email || "User",
      firstName: kindeUser.given_name || "",
      lastName: kindeUser.family_name || "",
      status: "ACTIVE", // Set to ACTIVE by default
      primaryRoleId: defaultRole?.id, // Assign default USER role
    },
  });
}

// GET /api/users - List users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get user from database, create if doesn't exist
    let dbUser = await prisma.user.findUnique({
      where: { kindeId: user.id },
      include: {
        primaryRole: true,
        userRoles: {
          where: { isActive: true },
          include: { role: true },
        },
      },
    });

    if (!dbUser) {
      // Create user if they don't exist in database with defaults
      const createdUser = await createUserWithDefaults(user);

      // Re-fetch with includes
      dbUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
        include: {
          primaryRole: true,
          userRoles: {
            where: { isActive: true },
            include: { role: true },
          },
        },
      });

      if (!dbUser) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }
    }

    // Check permissions
    const hasPermission = await checkUserManagementPermission(dbUser);
    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;

    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Handle role filtering
    if (role) {
      if (role === "no-role") {
        where.primaryRoleId = null;
      } else {
        where.primaryRoleId = role;
      }
    }

    // Get users with related data
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          primaryRole: true,
        },
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Transform users for response
    const transformedUsers = users.map((user) => ({
      id: user.id,
      kindeId: user.kindeId,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      phoneNumber: user.phoneNumber,
      preferredLocale: user.preferredLocale,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
      primaryRole: user.primaryRole
        ? {
            id: user.primaryRole.id,
            name: user.primaryRole.name,
            displayName: user.primaryRole.displayName,
            description: user.primaryRole.description,
            color: user.primaryRole.color,
            priority: user.primaryRole.priority,
            isSystem: user.primaryRole.isSystem,
            isDefault: user.primaryRole.isDefault,
            permissions: user.primaryRole.permissions as string[],
            createdAt: user.primaryRole.createdAt.toISOString(),
            updatedAt: user.primaryRole.updatedAt.toISOString(),
          }
        : undefined,
    }));

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + users.length < totalCount,
      },
    });
  } catch (error) {
    logger.error("Users fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// Helper function to check user management permissions
async function checkUserManagementPermission(user: any): Promise<boolean> {
  // ADMIN bypass
  const primaryRole = user.primaryRole;
  if (primaryRole?.name === "ADMIN") return true;

  const permits = (perms: string[] | null | undefined) => {
    if (!perms) return false;
    try {
      const list: string[] = Array.isArray(perms) ? perms : JSON.parse(perms as any);
      const normalized = list.map((p) => p.trim());
      return (
        normalized.includes("users.moderate") ||
        normalized.includes("users.*") ||
        normalized.includes("*") ||
        normalized.includes("admin.full_access")
      );
    } catch {
      return false;
    }
  };

  if (permits(primaryRole?.permissions as any)) return true;

  for (const userRole of user.userRoles) {
    if (userRole.role.name === "ADMIN") return true;
    if (permits(userRole.role.permissions as any)) return true;
  }

  return false;
}
