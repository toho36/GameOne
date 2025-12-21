import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import en from "../../../../../../messages/en.json";

const { current } = vi.hoisted(() => ({
  current: { value: { data: undefined, isLoading: false, isError: false } } as { value: any },
}));

vi.mock("next-intl", () => ({
  useTranslations: (ns?: string) => {
    return (key: string, values?: Record<string, any>) => {
      const resolve = (obj: any, path: string) => path.split(".").reduce((a: any, p: string) => (a ? a[p] : undefined), obj);
      const fullKey = ns ? `${ns}.${key}` : key;
      let tpl = resolve(en as any, fullKey) ?? key;
      if (typeof tpl !== "string") tpl = String(tpl);
      return tpl.replace(/\{(\w+)\}/g, (_: string, k: string) => String(values?.[k] ?? ""));
    };
  },
}));

vi.mock("@/components/features/registration/hooks/use-registration-status", () => ({
  useRegistrationStatus: () => current.value,
}));

import { RegistrationConfirmation } from "@/components/features/registration/components/registration-confirmation";

function mockHook(value: any) {
  current.value = value;
}

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("RegistrationConfirmation", () => {
  it("shows loading state", () => {
    mockHook({ isLoading: true, isError: false, data: undefined });
    renderWithProviders(<RegistrationConfirmation registrationId="r1" />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockHook({ isLoading: false, isError: true, data: undefined });
    renderWithProviders(<RegistrationConfirmation registrationId="r1" />);
    expect(screen.getByText(/Failed to load registration/i)).toBeInTheDocument();
  });

  it("shows payment instructions and claim button in PENDING_VERIFICATION", () => {
    mockHook({
      isLoading: false,
      isError: false,
      data: {
        id: "r1",
        eventId: "e1",
        userId: "u1",
        status: "CONFIRMED",
        groupSize: 1,
        paymentStatus: "PENDING_VERIFICATION",
        event: {
          id: "e1",
          title: "Event",
          startDate: new Date().toISOString(),
          price: 100,
          currency: "CZK",
          bankAccountId: null,
          allowWaitingList: true,
          capacity: 50,
          requiresPayment: true,
        },
        qrCodeUrl: "qr://from-api",
      },
    });
    renderWithProviders(<RegistrationConfirmation registrationId="r1" />);
    expect(screen.getByText(/Payment instructions/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Payment QR Code for 100 CZK/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /I've sent payment/i })).toBeInTheDocument();
  });

  it("hides payment instructions when verified", () => {
    mockHook({
      isLoading: false,
      isError: false,
      data: {
        id: "r1",
        eventId: "e1",
        userId: "u1",
        status: "CONFIRMED",
        groupSize: 1,
        paymentStatus: "PAYMENT_VERIFIED",
        event: {
          id: "e1",
          title: "Event",
          startDate: new Date().toISOString(),
          price: 100,
          currency: "CZK",
          bankAccountId: null,
          allowWaitingList: true,
          capacity: 50,
          requiresPayment: true,
        },
      },
    });
    renderWithProviders(<RegistrationConfirmation registrationId="r1" />);
    expect(screen.queryByText(/Payment instructions/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /I've sent payment/i })).not.toBeInTheDocument();
  });
});

