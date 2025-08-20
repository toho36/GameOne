import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export interface AuthResult {
  kindeUser: any;
  dbUser: any;
  roles: any[];
}

export async function authenticateUser(): Promise<AuthResult | NextResponse> {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();

  if (!kindeUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { kindeId: kindeUser.id },
    include: {
      primaryRole: true,
      userRoles: {
        where: { isActive: true },
        include: {
          role: true,
        },
      },
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const roles = [
    ...(dbUser.primaryRole ? [dbUser.primaryRole] : []),
    ...dbUser.userRoles.map((ur) => ur.role),
  ];

  return { kindeUser, dbUser, roles };
}

export function hasPermission(roles: any[], permissions: string[]): boolean {
  return roles.some((role) => {
    if (role.name === "ADMIN") return true;

    try {
      const rolePermissions = Array.isArray(role.permissions)
        ? role.permissions
        : JSON.parse(role.permissions as string);

      return permissions.some(
        (permission) => rolePermissions.includes(permission) || rolePermissions.includes("*")
      );
    } catch {
      return false;
    }
  });
}

export async function requirePermissions(permissions: string[]) {
  const authResult = await authenticateUser();

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { roles } = authResult;

  if (!hasPermission(roles, permissions)) {
    return NextResponse.json({ error: "insufficient_permissions" }, { status: 403 });
  }

  return authResult;
}

export default {
  authenticateUser,
  hasPermission,
  requirePermissions,
};
