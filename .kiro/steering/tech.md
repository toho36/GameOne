# Technology Stack & Build System

## Runtime & Package Manager

- **Bun** (>= 1.0.0) - Primary runtime and package manager for development
- **Node.js** (>= 18.0.0) - Compatibility runtime for deployment
- **Package Manager**: `bun` (specified in package.json)

## Frontend Stack

- **Next.js 15+** - React framework with App Router architecture
- **React 19** - Latest React with concurrent features
- **TypeScript** - Strict type safety with enhanced configuration
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Shadcn/ui** - Component library built on Radix UI primitives

## Backend & Database

- **PostgreSQL** - Primary database with Prisma ORM
- **Prisma** - Type-safe database client with migrations
- **Next.js API Routes** - Serverless API endpoints
- **Kinde Auth** - Authentication and user management service
- **Resend** - Email delivery service

## Development Tools

- **ESLint** - Code linting with Next.js and TypeScript rules
- **Prettier** - Code formatting with Tailwind plugin
- **Vitest** - Testing framework with jsdom environment
- **TypeScript Strict Mode** - Maximum type safety enabled

## Key Dependencies

- `@kinde-oss/kinde-auth-nextjs` - Authentication
- `@prisma/client` - Database ORM
- `next-intl` - Internationalization
- `@tanstack/react-query` - Data fetching and caching
- `react-hook-form` + `@hookform/resolvers` - Form management
- `zod` - Schema validation
- `resend` - Email service

## Common Commands

### Development

```bash
bun run dev          # Start development server with Turbo
bun run build        # Build for production
bun run start        # Start production server
```

### Code Quality

```bash
bun run lint         # Run ESLint
bun run lint:fix     # Auto-fix ESLint errors
bun run format       # Format with Prettier
bun run type-check   # TypeScript type checking
bun run type-safety  # Comprehensive type safety check
```

### Database

```bash
bun run db:generate  # Generate Prisma client
bun run db:push      # Push schema changes (development)
bun run db:migrate   # Run migrations (production)
bun run db:seed      # Seed database with test data
bun run db:studio    # Open Prisma Studio
bun run db:setup     # Full database setup (push + seed)
```

### Testing

```bash
bun run test         # Run tests with Vitest
bun run test:watch   # Run tests in watch mode
bun run test:coverage # Run tests with coverage report
bun run test:ui      # Open Vitest UI
```

### Pre-deployment

```bash
bun run pre-deploy   # Run all pre-deployment checks
bun run check-all    # Alias for pre-push checks
bun run pre-push     # Run pre-push validation script
```

## Build Configuration

- **Turbopack** enabled for faster development builds
- **Strict TypeScript** configuration with enhanced type safety
- **ESM modules** throughout the project
- **Path aliases** configured for clean imports (@/components, @/lib, etc.)
- **Security headers** configured in Next.js config
