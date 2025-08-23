/**
 * Shared authentication utilities for GameOne API routes
 */

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * User creation result
 */
export interface AuthResult {
  user: any;
  kindeUser: any;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  response?: NextResponse;
}

/**
 * Creates a user with default role if it doesn't exist
 */
export async function createUserWithDefaults(kindeUser: any) {
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
      status: "ACTIVE",
      primaryRoleId: defaultRole?.id,
    },
    include: {
      primaryRole: true,
      userRoles: {
        where: { isActive: true },
        include: { role: true },
      },
    },
  });
}

/**
 * Gets authenticated user and creates if doesn't exist
 */
export async function getAuthenticatedUser(): Promise<
  { success: false; response: NextResponse } | { success: true; data: AuthResult }
> {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();

  if (!kindeUser) {
    return {
      success: false,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  // Get user from database with auto-creation
  let dbUser = await prisma.user.findUnique({
    where: { kindeId: kindeUser.id },
    include: {
      primaryRole: true,
      userRoles: {
        where: { isActive: true },
        include: { role: true },
      },
    },
  });

  if (!dbUser) {
    dbUser = await createUserWithDefaults(kindeUser);
  }

  return {
    success: true,
    data: { user: dbUser, kindeUser },
  };
}

/**
 * Checks if user has specific permissions
 */
export function checkUserPermissions(
  user: any,
  requiredPermissions: string[]
): PermissionCheckResult {
  const roles = [
    ...(user.primaryRole ? [user.primaryRole] : []),
    ...user.userRoles.map((ur: any) => ur.role),
  ];

  const hasPermission = roles.some((role: any) => {
    if (role.name === "ADMIN") return true;

    try {
      const permissions = Array.isArray(role.permissions)
        ? role.permissions
        : JSON.parse(role.permissions as string);

      return requiredPermissions.some(
        (perm) => permissions.includes(perm) || permissions.includes("admin.full_access")
      );
    } catch {
      return false;
    }
  });

  if (!hasPermission) {
    return {
      hasPermission: false,
      response: NextResponse.json({ error: "insufficient_permissions" }, { status: 403 }),
    };
  }

  return { hasPermission: true };
}

/**
 * Convenience function to require specific permissions
 */
export async function requirePermissions(
  permissions: string[]
): Promise<{ success: false; response: NextResponse } | { success: true; data: AuthResult }> {
  const authResult = await getAuthenticatedUser();

  if (!authResult.success) {
    return authResult;
  }

  const permissionCheck = checkUserPermissions(authResult.data.user, permissions);

  if (!permissionCheck.hasPermission) {
    return {
      success: false,
      response: permissionCheck.response!,
    };
  }

  return authResult;
}
