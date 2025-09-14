import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { BankAccountManagement } from "@/components/features/bank-accounts/bank-account-management";

async function checkBankAccountManagementPermission(userId: string): Promise<boolean> {
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

  // Check primary role permissions
  const primaryRole = userWithRoles.primaryRole;
  if (primaryRole?.name === "ADMIN") return true;

  // Check all active roles for permissions
  const roles = [
    ...(primaryRole ? [primaryRole] : []),
    ...userWithRoles.userRoles.map((ur) => ur.role),
  ];

  return roles.some((role) => {
    if (role.name === "ADMIN") return true;

    // Parse permissions JSON safely
    try {
      const permissions = Array.isArray(role.permissions)
        ? role.permissions
        : JSON.parse(role.permissions as string);

      return (
        permissions.includes("bank-accounts.view") || permissions.includes("admin.full_access")
      );
    } catch {
      return false;
    }
  });
}

export default async function BankAccountsPage() {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();
  const t = await getTranslations("BankAccounts");

  if (!kindeUser) {
    redirect("/api/auth/login");
  }

  // Get user from database with auto-creation
  let dbUser = await prisma.user.findUnique({
    where: { kindeId: kindeUser.id },
  });

  if (!dbUser) {
    // Auto-create user with default role
    const defaultRole = await prisma.role.findUnique({
      where: { name: "USER" },
    });

    dbUser = await prisma.user.create({
      data: {
        kindeId: kindeUser.id,
        email: kindeUser.email || "",
        name: kindeUser.given_name || kindeUser.family_name || kindeUser.email || "User",
        firstName: kindeUser.given_name || "",
        lastName: kindeUser.family_name || "",
        status: "ACTIVE",
        primaryRoleId: defaultRole?.id,
      },
    });
  }

  // Check permissions for bank account management
  const canManageBankAccounts = await checkBankAccountManagementPermission(dbUser.id);

  if (!canManageBankAccounts) {
    redirect("/dashboard?error=insufficient_permissions");
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{t("pageTitle")}</h1>
        <p className="text-gray-600">{t("pageDescription")}</p>
      </div>
      <BankAccountManagement />
    </div>
  );
}
