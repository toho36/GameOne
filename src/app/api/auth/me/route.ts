import { getCurrentUser } from "@/lib/kinde-auth";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/me
 * Returns the current user's authentication information and ensures they exist in the database
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Ensure user exists in our database
    let dbUser = await prisma.user.findUnique({
      where: { kindeId: user.id },
      include: {
        primaryRole: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // If user doesn't exist in our database, create them with default role
    if (!dbUser) {
      try {
        // Get the default USER role
        const defaultRole = await prisma.role.findFirst({
          where: { name: "USER" },
        });

        if (!defaultRole) {
          logger.error("Default USER role not found in database");
          return NextResponse.json({ error: "System configuration error" }, { status: 500 });
        }

        // Create user with default role
        dbUser = await prisma.user.create({
          data: {
            kindeId: user.id,
            email: user.email || "",
            name:
              user.given_name && user.family_name
                ? `${user.given_name} ${user.family_name}`
                : user.email || "User",
            firstName: user.given_name,
            lastName: user.family_name,
            status: "ACTIVE",
            preferredLocale: "en",
            primaryRoleId: defaultRole.id,
          },
          include: {
            primaryRole: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        });

        // Assign default role
        await prisma.userRole.create({
          data: {
            userId: dbUser.id,
            roleId: defaultRole.id,
            assignedBy: dbUser.id, // Self-assigned
            isActive: true,
          },
        });

        logger.info("New user created in database", {
          userId: dbUser.id,
          email: dbUser.email,
          role: defaultRole.name,
        });
      } catch (createError) {
        logger.error("Error creating user in database:", createError);
        return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 });
      }
    }

    // Ensure dbUser is not null after creation
    if (!dbUser) {
      return NextResponse.json({ error: "Failed to create or retrieve user" }, { status: 500 });
    }

    // Get all roles (primary role + additional roles)
    const allRoles = [
      ...(dbUser.primaryRole ? [dbUser.primaryRole.name] : []),
      ...dbUser.userRoles.map((ur) => ur.role.name),
    ];

    // Get all permissions from all roles
    const allPermissions = [
      ...(dbUser.primaryRole
        ? (() => {
            const rolePermissions = dbUser.primaryRole.permissions as any;
            return Array.isArray(rolePermissions) ? rolePermissions : [];
          })()
        : []),
      ...dbUser.userRoles.flatMap((ur) => {
        const rolePermissions = ur.role.permissions as any;
        return Array.isArray(rolePermissions) ? rolePermissions : [];
      }),
    ];

    // Return user information with database data
    return NextResponse.json({
      id: dbUser.id,
      kindeId: dbUser.kindeId,
      email: dbUser.email,
      name: dbUser.name,
      given_name: dbUser.firstName,
      family_name: dbUser.lastName,
      status: dbUser.status,
      roles: allRoles,
      permissions: allPermissions,
      createdAt: dbUser.createdAt,
      lastLoginAt: dbUser.lastLoginAt,
    });
  } catch (error) {
    logger.error("Error fetching current user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
