# Project Structure & Organization

## Root Level Structure

```
├── src/                    # Main application source code
├── prisma/                 # Database schema and migrations
├── messages/               # Internationalization files
├── public/                 # Static assets
├── scripts/                # Build and deployment scripts
├── docs/                   # Project documentation
└── .kiro/                  # Kiro AI assistant configuration
```

## Source Code Organization (`src/`)

### Application Structure (`src/app/`)

- **App Router** architecture with file-based routing
- **`[locale]/`** - Internationalized routes (en/cs)
- **`api/`** - API routes for backend functionality
  - `auth/` - Authentication endpoints (Kinde integration)
  - `cron/` - Scheduled job endpoints
  - `health/` - Health check endpoints

### Component Architecture (`src/components/`)

- **`auth/`** - Authentication-related components
- **`layout/`** - Layout and navigation components
- **`ui/`** - Reusable UI components (Shadcn/ui based)
- **Barrel exports** - Each directory has `index.ts` for clean imports

### Library Code (`src/lib/`)

- **`auth.ts`** - Authentication utilities and Kinde helpers
- **`prisma.ts`** - Database client configuration
- **`utils.ts`** - General utility functions
- **`email.ts`** - Email service integration (Resend)
- **`logger.ts`** - Logging utilities
- **Service-specific modules** for external integrations

### Internationalization (`src/i18n/`)

- **`routing.ts`** - Locale routing configuration
- **`navigation.ts`** - Internationalized navigation helpers
- **`request.ts`** - Server-side locale handling

### Type Definitions (`src/types/`)

- **Domain-specific types** organized by feature
- **API response types** for external services
- **Shared interfaces** used across components

## Database Structure (`prisma/`)

- **`schema.prisma`** - Complete database schema with comprehensive models
- **`migrations/`** - Database migration files
- **`seed.ts`** - Database seeding script

## Key Architectural Patterns

### Path Aliases

```typescript
"@/*": ["./src/*"]
"@/components/*": ["./src/components/*"]
"@/lib/*": ["./src/lib/*"]
"@/hooks/*": ["./src/hooks/*"]
"@/types/*": ["./src/types/*"]
"@/messages/*": ["./messages/*"]
```

### Component Organization

- **Atomic design principles** - UI components are composable
- **Feature-based grouping** - Related components grouped together
- **Barrel exports** - Clean import statements using index files
- **Co-located tests** - Test files alongside components in `__tests__/` folders

### API Route Structure

- **RESTful conventions** where applicable
- **Nested routes** for related functionality
- **Middleware integration** for auth and internationalization
- **Error handling** with consistent response formats

### Database Patterns

- **Comprehensive audit logging** for all user actions
- **Soft deletes** where data retention is important
- **Optimized indexes** for query performance
- **JSON fields** for flexible metadata storage
- **Enum types** for controlled vocabularies

### File Naming Conventions

- **kebab-case** for files and directories
- **PascalCase** for React components
- **camelCase** for functions and variables
- **UPPER_CASE** for constants and environment variables

### Import Organization

1. External libraries (React, Next.js, etc.)
2. Internal utilities and types (@/lib, @/types)
3. Components (@/components)
4. Relative imports (./local-file)

### Testing Structure

- **Co-located tests** in `__tests__/` directories
- **Test utilities** in `src/test/`
- **Setup files** for test configuration
- **Coverage configuration** excluding non-testable files
