import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postJson } from "@/lib/api/client";
import { registrationsKeys } from "@/lib/api/query-keys";

interface RejectPayload {
  reason?: string;
}

interface RejectResponse {
  registrationId: string;
  status: string;
  message?: string;
}

export function useRejectRegistration(registrationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RejectPayload) =>
      postJson<RejectResponse>(
        `/api/registrations/${registrationId}/reject`,
        payload as unknown as Record<string, unknown>
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationsKeys.details() });
      qc.invalidateQueries({ queryKey: registrationsKeys.lists() });
      qc.invalidateQueries({ queryKey: registrationsKeys.detail(registrationId) });
    },
  });
}
