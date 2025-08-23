import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getTranslations } from "next-intl/server";

import { EventCreationForm } from "@/components/features/events/creation";

export const metadata: Metadata = {
  title: "Create Event | GameOne",
  description: "Create a new event with our simple and intuitive event creation form.",
};

export default async function CreateEventPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const t = await getTranslations("Events");

  if (!user) {
    redirect("/api/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex-1">
              <nav className="mb-3 flex sm:mb-4" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 sm:space-x-4">
                  <li>
                    <div>
                      <Link
                        href="/dashboard"
                        className="text-sm text-gray-400 transition-colors hover:text-gray-500"
                      >
                        {t("form.breadcrumb.dashboard")}
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg
                        className="h-4 w-4 flex-shrink-0 text-gray-300 sm:h-5 sm:w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                      </svg>
                      <Link
                        href="/dashboard/events"
                        className="ml-2 text-sm text-gray-400 transition-colors hover:text-gray-500 sm:ml-4"
                      >
                        {t("form.breadcrumb.events")}
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg
                        className="h-4 w-4 flex-shrink-0 text-gray-300 sm:h-5 sm:w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                      </svg>
                      <span className="ml-2 text-sm text-gray-500 sm:ml-4" aria-current="page">
                        {t("form.breadcrumb.createEvent")}
                      </span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {t("form.pageTitle")}
              </h1>
              <p className="text-sm text-gray-600 sm:text-base">{t("form.pageDescription")}</p>
            </div>
            {/* Mobile-friendly back button */}
            <div className="flex sm:hidden">
              <Link
                href="/dashboard/events"
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                {t("form.backToEvents")}
              </Link>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <EventCreationForm mode="create" />
        </div>
      </div>
    </div>
  );
}
