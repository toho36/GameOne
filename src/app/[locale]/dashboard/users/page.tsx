import { redirect } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { prisma } from "@/lib/prisma";
import { UserManagement } from "@/components/features/users/user-management";

export default async function UsersPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

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
        <h1 className="mb-2 text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage users and their roles</p>
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

  // Check if primary role allows user management
  const primaryRole = userWithRoles.primaryRole;
  if (primaryRole?.name === "ADMIN") return true;

  // Check permissions in primary role
  if (primaryRole?.permissions) {
    const permissions = primaryRole.permissions as string[];
    if (permissions.includes("users.manage") || permissions.includes("*")) return true;
  }

  // Check permissions in additional roles
  for (const userRole of userWithRoles.userRoles) {
    if (userRole.role.name === "ADMIN") return true;

    const permissions = userRole.role.permissions as string[];
    if (permissions.includes("users.manage") || permissions.includes("*")) return true;
  }

  return false;
}
