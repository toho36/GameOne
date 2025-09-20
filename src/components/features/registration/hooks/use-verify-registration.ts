import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchJson } from "@/lib/api/client";
import { registrationsKeys } from "@/lib/api/query-keys";

interface VerifyPayload {
  method: "BANK_TRANSFER" | "CASH";
  notes?: string;
}

interface VerifyResponse {
  registrationId: string;
  status: string;
  message?: string;
}

export function useVerifyRegistration(registrationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyPayload) =>
      patchJson<VerifyResponse>(`/api/admin/registrations/${registrationId}`, {
        action: "verify_payment",
        ...payload,
      } as unknown as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationsKeys.details() });
      qc.invalidateQueries({ queryKey: registrationsKeys.lists() });
      qc.invalidateQueries({ queryKey: registrationsKeys.detail(registrationId) });
    },
  });
}
