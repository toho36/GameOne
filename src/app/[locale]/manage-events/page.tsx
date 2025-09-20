import { redirect } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { EventDashboard } from "@/components/features/manage-events/dashboard";

async function canManageEvents(userId: string): Promise<boolean> {
  const userWithRoles = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      primaryRole: true,
      userRoles: { where: { isActive: true }, include: { role: true } },
    },
  });
  if (!userWithRoles) return false;
  const names = [
    userWithRoles.primaryRole?.name,
    ...userWithRoles.userRoles.map((ur) => ur.role.name),
  ].filter(Boolean) as string[];
  return names.some((n) => ["ADMIN", "MODERATOR", "EVENT_MANAGER"].includes(n));
}

export default async function EventsPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const t = await getTranslations("Events");

  if (!user) {
    redirect("/api/auth/login");
  }

  // Enforce role-based access
  const dbUser = await prisma.user.findUnique({ where: { kindeId: user.id } });
  if (!dbUser || !(await canManageEvents(dbUser.id))) {
    redirect("/dashboard?error=insufficient_permissions");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{t("pageTitle")}</h1>
        <p className="text-gray-600">{t("pageDescription")}</p>
      </div>

      <EventDashboard />
    </div>
  );
}
