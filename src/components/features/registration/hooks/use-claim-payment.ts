import { useMutation } from "@tanstack/react-query";
import { postJson } from "@/lib/api/client";

interface ClaimPayload {
  transactionId?: string;
  notes?: string;
}

interface ClaimResponse {
  registrationId: string;
  paymentId?: string;
  status: string;
  message?: string;
}

export function useClaimPayment(registrationId: string) {
  return useMutation({
    mutationFn: (payload: ClaimPayload) =>
      postJson<ClaimResponse>(
        `/api/registrations/${registrationId}/claim-payment`,
        payload as unknown as Record<string, unknown>
      ),
  });
}
