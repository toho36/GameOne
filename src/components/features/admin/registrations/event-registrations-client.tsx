"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJson, patchJson } from "@/lib/api/client";
import { registrationsKeys } from "@/lib/api/query-keys";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import type {
  AdminRegistrationRow,
  AdminRegistrationsResponse,
  AdminRegistrationFilters,
} from "./types/event-registrations.types";

interface Props {
  eventId: string;
}

function useAdminEventRegistrations(
  eventId: string,
  filters: AdminRegistrationFilters,
  page: number,
  limit: number
) {
  return useQuery({
    queryKey: registrationsKeys.list({ scope: "admin-event", eventId, filters, page, limit }),
    queryFn: () =>
      getJson<AdminRegistrationsResponse>(
        `/api/admin/events/${eventId}/registrations?` +
          new URLSearchParams({
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
            page: String(page),
            limit: String(limit),
          }).toString()
      ),
  });
}

export function AdminEventRegistrationsClient({ eventId }: Props) {
  const t = useTranslations("AdminRegistrations");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filters, setFilters] = React.useState<AdminRegistrationFilters>({});
  const [page, setPage] = React.useState(1);
  const limit = 10;

  const { data, isLoading, isError } = useAdminEventRegistrations(eventId, filters, page, limit);

  const action = useMutation({
    mutationFn: (vars: {
      id: string;
      action: string;
      reason?: string;
      moveToWaitingList?: boolean;
    }) => patchJson(`/api/admin/registrations/${vars.id}`, vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationsKeys.list({ scope: "admin-event", eventId }) });
      toast({
        title: t("actionSuccessTitle"),
        description: t("actionSuccessDesc"),
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: t("actionErrorTitle"),
        description: t("actionErrorDesc"),
        duration: 4000,
        variant: "destructive",
      });
    },
  });

  const rows: AdminRegistrationRow[] = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          aria-label={t("statusFilter")}
          className="rounded border px-2 py-1"
          value={filters.status ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
        >
          <option value="">{t("allStatuses")}</option>
          {["PENDING", "CONFIRMED", "CANCELLED", "REJECTED", "ATTENDED", "NO_SHOW"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label={t("paymentFilter")}
          className="rounded border px-2 py-1"
          value={filters.paymentStatus ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, paymentStatus: e.target.value || undefined }))
          }
        >
          <option value="">{t("allPayments")}</option>
          {[
            "PENDING_VERIFICATION",
            "PAYMENT_SENT_AWAITING_VERIFICATION",
            "PAYMENT_VERIFIED",
            "VERIFIED_CASH",
            "REJECTED",
            "WAITING_LIST_PROMOTED",
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div>{t("loading")}</div>
      ) : isError ? (
        <div className="text-red-600">{t("error")}</div>
      ) : rows.length === 0 ? (
        <div>{t("noData")}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">{t("participant")}</th>
                <th className="p-2">{t("email")}</th>
                <th className="p-2">{t("status")}</th>
                <th className="p-2">{t("paymentStatus")}</th>
                <th className="p-2">{t("registeredAt")}</th>
                <th className="p-2">{t("contact")}</th>
                <th className="p-2">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.participantName}</td>
                  <td className="p-2">{r.participantEmail}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{r.paymentStatus}</td>
                  <td className="p-2">{new Date(r.registeredAt).toLocaleString()}</td>
                  <td className="p-2">
                    {r.contact ? (
                      typeof r.contact === "string" ? (
                        <span className="text-xs">{r.contact}</span>
                      ) : (
                        <div className="text-xs">
                          <div>{r.contact.name}</div>
                          <div>{r.contact.phone}</div>
                          <div>{r.contact.email}</div>
                        </div>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button
                        className="rounded border px-2 py-1 disabled:opacity-50"
                        disabled={action.isPending}
                        onClick={() => action.mutate({ id: r.id, action: "approve" })}
                      >
                        {t("approve")}
                      </button>
                      <button
                        className="rounded border px-2 py-1 disabled:opacity-50"
                        disabled={action.isPending}
                        onClick={() => action.mutate({ id: r.id, action: "decline" })}
                      >
                        {t("decline")}
                      </button>
                      {r.paymentStatus === "PENDING_VERIFICATION" && (
                        <>
                          <button
                            className="rounded border px-2 py-1 disabled:opacity-50"
                            disabled={action.isPending}
                            onClick={() => action.mutate({ id: r.id, action: "verify_payment" })}
                          >
                            {t("verifyPayment")}
                          </button>
                          <button
                            className="rounded border px-2 py-1 disabled:opacity-50"
                            disabled={action.isPending}
                            onClick={() => action.mutate({ id: r.id, action: "reject_payment" })}
                          >
                            {t("rejectPayment")}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          className="rounded border px-2 py-1"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          {t("prev")}
        </button>
        <span>{page}</span>
        <button
          className="rounded border px-2 py-1"
          disabled={!!data && page * limit >= (data.total ?? 0)}
          onClick={() => setPage((p) => p + 1)}
        >
          {t("next")}
        </button>
      </div>
    </div>
  );
}
