import { requirePermissions } from "@/lib/api/common/auth";
import { AdminEventRegistrationsClient } from "@/components/features/admin/registrations/event-registrations-client";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface Props {
  params: { locale: string; id: string };
}

export default async function Page({ params }: Props) {
  const auth = await requirePermissions(["registrations.review"]);
  if (!auth.success) {
    redirect(`/${params.locale}`);
  }

  const t = await getTranslations("AdminRegistrations");

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {/* Client-side table with filters & actions */}
      <AdminEventRegistrationsClient eventId={params.id} />
    </div>
  );
}
