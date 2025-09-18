import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { EventRegistration } from "@/components/features/events/event-registration";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key.split(".").slice(-1)[0],
}));

const baseEvent: any = {
  id: "e1",
  title: "Event",
  canRegister: true,
  registrationOpen: true,
  availableSpots: 5,
  confirmedParticipants: 0,
  waitingListCount: 0,
  price: 2,
  currency: "CZK",
  requiresApproval: false,
};

describe("EventRegistration UI", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows simplified Register button for authenticated users", () => {
    vi.mock("@/components/auth/session-provider", () => ({
      useSession: () => ({ isAuthenticated: true, isLoading: false }),
    }));

    render(<EventRegistration event={baseEvent} />);
    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
    // No form inputs should be present
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("shows full form for guests (not authenticated)", () => {
    vi.mock("@/components/auth/session-provider", () => ({
      useSession: () => ({ isAuthenticated: false, isLoading: false }),
    }));

    render(<EventRegistration event={baseEvent} />);
    // Guest form renders emergency contact fields with placeholders
    expect(screen.getByPlaceholderText(/namePlaceholder/i)).toBeInTheDocument();
  });
});

