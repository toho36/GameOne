import { render, screen } from "@testing-library/react";
import { Navigation } from "@/components/layout/navigation";
import React from "react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

let mockRoles: string[] = [];
vi.mock("@/components/auth/session-provider", async () => {
  const actual = await vi.importActual<any>("@/components/auth/session-provider");
  return {
    ...actual,
    useAuthorization: () => ({ roles: mockRoles, permissions: [], isAuthenticated: true }),
  };
});

vi.mock("@/components/auth", async () => {
  const actual = await vi.importActual<any>("@/components/auth");
  return {
    ...actual,
    UserProfile: () => React.createElement("div", { "data-testid": "user-profile" }),
  };
});

describe("Navigation RBAC", () => {
  it("hides admin links for regular user", () => {
    mockRoles = [];
    render(<Navigation currentLocale={"en" as any} />);

    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.queryByText("users")).not.toBeInTheDocument();
    expect(screen.queryByText("bankAccounts")).not.toBeInTheDocument();
    expect(screen.queryByText("manageEvents")).not.toBeInTheDocument();
  });

  it("shows manage-events for event manager role", () => {
    mockRoles = ["EVENT_MANAGER"];
    render(<Navigation currentLocale={"en" as any} />);

    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.getByText("manageEvents")).toBeInTheDocument();
    expect(screen.queryByText("users")).not.toBeInTheDocument();
    expect(screen.queryByText("bankAccounts")).not.toBeInTheDocument();
  });

  it("shows admin links for admin role", () => {
    mockRoles = ["ADMIN"];
    render(<Navigation currentLocale={"en" as any} />);

    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.getByText("manageEvents")).toBeInTheDocument();
    expect(screen.getByText("users")).toBeInTheDocument();
    expect(screen.getByText("bankAccounts")).toBeInTheDocument();
  });
});

