import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/email/resend", () => ({
  sendEmail: vi.fn(async () => ({ success: true }))
}));

vi.mock("@/lib/qr-code", () => ({
  generateQRCodeURL: vi.fn(() => "qr://mock-url")
}));
const intlDict = vi.hoisted(() => ({
  dict: {
    "RegistrationEmails.claim.subject": "Payment claim received — {title}",
    "RegistrationEmails.claim.title": "Payment claim received",
    "RegistrationEmails.claim.amount": "Amount: {amount} {currency}",
    "RegistrationEmails.claim.eventDate": "Event date: {date}",
    "RegistrationEmails.claim.nextSteps": "You'll receive an email once an admin verifies your payment.",
    "RegistrationEmails.claim.qrHint": "If you haven't sent the payment yet, you can use this QR code:",

    "RegistrationEmails.verified.subject": "Payment verified — {title}",
    "RegistrationEmails.verified.title": "Payment verified",
    "RegistrationEmails.verified.body": "Your payment for registration was verified. See you on {date}.",

    "RegistrationEmails.rejected.subject": "Payment issue — {title}",
    "RegistrationEmails.rejected.title": "Payment not verified",
    "RegistrationEmails.rejected.body": "We couldn't verify your payment. Please review your transfer details and try again.",
    "RegistrationEmails.rejected.reason": "Reason: {reason}",
    "RegistrationEmails.rejected.qrHint": "You can use this QR code:",
  }
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    createTranslator: () => (key: string, values?: Record<string, any>) => {
      const tpl = (intlDict as any).dict[key] ?? key;
      return tpl.replace(/\{(\w+)\}/g, (_: string, k: string) => String(values?.[k] ?? ""));
    },
    NextIntlProvider: ({ children }: any) => children,
    NextIntlClientProvider: ({ children }: any) => children,
  };
});


const hoisted = vi.hoisted(() => ({
  prismaUser: { findUnique: vi.fn() },
  prismaEvent: { findUnique: vi.fn() },
  prismaRegistration: { findUnique: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: hoisted.prismaUser,
    event: hoisted.prismaEvent,
    registration: hoisted.prismaRegistration,
  },
}));

import { sendEmail } from "@/lib/email/resend";
import { sendPaymentClaimReceived, sendPaymentVerified, sendPaymentRejected } from "@/lib/api/email/registration";
import { generateQRCodeURL } from "@/lib/qr-code";

const userId = "user-1";
const eventId = "event-1";
const registrationId = "reg-1";

beforeEach(() => {
  vi.clearAllMocks();
});

function primeHappy() {
  (hoisted.prismaUser.findUnique as any).mockResolvedValue({ email: "u@example.com", name: "User" });
  (hoisted.prismaEvent.findUnique as any).mockResolvedValue({
    title: "Great Event",
    startDate: new Date("2025-10-05T10:00:00Z").toISOString(),
    price: 150,
    currency: "CZK",
  });
  (hoisted.prismaRegistration.findUnique as any).mockResolvedValue({ id: registrationId });
}

describe("registration email helpers", () => {
  it("sends claim received email with QR and details", async () => {
    primeHappy();
    const res = await sendPaymentClaimReceived(userId, eventId, registrationId);
    expect(res.success).toBe(true);
    expect(sendEmail).toHaveBeenCalled();
    const args = (sendEmail as any).mock.calls[0][0];
    expect(args.to).toBe("u@example.com");
    expect(args.subject).toContain("Payment");
    expect(args.html).toContain("Great Event");
    expect(args.html).toContain("qr://mock-url");
    expect(generateQRCodeURL).toHaveBeenCalled();
  });

  it("sends verified email", async () => {
    primeHappy();
    const res = await sendPaymentVerified(userId, eventId, registrationId);
    expect(res.success).toBe(true);
    expect(sendEmail).toHaveBeenCalled();
    const args = (sendEmail as any).mock.calls[0][0];
    expect(args.subject).toContain("verified");
    expect(args.html).toContain("Great Event");
  });

  it("sends rejected email with reason", async () => {
    primeHappy();
    const res = await sendPaymentRejected(userId, eventId, registrationId, "Invalid ref");
    expect(res.success).toBe(true);
    const args = (sendEmail as any).mock.calls[0][0];
    expect(args.subject).toContain("issue");
    expect(args.html).toContain("Invalid ref");
  });

  it("returns error when context missing", async () => {
    (hoisted.prismaUser.findUnique as any).mockResolvedValue(null);
    (hoisted.prismaEvent.findUnique as any).mockResolvedValue(null);
    (hoisted.prismaRegistration.findUnique as any).mockResolvedValue(null);
    const res = await sendPaymentClaimReceived(userId, eventId, registrationId);
    expect(res.success).toBe(false);
  });
});

