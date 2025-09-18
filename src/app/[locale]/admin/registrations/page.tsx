import React from "react";
import { AdminPendingClaimsList } from "@/components/features/registration/components/admin-pending-claims-list";

export default function AdminRegistrationsPage() {
  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 text-xl font-semibold">Pending Payment Claims</h1>
      <AdminPendingClaimsList />
    </div>
  );
}
