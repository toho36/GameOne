"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

const localeNames: Record<Locale, string> = {
  en: "English",
  cs: "Čeština",
};

interface LanguageSwitcherProps {
  currentLocale: Locale;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (locale: Locale) => {
    router.push(pathname, { locale });
  };

  return (
    <div className="flex gap-2">
      {routing.locales.map((locale) => (
        <Button
          key={locale}
          variant={locale === currentLocale ? "default" : "outline"}
          size="sm"
          onClick={() => handleLocaleChange(locale)}
          className="min-w-[80px]"
        >
          {localeNames[locale]}
        </Button>
      ))}
    </div>
  );
}