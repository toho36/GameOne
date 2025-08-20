"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PencilIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { UserListProps } from "@/types/components/user-management.types";
import { useRoles } from "@/components/features/users/hooks/use-roles";

export function UserList({ users, isLoading, onEdit, onUpdateRole }: UserListProps) {
  const t = useTranslations("Users");
  const { roles, isLoading: rolesLoading } = useRoles();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, roleId: string) => {
    setUpdatingUserId(userId);
    try {
      await onUpdateRole(userId, roleId);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleColor = (roleName: string) => {
    const role = roles.find((r) => r.name === roleName);
    return role?.color || "#6B7280";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div>
                  <div className="mb-1 h-4 w-32 rounded bg-gray-200"></div>
                  <div className="h-3 w-48 rounded bg-gray-200"></div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-20 rounded bg-gray-200"></div>
                <div className="h-8 w-8 rounded bg-gray-200"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("noUsers")}</h3>
          <p className="text-gray-600">{t("createFirst")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <span className="text-sm font-medium">
                  {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* User Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {user.name || t("form.labels.name")}
                </h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* Role Selector */}
              <select
                value={user.userRoles?.[0]?.role?.name || ""}
                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                disabled={rolesLoading || updatingUserId === user.id}
                className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{
                  borderColor: getRoleColor(user.userRoles?.[0]?.role?.name || ""),
                }}
              >
                <option value="">{t("form.labels.role")}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.displayName || role.name}
                  </option>
                ))}
              </select>

              {/* Edit Button */}
              <Button
                onClick={() => onEdit(user.id)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <PencilIcon className="h-4 w-4" />
                {t("edit")}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
