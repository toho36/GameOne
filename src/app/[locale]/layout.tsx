import "@/styles/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { routing, type Locale } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/language-switcher";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BunPlate",
  description: "A clean, minimal web application",
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Ensure that the incoming locale is valid
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <header className="absolute top-4 right-4">
            <LanguageSwitcher currentLocale={locale as Locale} />
          </header>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
