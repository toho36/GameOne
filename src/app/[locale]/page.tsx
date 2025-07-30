import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const t = useTranslations("HomePage");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{t("title")}</h1>
        <p className="mb-8 text-lg text-gray-600 max-w-2xl">
          {t("description")}
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg">{t("getStarted")}</Button>
          <Button variant="outline" size="lg">
            {t("learnMore")}
          </Button>
        </div>
      </div>
    </main>
  );
}
