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
      userRoles: { where: { isActive: true }, include: { role: true } },
    },
  });

  if (!dbUser) {
    redirect("/api/auth/login");
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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{t("pageTitle")}</h1>
        <p className="text-gray-600">{t("pageDescription")}</p>
      </div>

      <UserManagement />
    </div>
  );
}
