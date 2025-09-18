import { useMutation } from "@tanstack/react-query";
import { postJson } from "@/lib/api/client";

interface RegisterPayload {
  numberOfGuests?: number;
  emergencyContact?: string;
  guestDetails?: unknown;
}

interface RegisterResponse {
  registrationId: string;
  status: string;
  pendingPaymentId?: string;
  message?: string;
}

export function useRegister(eventId: string) {
  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      postJson<RegisterResponse>(
        `/api/events/${eventId}/register`,
        payload as unknown as Record<string, unknown>
      ),
  });
}
