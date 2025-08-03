"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const localeNames: Record<Locale, string> = {
  en: "EN",
  cs: "CS",
};

interface LanguageSwitcherProps {
  currentLocale: Locale;
  className?: string;
  variant?: "default" | "compact";
}

export function LanguageSwitcher({ 
  currentLocale, 
  className,
  variant = "default"
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Language");

  const handleLocaleChange = (locale: Locale) => {
    router.push(pathname, { locale });
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex gap-1 rounded-md border border-gray-200 bg-white p-0.5 shadow-sm", className)}>
        {routing.locales.map((locale) => (
          <Button
            key={locale}
            variant={locale === currentLocale ? "default" : "ghost"}
            size="sm"
            onClick={() => handleLocaleChange(locale)}
            className={cn(
              "h-7 min-w-[40px] text-xs font-medium transition-all",
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

  return (
    <div className={cn("flex gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm", className)}>
      {routing.locales.map((locale) => (
        <Button
          key={locale}
          variant={locale === currentLocale ? "default" : "outline"}
          size="sm"
          onClick={() => handleLocaleChange(locale)}
          className={cn(
            "min-w-[60px] text-sm font-medium transition-all",
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