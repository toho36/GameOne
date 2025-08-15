/**
 * Simple logger utility to replace console statements
 * Uses environment variable to control logging in production
 */

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment || process.env["DEBUG_LOGGING"] === "true") {
      // ← Opravit zde
      // eslint-disable-next-line no-console
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (!isProduction || process.env["DEBUG_LOGGING"] === "true") {
      // eslint-disable-next-line no-console
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    // Always log errors
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`, ...args);
  },

  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment && process.env["DEBUG_LOGGING"] === "true") {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};
