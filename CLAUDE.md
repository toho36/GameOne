# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Development Commands

Use Bun as the primary package manager and runtime. All commands should use
`bun` instead of `npm`:

### Core Development

- `bun run dev` - Start development server with Turbopack (fast HMR)
- `bun run build` - Build for production
- `bun run start` - Start production server

### Code Quality

- `bun run lint` - Run ESLint checks
- `bun run lint:fix` - Auto-fix ESLint errors
- `bun run format` - Format code with Prettier
- `bun run format:check` - Check Prettier formatting
- `bun run type-check` - Run TypeScript type checking

### Testing

- `bun run test` - Run Vitest unit tests (use this, NOT `bun test`)
- `bun run test --run` - Run tests once without watch mode
- `bun run test:watch` - Run tests in watch mode
- `bun run test:coverage` - Run tests with coverage report
- `bun run test:ui` - Run tests with Vitest UI

### Utilities

- `bun run clean` - Clean build artifacts and caches

## Project Architecture

This is a modern Next.js 15+ application using the App Router with the following
key characteristics:

### Tech Stack

- **Runtime**: Bun (preferred over Node.js)
- **Framework**: Next.js 15+ with App Router and Server Components
- **Internationalization**: next-intl for i18n with locale-based routing
- **Styling**: Tailwind CSS with custom design system using CSS variables
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **UI Library**: Shadcn/ui components (stored in `src/components/ui/`)
- **Utilities**: clsx + tailwind-merge via `cn()` utility function

### File Structure

```
src/
├── app/
│   ├── [locale]/         # Locale-based routing (en, es, fr, de)
│   │   ├── layout.tsx    # Localized layout with NextIntlClientProvider
│   │   └── page.tsx      # Home page with translations
│   └── api/              # API routes (not localized)
├── components/            # React components
│   ├── ui/               # Reusable UI components (Shadcn/ui)
│   └── language-switcher.tsx # Language switching component
├── i18n/                 # Internationalization configuration
│   ├── routing.ts        # Locale routing setup
│   ├── request.ts        # Request configuration for translations
│   └── navigation.ts     # Localized navigation utilities
├── lib/                  # Utility libraries and configurations
├── styles/               # Global CSS and Tailwind styles
└── types/                # TypeScript type definitions
messages/                 # Translation files (en.json, cs.json)
```

### Path Aliases

All imports use `@/` prefix mapping to `./src/`:

- `@/components/*` → `./src/components/*`
- `@/lib/*` → `./src/lib/*`
- `@/hooks/*` → `./src/hooks/*`
- `@/types/*` → `./src/types/*`
- `@/styles/*` → `./src/styles/*`
- `@/utils/*` → `./src/utils/*`
- `@/config/*` → `./src/config/*`
- `@/stores/*` → `./src/stores/*`
- `@/app/*` → `./src/app/*`
- `@/i18n/*` → `./src/i18n/*`
- `@/messages/*` → `./messages/*`

### Code Conventions

- **TypeScript**: Strict type checking with exhaustive rules (no implicit any,
  unused variables, etc.)
- **Component Style**: Functional components with TypeScript interfaces for
  props
- **Styling**: Use `cn()` utility for conditional classes, Tailwind CSS
  variables for theming
- **Imports**: Prefer type-only imports (`import type`) for TypeScript types
- **File Naming**: kebab-case for files, PascalCase for React components

### ESLint Configuration

The project uses a comprehensive ESLint setup with:

- TypeScript-specific rules (unused vars, consistent imports)
- React best practices (hooks rules, JSX optimizations)
- Accessibility checks (jsx-a11y)
- Tailwind CSS class ordering and validation
- Next.js specific optimizations

### Development Workflow

1. Always run `bun run type-check` after making TypeScript changes
2. Use `bun run lint:fix` to auto-fix common issues
3. Components should follow existing patterns in `src/components/ui/`
4. API routes go in `src/app/api/`
5. Pages use the App Router convention in `src/app/`

### Performance Considerations

- Built for Vercel deployment with optimizations
- Uses Next.js Image component for image optimization
- Server Components by default (use "use client" sparingly)
- Turbopack for fast development builds

## Internationalization (i18n)

### Supported Locales

- **English (en)** - Default locale
- **Czech (cs)**

### URL Structure

- `/en/` - English pages (default)
- `/cs/` - Czech pages

### Using Translations

```typescript
import { useTranslations } from "next-intl";

export default function MyComponent() {
  const t = useTranslations("HomePage");
  return <h1>{t("title")}</h1>;
}
```

### Navigation with Locales

```typescript
import { Link, useRouter } from "@/i18n/navigation";

// Automatically handles current locale
<Link href="/about">About</Link>

// Programmatic navigation
const router = useRouter();
router.push("/contact", { locale: "cs" });
```

### Translation Files

- Located in `messages/` directory
- Format: `{locale}.json` (e.g., `en.json`, `cs.json`)
- Nested structure supported (e.g., `HomePage.title`)

## Important Notes

- This is a boilerplate template optimized for modern web application
  development
- Uses Bun runtime for better performance over Node.js
- Includes comprehensive tooling for production-ready applications
- Follows React 19 and Next.js 15+ best practices
- Configured with next-intl for multi-language support out of the box
