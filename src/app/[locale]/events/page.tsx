import { getTranslations } from "next-intl/server";
import { getPublicEvents } from "@/lib/api/events/public";
import { EventsClientPage } from "./events-client";
import type { Metadata } from "next";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Events" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

interface EventsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const t = await getTranslations("Events");
  const resolvedSearchParams = await searchParams;
  const page =
    typeof resolvedSearchParams["page"] === "string" ? parseInt(resolvedSearchParams["page"]) : 1;
  const limit =
    typeof resolvedSearchParams["limit"] === "string"
      ? parseInt(resolvedSearchParams["limit"])
      : 12;

  const initialData = await getPublicEvents({ page, limit });

  const events = initialData?.data || [];
  const pagination = initialData?.pagination || {
    page,
    limit,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-lg text-gray-600">{t("description")}</p>
      </div>

      <EventsClientPage initialEvents={events} initialPagination={pagination} />
    </main>
  );
}
