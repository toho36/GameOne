import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { logger } from "./logger";

export interface KindeUser {
  id: string;
  email: string | null;
  given_name?: string | null;
  family_name?: string | null;
  picture?: string | null;
}

export interface KindeSession {
  user: KindeUser;
  accessToken: string;
  refreshToken: string;
  isAuthenticated: boolean;
}

/**
 * Get the current user session from Kinde
 */
export async function getCurrentUser(): Promise<KindeUser | null> {
  try {
    const { getUser } = await getKindeServerSession();
    const user = await getUser();
    return user;
  } catch (error) {
    logger.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Get the full session including tokens
 */
export async function getSession(): Promise<KindeSession | null> {
  try {
    const { getUser } = await getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return null;
    }

    return {
      user,
      accessToken: "", // Access token handling simplified for now
      refreshToken: "", // Kinde doesn't expose refresh token in this way
      isAuthenticated: true,
    };
  } catch (error) {
    logger.error("Error getting session:", error);
    return null;
  }
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(): Promise<KindeUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/api/auth/login");
  }

  return user;
}

/**
 * Check if user has specific permissions
 */
export async function hasPermission(permission: string): Promise<boolean> {
  try {
    const { getPermissions } = await getKindeServerSession();
    const permissions = await getPermissions();

    if (!permissions) {
      return false;
    }

    // Check if the permission exists in the permissions object
    return permission in permissions;
  } catch (error) {
    logger.error("Error checking permissions:", error);
    return false;
  }
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  try {
    const { getRoles } = await getKindeServerSession();
    const roles = await getRoles();

    if (!roles) {
      return false;
    }

    // Check if the role exists in the roles array
    return roles.some((r) => r.name === role);
  } catch (error) {
    logger.error("Error checking roles:", error);
    return false;
  }
}

/**
 * Get user permissions from database
 */
export async function getUserPermissions(): Promise<string[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    // Import Prisma client dynamically to avoid issues
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    // Get user with roles from database
    const dbUser = await prisma.user.findUnique({
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

    await prisma.$disconnect();

    if (!dbUser) {
      return [];
    }

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

    // Remove duplicates
    return [...new Set(allPermissions)];
  } catch (error) {
    logger.error("Error getting database permissions:", error);
    return [];
  }
}

/**
 * Get user roles from database
 */
export async function getUserRoles(): Promise<string[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    // Import Prisma client dynamically to avoid issues
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    // Get user with roles from database
    const dbUser = await prisma.user.findUnique({
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

    await prisma.$disconnect();

    if (!dbUser) {
      return [];
    }

    // Get all roles (primary role + additional roles)
    const allRoles = [
      ...(dbUser.primaryRole ? [dbUser.primaryRole.name] : []),
      ...dbUser.userRoles.map((ur) => ur.role.name),
    ];

    return allRoles;
  } catch (error) {
    logger.error("Error getting database roles:", error);
    return [];
  }
}
