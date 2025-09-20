export interface PaymentInstructionsProps {
  registrationId: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    price: number | null;
    currency: string | null;
    bankAccountId: string | null;
  };
  qrCodeUrl?: string; // allow parent to pass pre-generated QR
}
