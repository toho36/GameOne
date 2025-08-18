"use client";

import { useState, useEffect, useCallback } from "react";

import { RolesResponse, UseRolesReturn } from "@/components/features/users/user-management.types";

export function useRoles(): UseRolesReturn {
  const [roles, setRoles] = useState<RolesResponse["roles"]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/roles");

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in again.");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to view roles.");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again in a few moments.");
        } else {
          throw new Error("Failed to fetch roles. Please check your connection.");
        }
      }

      const data: RolesResponse = await response.json();
      setRoles(data.roles);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Network error. Please check your internet connection and try again.");
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    isLoading,
    error,
    refetch: fetchRoles,
  };
}
