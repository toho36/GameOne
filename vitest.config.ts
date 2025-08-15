import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        ".next/",
        "coverage/",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        "**/test/**",
        "**/__tests__/**",
        "src/types/**",
        "prisma/**",
        "public/**",
      ],
    },
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
    // Add this to ensure mocks work properly
    mockReset: true,
    restoreMocks: true,
  },
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/messages": path.resolve(__dirname, "./messages"),
    },
  },
});
