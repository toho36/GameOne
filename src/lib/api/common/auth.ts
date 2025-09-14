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

  // Try to find user by Kinde ID first
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

  // If not found, try linking existing user by email and attach kindeId
  if (!dbUser && kindeUser.email) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email: kindeUser.email },
      include: {
        primaryRole: true,
        userRoles: {
          where: { isActive: true },
          include: { role: true },
        },
      },
    });

    if (existingByEmail) {
      dbUser = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { kindeId: kindeUser.id },
        include: {
          primaryRole: true,
          userRoles: {
            where: { isActive: true },
            include: { role: true },
          },
        },
      });
    }
  }

  // If still not found, create a new user with defaults
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
      const permissions: string[] = Array.isArray(role.permissions)
        ? role.permissions
        : JSON.parse(role.permissions as string);

      // Normalize permissions (trim spaces)
      const perms = permissions.map((p) => p.trim());

      const has = (required: string): boolean => {
        if (perms.includes("*")) return true; // global wildcard
        if (perms.includes("admin.full_access")) return true; // legacy admin override
        if (perms.includes(required)) return true; // exact match
        const domain = required.split(".")[0];
        if (perms.includes(`${domain}.*`)) return true; // domain wildcard
        return false;
      };

      return requiredPermissions.some((perm) => has(perm));
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
