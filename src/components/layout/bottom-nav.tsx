"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuthorization } from "@/components/auth";

export function BottomNav() {
  const t = useTranslations("Navigation");
  const { roles } = useAuthorization();
  const canManageEvents = roles.some((r) => ["ADMIN", "MODERATOR", "EVENT_MANAGER"].includes(r));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-3">
        <li>
          <Link
            href="/"
            className="flex h-14 items-center justify-center gap-2 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9.5l9-7 9 7V20a2 2 0 01-2 2h-4a2 2 0 01-2-2V13H9v7a2 2 0 01-2 2H3a2 2 0 01-2-2V9.5z"
              />
            </svg>
            <span className="sr-only">{t("discover")}</span>
          </Link>
        </li>
        <li>
          {canManageEvents ? (
            <Link
              href="/manage-events"
              className="flex h-14 items-center justify-center gap-2 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span className="sr-only">{t("manageEvents")}</span>
            </Link>
          ) : (
            <div className="flex h-14 items-center justify-center px-3 opacity-50" aria-hidden />
          )}
        </li>
        <li>
          <Link
            href="/dashboard"
            className="flex h-14 items-center justify-center gap-2 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h7v7H3V3zm11 0h7v4h-7V3zM3 14h7v7H3v-7zm11-4h7v11h-7V10z"
              />
            </svg>
            <span className="sr-only">{t("dashboard")}</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
