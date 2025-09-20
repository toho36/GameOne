export interface MyRegistrationStatus {
  hasRegistration: boolean;
  registrationId?: string;
  status?: "PENDING" | "CONFIRMED" | "CANCELLED" | "WAITLISTED" | "CHECKED_IN" | "NO_SHOW";
  paymentStatus?:
    | "PENDING_VERIFICATION"
    | "PAYMENT_SENT_AWAITING_VERIFICATION"
    | "PAYMENT_VERIFIED"
    | "PAYMENT_FAILED"
    | "REFUNDED";
  waitingListPosition?: number | null;
}
