"use client";

import { useState, useMemo, useCallback } from "react";

import {
  UsersResponse,
  UserFilters,
  UseUsersOptions,
  UseUsersReturn,
} from "@/types/components/user-management.types";
import { getJson } from "@/lib/api/client";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { normalizeApiError } from "@/lib/api/errors";
import { usersKeys } from "@/lib/api/query-keys";

export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
  const { filters: initialFilters = {}, page: initialPage = 1, limit = 20 } = options;

  const [filters, setFilters] = useState<UserFilters>(initialFilters);
  const [page, setPage] = useState(initialPage);

  const search = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== "")
      ),
    });
    return params.toString();
  }, [filters, page, limit]);

  const query = useQuery({
    queryKey: usersKeys.list({ filters, page, limit }),
    queryFn: () => getJson<UsersResponse>(`/api/users?${search}`),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const data = query.data as any;
  const users = Array.isArray(data?.users) ? data.users : [];
  const pagination = (data?.pagination as UsersResponse["pagination"]) ?? {
    page,
    limit,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  };

  const handleSetFilters = useCallback((newFilters: UserFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    users,
    pagination,
    isLoading: query.isLoading,
    error: query.error ? normalizeApiError(query.error) : null,
    refetch: query.refetch,
    setFilters: handleSetFilters,
    setPage: handleSetPage,
  };
}
