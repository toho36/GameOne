import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/kinde-auth";
import Link from "next/link";

export default async function HomePage() {
  const t = await getTranslations("HomePage");
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section - Pure Tailwind for layout */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* Main Heading */}
            <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 md:text-6xl lg:text-7xl">
              {t("title")}
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl lg:text-2xl">
              {t("description")}
            </p>

            {/* User-specific content */}
            {user ? (
              <div className="mb-12">
                <Card className="mb-6 border-green-200/50 bg-green-50/80 shadow-lg backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h2 className="mb-2 text-xl font-semibold text-green-900">
                      {t("welcomeBack", { name: user.given_name ?? user.email ?? "User" })}
                    </h2>
                    <p className="mb-4 text-green-700">
                      {t("readyToManage")}
                    </p>
                    <Link href="/dashboard">
                      <Button size="lg" className="px-8 py-3 text-lg font-semibold">
                        {t("goToDashboard")}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="mb-12">
                {/* CTA Buttons */}
                <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Button size="lg" className="px-8 py-3 text-lg font-semibold">
                    {t("getStarted")}
                  </Button>
                  <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                    {t("learnMore")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Background Decoration - Pure Tailwind */}
        <div className="absolute inset-0 -z-10">
          <div className="animate-blob absolute left-1/4 top-0 size-72 rounded-full bg-blue-200 opacity-70 mix-blend-multiply blur-xl" />
          <div className="animate-blob animation-delay-2000 absolute right-1/4 top-0 size-72 rounded-full bg-purple-200 opacity-70 mix-blend-multiply blur-xl" />
          <div className="animate-blob animation-delay-4000 absolute -bottom-8 left-1/3 size-72 rounded-full bg-pink-200 opacity-70 mix-blend-multiply blur-xl" />
        </div>
      </section>

      {/* Features Section - Shadcn Cards with Tailwind layout */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              {t("whyChoose")}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              {t("powerfulTools")}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 - Shadcn Card */}
            <Card className="transition-all hover:scale-105 hover:shadow-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-blue-100">
                  <svg className="size-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <CardTitle>{t("eventManagement")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center leading-relaxed">
                  {t("eventManagementDesc")}
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 2 - Shadcn Card */}
            <Card className="transition-all hover:scale-105 hover:shadow-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="size-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <CardTitle>{t("registrationSystem")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center leading-relaxed">
                  {t("registrationSystemDesc")}
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 3 - Shadcn Card */}
            <Card className="transition-all hover:scale-105 hover:shadow-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-purple-100">
                  <svg className="size-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <CardTitle>{t("analytics")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center leading-relaxed">
                  {t("analyticsDesc")}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
