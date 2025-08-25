import { getTranslations } from "next-intl/server";

export default async function TestPage() {
  const t = await getTranslations("Test");

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-600">{t("description")}</p>
        </div>
      </div>
    </main>
  );
}
