import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postJson } from "@/lib/api/client";
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
      postJson<VerifyResponse>(
        `/api/registrations/${registrationId}/verify`,
        payload as unknown as Record<string, unknown>
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationsKeys.details() });
      qc.invalidateQueries({ queryKey: registrationsKeys.lists() });
      qc.invalidateQueries({ queryKey: registrationsKeys.detail(registrationId) });
    },
  });
}
