"use client";

import { useState, useEffect, useCallback } from "react";

import {
  UsersResponse,
  UserFilters,
  UseUsersOptions,
  UseUsersReturn,
} from "@/types/components/user-management.types";

export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
  const { filters: initialFilters = {}, page: initialPage = 1, limit = 20 } = options;

  const [users, setUsers] = useState<UsersResponse["users"]>([]);
  const [pagination, setPagination] = useState<UsersResponse["pagination"]>({
    page: initialPage,
    limit,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [filters, setFilters] = useState<UserFilters>(initialFilters);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(
            ([, value]) => value !== undefined && value !== null && value !== ""
          )
        ),
      });

      const response = await fetch(`/api/users?${searchParams}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in again.");
        } else if (response.status === 403) {
          throw new Error("insufficient_permissions");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again in a few moments.");
        } else {
          throw new Error("Failed to fetch users. Please check your connection.");
        }
      }

      const data: UsersResponse = await response.json();

      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Network error. Please check your internet connection and try again.");
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSetFilters = useCallback((newFilters: UserFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    users,
    pagination,
    isLoading,
    error,
    refetch: fetchUsers,
    setFilters: handleSetFilters,
    setPage: handleSetPage,
  };
}
