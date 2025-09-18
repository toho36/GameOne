export interface AdminRegistrationRow {
  id: string;
  userId?: string | null;
  participantName: string;
  participantEmail: string;
  status: string;
  paymentStatus: string;
  registeredAt: string | Date;
  emergencyContact?: { name?: string; phone?: string; email?: string } | null;
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
