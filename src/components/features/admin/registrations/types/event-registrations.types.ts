export interface AdminRegistrationRow {
  id: string;
  userId?: string | null;
  participantName: string;
  participantEmail: string;
  status: string;
  paymentStatus: string;
  registeredAt: string | Date;
  contact?: { name?: string; phone?: string; email?: string } | string | null;
}

export interface AdminRegistrationsResponse {
  items: AdminRegistrationRow[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminRegistrationFilters {
  status?: string;
  paymentStatus?: string;
}
