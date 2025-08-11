import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/kinde-auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth";
import Link from "next/link";
import { UserAvatar } from "@/components/auth/user-avatar";

export default async function DashboardPage() {
    const t = await getTranslations("Dashboard");

    try {
        const user = await getCurrentUser();

        // If no user, redirect to login
        if (!user) {
            redirect("/api/auth/login");
        }

        return (
            <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
                <div className="container mx-auto px-4 py-8">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {t("title")}
                                </h1>
                                <p className="mt-2 text-gray-600">
                                    {t("welcome")} {user.email}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/"
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    {t("goHome")}
                                </Link>
                                <LogoutButton className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700" />
                            </div>
                        </div>
                    </div>

                    {/* Authentication Status */}
                    <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-2">
                            <div className="size-3 rounded-full bg-green-500" />
                            <span className="font-medium text-green-800">
                                {t("authenticated")}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-green-700">
                            {t("authStatus")}
                        </p>
                    </div>

                    {/* Dashboard Grid */}
                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* User Information Card */}
                        <div className="lg:col-span-2">
                            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
                                <div className="mb-6 flex items-center gap-4">
                                    <UserAvatar user={user} size="lg" />
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {user.given_name && user.family_name
                                                ? `${user.given_name} ${user.family_name}`
                                                : user.given_name ?? user.family_name ?? "User"}
                                        </h2>
                                        <p className="text-gray-600">{user.email}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="size-2 rounded-full bg-green-500" />
                                            <span className="text-sm font-medium text-green-700">Online</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">{t("email")}</label>
                                            <p className="font-medium text-gray-900">{user.email ?? "N/A"}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">{t("name")}</label>
                                            <p className="font-medium text-gray-900">
                                                {user.given_name && user.family_name
                                                    ? `${user.given_name} ${user.family_name}`
                                                    : user.given_name ?? user.family_name ?? "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">{t("userId")}</label>
                                            <p className="rounded bg-gray-50 px-3 py-1 font-mono text-sm text-gray-600">
                                                {user.id}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Account Status</label>
                                            <div className="flex items-center gap-2">
                                                <div className="size-2 rounded-full bg-green-500" />
                                                <span className="font-medium text-green-700">Active</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Card */}
                        <div className="lg:col-span-1">
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-6 text-xl font-semibold text-gray-900">
                                    {t("actions")}
                                </h3>
                                <div className="space-y-4">
                                    <Link
                                        href="/events"
                                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
                                    >
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                                            <svg className="size-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Manage Events</p>
                                            <p className="text-sm text-gray-600">Create and organize events</p>
                                        </div>
                                    </Link>

                                    <Link
                                        href="/registrations"
                                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-green-300 hover:bg-green-50"
                                    >
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-green-100">
                                            <svg className="size-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Registrations</p>
                                            <p className="text-sm text-gray-600">View and manage registrations</p>
                                        </div>
                                    </Link>

                                    <Link
                                        href="/analytics"
                                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-purple-300 hover:bg-purple-50"
                                    >
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100">
                                            <svg className="size-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Analytics</p>
                                            <p className="text-sm text-gray-600">View event statistics</p>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    } catch (error) {
        console.error("Error on dashboard page:", error);
        // Fallback for error or unauthenticated state
        redirect("/api/auth/login");
    }
} 