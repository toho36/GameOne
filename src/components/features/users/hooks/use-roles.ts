"use client";

import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/errors";
import { rolesKeys } from "@/lib/api/query-keys";
import { RolesResponse, UseRolesReturn } from "@/types/components/user-management.types";

export function useRoles(): UseRolesReturn {
  const query = useQuery({
    queryKey: rolesKeys.list(),
    queryFn: () => getJson<RolesResponse>("/api/roles"),
    staleTime: 30_000,
  });

  return {
    roles: (query.data?.roles as RolesResponse["roles"]) ?? [],
    isLoading: query.isLoading,
    error: query.error ? normalizeApiError(query.error) : null,
    refetch: query.refetch,
  };
}
