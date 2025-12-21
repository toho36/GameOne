"use client";

import type { RegistrationStatusCardProps } from "./registration-status-card.types";

export function RegistrationStatusCard({
  registrationId,
  status,
  paymentStatus,
}: RegistrationStatusCardProps) {
  return (
    <div className="space-y-1 rounded border p-3">
      <div className="text-sm text-gray-500">Registration #{registrationId}</div>
      <div className="text-sm">
        Status: <strong>{status}</strong>
      </div>
      <div className="text-sm">
        Payment: <strong>{paymentStatus}</strong>
      </div>
    </div>
  );
}

export default RegistrationStatusCard;
