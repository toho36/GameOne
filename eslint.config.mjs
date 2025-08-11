import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  js.configs.recommended,
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // Disable specific rules that are causing issues with Shadcn components
      'tailwindcss/enforces-shorthand': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-duplicate-imports': 'off',
    },
  },
];

export default eslintConfig;