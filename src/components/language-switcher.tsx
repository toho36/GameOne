"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const localeNames: Record<Locale, string> = {
  en: "English",
  cs: "Čeština",
};

interface LanguageSwitcherProps {
  currentLocale: Locale;
  className?: string;
}

export function LanguageSwitcher({ currentLocale, className }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Language");

  const handleLocaleChange = (locale: Locale) => {
    router.push(pathname, { locale });
  };

  return (
    <div className={cn("flex gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm", className)}>
      {routing.locales.map((locale) => (
        <Button
          key={locale}
          variant={locale === currentLocale ? "default" : "outline"}
          size="sm"
          onClick={() => handleLocaleChange(locale)}
          className={cn(
            "min-w-[70px] text-xs font-medium transition-all",
            locale === currentLocale
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
          aria-label={t("switchTo", { language: localeNames[locale] })}
        >
          {localeNames[locale]}
        </Button>
      ))}
    </div>
  );
}