import { NextResponse } from "next/server";
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

// GET /api/roles - List all roles
export async function GET() {
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

    // Check permissions (users with user management permissions can view roles)
    const hasPermission = await checkRoleViewPermission(dbUser);
    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get all roles
    const roles = await prisma.role.findMany({
      orderBy: [{ priority: "desc" }, { displayName: "asc" }],
    });

    // Transform roles for response
    const transformedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      color: role.color,
      priority: role.priority,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      permissions: role.permissions as string[],
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      roles: transformedRoles,
    });
  } catch (error) {
    logger.error("Roles fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

// Helper function to check role view permissions
async function checkRoleViewPermission(user: any): Promise<boolean> {
  // Allow ADMIN
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
