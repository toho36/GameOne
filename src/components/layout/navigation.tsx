"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserProfile } from "@/components/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useState } from "react";
import { type Locale } from "@/i18n/routing";

interface NavigationProps {
  currentLocale: Locale;
}

export function Navigation({ currentLocale }: NavigationProps) {
    const t = useTranslations("Navigation");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="size-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
                            <span className="text-xl font-bold text-gray-900">GameOne</span>
                        </Link>
                    </div>

                    {/* Navigation Links - Desktop */}
                    <div className="hidden items-center space-x-8 md:flex">
                        <Link
                            href="/"
                            className="text-gray-600 transition-colors hover:text-gray-900"
                        >
                            {t("home")}
                        </Link>
                        <Link
                            href="/dashboard"
                            className="text-gray-600 transition-colors hover:text-gray-900"
                        >
                            {t("dashboard")}
                        </Link>
                    </div>

                    {/* Right Side: Language Switcher + User Profile */}
                    <div className="flex items-center gap-4">
                        {/* Language Switcher */}
                        <div className="hidden md:block">
                            <LanguageSwitcher currentLocale={currentLocale} variant="compact" />
                        </div>

                        {/* User Profile / Auth Buttons */}
                        <UserProfile />

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                                aria-label="Toggle mobile menu"
                            >
                                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="border-t border-gray-200 bg-white md:hidden">
                        <div className="flex flex-col space-y-2 p-4">
                            <Link
                                href="/"
                                className="rounded-md px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {t("home")}
                            </Link>
                            <Link
                                href="/dashboard"
                                className="rounded-md px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {t("dashboard")}
                            </Link>
                            
                            {/* Language Switcher in Mobile Menu */}
                            <div className="border-t border-gray-200 pt-2">
                                <div className="px-3 py-2">
                                    <span className="text-sm font-medium text-gray-700 mb-2 block">
                                        Language
                                    </span>
                                    <LanguageSwitcher currentLocale={currentLocale} variant="compact" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
} 