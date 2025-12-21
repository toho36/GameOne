import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, any>) => {
    if (key === "count") return String(values?.["count"] ?? 0) + " confirmed participants";
    return key;
  },
}));

vi.mock("@/lib/api/client", () => ({
  getJson: vi.fn(),
}));

import { RegisteredUsersList } from "@/components/features/events/registered-users-list";
import { getJson } from "@/lib/api/client";

function renderWithRQ(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("RegisteredUsersList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows count and names when authorized payload includes participants", async () => {
    (getJson as any).mockResolvedValue({
      count: 3, participants: [
        { id: "u1", name: "John Doe" },
        { id: "u2", name: "Jane Smith" },
        { id: "u3", name: "Mike Johnson" },
      ]
    });

    renderWithRQ(<RegisteredUsersList eventId="e1" />);

    expect(await screen.findByText(/3 confirmed participants/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe, Jane Smith, Mike Johnson/)).toBeInTheDocument();
  });

  it("shows count and hidden message when names not provided", async () => {
    (getJson as any).mockResolvedValue({ count: 2 });
    renderWithRQ(<RegisteredUsersList eventId="e2" />);

    expect(await screen.findByText(/2 confirmed participants/i)).toBeInTheDocument();
    expect(screen.getByText(/namesHidden/i)).toBeInTheDocument();
  });
});

