import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const t = useTranslations("HomePage");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{t("title")}</h1>
        <p className="mb-8 max-w-2xl text-lg text-gray-600">
          {t("description")}
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg">{t("getStarted")}</Button>
          <Button variant="outline" size="lg">
            {t("learnMore")}
          </Button>
        </div>
      </div>
    </main>
  );
}
