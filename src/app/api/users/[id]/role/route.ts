import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { prisma } from "@/lib/prisma";

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

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT /api/users/[id]/role - Update user's primary role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = params.id;
    const body = await request.json();
    const { roleId } = body;

    // Get requesting user from database, create if doesn't exist
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

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { primaryRole: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // If roleId is provided, validate that the role exists
    if (roleId) {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }

      // Prevent assigning system roles unless user is admin
      if (role.isSystem && dbUser.primaryRole?.name !== "ADMIN") {
        return NextResponse.json({ error: "Cannot assign system roles" }, { status: 403 });
      }
    }

    // Update user's primary role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        primaryRoleId: roleId || null,
      },
      include: {
        primaryRole: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        primaryRole: updatedUser.primaryRole
          ? {
              id: updatedUser.primaryRole.id,
              name: updatedUser.primaryRole.name,
              displayName: updatedUser.primaryRole.displayName,
            }
          : null,
      },
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("User role update error:", error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}

// Helper function to check user management permissions
async function checkUserManagementPermission(user: any): Promise<boolean> {
  // Check if primary role allows user management
  const primaryRole = user.primaryRole;
  if (primaryRole?.name === "ADMIN") return true;

  // Check permissions in primary role
  if (primaryRole?.permissions) {
    const permissions = primaryRole.permissions as string[];
    if (permissions.includes("users.manage") || permissions.includes("*")) return true;
  }

  // Check permissions in additional roles
  for (const userRole of user.userRoles) {
    if (userRole.role.name === "ADMIN") return true;

    const permissions = userRole.role.permissions as string[];
    if (permissions.includes("users.manage") || permissions.includes("*")) return true;
  }

  return false;
}
