import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";
import React from "react";

// Make React available globally for tests
global.React = React;

// Ensure DOM environment is available
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string, values?: Record<string, any>) => {
    // Simple mock that returns the key with namespace
    const fullKey = namespace ? `${namespace}.${key}` : key;
    if (values) {
      return Object.keys(values).reduce((acc, valueKey) => {
        return acc.replace(`{${valueKey}}`, String(values[valueKey]));
      }, fullKey);
    }
    return fullKey;
  },
  useLocale: () => "en",
  useMessages: () => ({}),
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock next-intl navigation
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: any) => {
    return React.createElement("a", { href, ...props }, children);
  },
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/en",
}));

// Mock Kinde Auth
vi.mock("@kinde-oss/kinde-auth-nextjs/components", () => ({
  LoginLink: ({ children, className }: any) => {
    return React.createElement("button", { className, type: "button" }, children);
  },
  RegisterLink: ({ children, className }: any) => {
    return React.createElement("button", { className, type: "button" }, children);
  },
  LogoutLink: ({ children, className }: any) => {
    return React.createElement("button", { className, type: "button" }, children);
  },
}));

vi.mock("@kinde-oss/kinde-auth-nextjs", () => ({
  getKindeServerSession: () => ({
    getUser: vi.fn().mockReturnValue(null),
    isAuthenticated: vi.fn().mockReturnValue(false),
    getPermissions: vi.fn().mockReturnValue([]),
    getOrganization: vi.fn().mockReturnValue(null),
  }),
  useKindeAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    permissions: [],
    organization: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    event: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
  checkDatabaseHealth: vi.fn().mockResolvedValue({
    status: "healthy" as const,
    responseTime: 5,
  }),
  paginate: vi.fn().mockResolvedValue({
    data: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  }),
}));

// Mock auth session provider
vi.mock("@/components/auth/session-provider", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Kinde auth helper
vi.mock("@/lib/kinde-auth", () => ({
  getCurrentUser: vi.fn().mockReturnValue(null),
  getUserPermissions: vi.fn().mockReturnValue([]),
}));

// Mock environment variables
beforeAll(() => {
  Object.assign(process.env, {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost:5432/testdb",
    KINDE_CLIENT_ID: "test-client-id",
    KINDE_CLIENT_SECRET: "test-client-secret",
    KINDE_ISSUER_URL: "https://test.kinde.com",
    KINDE_SITE_URL: "http://localhost:3000",
    KINDE_POST_LOGOUT_REDIRECT_URL: "http://localhost:3000",
    KINDE_POST_LOGIN_REDIRECT_URL: "http://localhost:3000/dashboard",
  });
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
