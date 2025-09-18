"use client";

import React from "react";
import type { AdminPendingClaimsListProps } from "./admin-pending-claims-list.types";
import { usePendingClaims } from "@/components/features/registration/hooks/use-pending-claims";
import { useVerifyRegistration } from "@/components/features/registration/hooks/use-verify-registration";
import { useRejectRegistration } from "@/components/features/registration/hooks/use-reject-registration";
import { useTranslations } from "next-intl";

function PendingClaimRow({
  id,
  title,
  userEmail,
  claimedAt,
}: {
  id: string;
  title: string;
  userEmail: string;
  claimedAt?: string | null;
}) {
  const t = useTranslations("RegistrationUI.admin");
  const verify = useVerifyRegistration(id);
  const reject = useRejectRegistration(id);
  return (
    <li className="flex items-center justify-between rounded border p-3">
      <div className="text-sm">
        <div className="font-medium">{title}</div>
        <div className="text-gray-600">User: {userEmail}</div>
        <div className="text-gray-600">Claimed at: {claimedAt ?? "-"}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="rounded bg-green-600 px-3 py-1 text-white disabled:opacity-50"
          onClick={() => verify.mutate({ method: "BANK_TRANSFER" })}
          disabled={verify.isPending}
        >
          {verify.isPending ? t("verifying") : t("verify")}
        </button>
        <button
          className="rounded bg-red-600 px-3 py-1 text-white disabled:opacity-50"
          onClick={() => reject.mutate({ reason: "Invalid reference" })}
          disabled={reject.isPending}
        >
          {reject.isPending ? t("rejecting") : t("reject")}
        </button>
      </div>
    </li>
  );
}

export function AdminPendingClaimsList({ page = 1, pageSize = 20 }: AdminPendingClaimsListProps) {
  const t = useTranslations("RegistrationUI.admin");
  const offset = (page - 1) * pageSize;
  const { data, isLoading, isError } = usePendingClaims({ limit: pageSize, offset });

  if (isLoading) return <div>{t("loading")}</div>;
  if (isError || !data) return <div>{t("error")}</div>;

  return (
    <div className="space-y-3">
      {data.items.length === 0 ? (
        <div className="text-sm text-gray-600">{t("empty")}</div>
      ) : (
        <ul className="space-y-2">
          {data.items.map((item) => (
            <PendingClaimRow
              key={item.id}
              id={item.id}
              title={item.event.title}
              userEmail={item.user.email}
              claimedAt={item.paymentClaimedAt}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminPendingClaimsList;
