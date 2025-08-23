import { redirect } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getTranslations } from "next-intl/server";

import { EventDashboard } from "@/components/features/events/dashboard";

export default async function EventsPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const t = await getTranslations("Events");

  if (!user) {
    redirect("/api/auth/login");
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
