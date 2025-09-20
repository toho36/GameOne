import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { BankAccountManagement } from "@/components/features/bank-accounts/bank-account-management";

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
    include: {
      primaryRole: true,
      userRoles: { where: { isActive: true }, include: { role: true } },
    },
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
      include: {
        primaryRole: true,
        userRoles: { where: { isActive: true }, include: { role: true } },
      },
    });
  }

  // Admin-only access
  const roleNames: string[] = [
    ...(dbUser?.primaryRole?.name ? [dbUser.primaryRole.name] : []),
    ...((dbUser?.userRoles ?? []).map((ur: any) => ur.role?.name).filter(Boolean) as string[]),
  ];
  const isAdmin = roleNames.includes("ADMIN");

  if (!isAdmin) {
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
