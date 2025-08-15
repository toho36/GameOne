import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  js.configs.recommended,
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Disable specific rules that are causing issues with Shadcn components
      "tailwindcss/enforces-shorthand": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      "no-duplicate-imports": "off",

      // === ZÁKLADNÍ TYPE SAFETY ===

      // Zakázat any typy (pokud je TypeScript plugin dostupný)
      "no-var": "error",
      "prefer-const": "error",
      "no-unused-vars": "error",

      // Code quality
      "no-console": "warn",
      "no-debugger": "error",
      "no-alert": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
    },
  },
];

export default eslintConfig;
