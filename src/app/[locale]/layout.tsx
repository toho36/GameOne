import React from "react";
import "@/styles/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { routing, type Locale } from "@/i18n/routing";
import { Navigation } from "@/components/layout/navigation";
import { SessionProvider } from "@/components/auth";
import { getCurrentUser, getUserPermissions } from "@/lib/kinde-auth";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GameOne - Event Management Platform",
  description: "The ultimate event management platform for modern teams. Create, manage, and track events with ease.",
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

  // Get server-side session data to prevent hydration mismatches
  const serverUser = await getCurrentUser();
  const serverPermissions = serverUser ? await getUserPermissions() : [];

  const initialSession = {
    user: serverUser,
    isAuthenticated: !!serverUser,
    isLoading: false,
    error: null,
    permissions: serverPermissions,
    organization: null, // This could be fetched server-side too if needed
  };

  return (
    <html lang={locale}>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <SessionProvider initialSession={initialSession}>
            <Navigation currentLocale={locale as Locale} />
            {children}
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
