import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api/client";
import { registrationsKeys } from "@/lib/api/query-keys";

export interface RegistrationDetail {
  id: string;
  eventId: string;
  userId: string | null;
  status: string;
  groupSize: number | null;
  paymentStatus: string;
  paymentMethod?: string | null;
  paymentId?: string | null;
  pendingPaymentId?: string | null;
  paymentClaimedAt?: string | null;
  paymentVerifiedAt?: string | null;
  paymentRejectedAt?: string | null;
  paymentRejectionReason?: string | null;
  qrCodeUrl?: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    price: number | null;
    currency: string | null;
    bankAccountId: string | null;
    allowWaitingList: boolean;
    capacity: number | null;
    requiresPayment: boolean | null;
  };
}

export function useRegistrationStatus(registrationId: string) {
  return useQuery({
    queryKey: registrationsKeys.detail(registrationId),
    queryFn: () => getJson<RegistrationDetail>(`/api/registrations/${registrationId}`),
  });
}
