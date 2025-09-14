import { redirect } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { UserManagement } from "@/components/features/users/user-management";

export default async function UsersPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const t = await getTranslations("Users");

  if (!user) {
    redirect("/api/auth/login");
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { kindeId: user.id },
    include: {
      primaryRole: true,
    },
  });

  if (!dbUser) {
    redirect("/api/auth/login");
  }

  // Check if user has permission to manage users
  // For now, let's allow users with ADMIN role or users.manage permission
  const hasUserManagementPermission = await checkUserManagementPermission(dbUser.id);

  if (!hasUserManagementPermission) {
    redirect("/dashboard?error=insufficient_permissions");
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{t("pageTitle")}</h1>
        <p className="text-gray-600">{t("pageDescription")}</p>
      </div>

      <UserManagement />
    </div>
  );
}

// Helper function to check user management permissions
async function checkUserManagementPermission(userId: string): Promise<boolean> {
  const userWithRoles = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      primaryRole: true,
      userRoles: {
        where: { isActive: true },
        include: { role: true },
      },
    },
  });

  if (!userWithRoles) return false;

  // Allow ADMIN outright
  const primaryRole = userWithRoles.primaryRole;
  if (primaryRole?.name === "ADMIN") return true;

  // Helper that checks a permissions array with our standardized convention
  const allowsUserManagement = (perms: string[] | null | undefined) => {
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

  // Check primary role
  if (allowsUserManagement(primaryRole?.permissions as any)) return true;

  // Check additional active roles
  for (const userRole of userWithRoles.userRoles) {
    if (userRole.role.name === "ADMIN") return true;
    if (allowsUserManagement(userRole.role.permissions as any)) return true;
  }

  return false;
}
