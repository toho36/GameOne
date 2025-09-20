import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api/client";
import { registrationsKeys } from "@/lib/api/query-keys";

interface PendingClaimsResponse {
  items: Array<{
    id: string;
    event: { id: string; title: string; startsAt: string };
    user: { id: string; email: string; name: string };
    paymentClaimedAt?: string | null;
    paymentStatus: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

export function usePendingClaims(params?: { limit?: number; offset?: number }) {
  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;
  return useQuery({
    queryKey: registrationsKeys.list({
      paymentStatus: "PAYMENT_SENT_AWAITING_VERIFICATION",
      limit,
      offset,
    }),
    queryFn: () =>
      getJson<{
        items: PendingClaimsResponse["items"];
        total: number;
        limit: number;
        offset: number;
      }>(
        `/api/registrations?paymentStatus=PAYMENT_SENT_AWAITING_VERIFICATION&limit=${limit}&offset=${offset}`
      ),
  });
}
