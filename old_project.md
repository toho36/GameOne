# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Development Commands

### Essential Commands

- `npm run dev` - Start development server (Next.js on port 3000)
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Database Commands

- `npm run db:generate` - Generate Prisma client and run migrations in dev
- `npm run db:migrate` - Deploy migrations to production database
- `npm run db:push` - Push schema changes to database (development)
- `npm run db:studio` - Open Prisma Studio for database inspection

### Database Maintenance Scripts

- `npm run init-reg-history` - Initialize registration history table
- `npm run fix-reg-history` - Fix missing columns in registration history
- `npm run fix-action-type` - Fix action type enum values
- `npm run migrate-enum-values` - Migrate enum values in database

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Kinde Auth (@kinde-oss/kinde-auth-nextjs)
- **Styling**: Tailwind CSS
- **State Management**: Zustand stores
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Custom components with shadcn/ui patterns
- **Email**: Resend with React Email templates
- **Deployment**: Vercel

### Project Structure

The codebase follows a feature-based architecture currently in transition:

**Current Structure (in transition):**

```
src/
├── features/           # Feature-based modules
│   ├── events/        # Event management components/hooks
│   ├── registration/  # Registration flow components/hooks
│   └── admin/         # Admin panel components
├── shared/            # Shared components and utilities
│   ├── components/    # Reusable UI components
│   └── hooks/         # Shared custom hooks
├── app/              # Next.js App Router pages
├── server/           # Server-side services
├── stores/           # Zustand state stores
└── types/            # TypeScript type definitions
```

**Import Migration**: The project is transitioning from `~/components/*` imports
to feature-based imports like `~/features/*/components/*` and
`~/shared/components/*`. Some imports may still use the old pattern.

### Key Features

- **Event Management**: Create, edit, duplicate events with capacity limits
- **Registration System**: User registration with waiting list functionality
- **Payment Integration**: QR code generation for bank transfers with multiple
  bank account support
- **Admin Panel**: User role management (USER, REGULAR, MODERATOR, ADMIN)
- **Registration History**: Audit trail for all registration actions
- **Email Notifications**: Automated confirmation and waiting list promotion
  emails

### Database Schema

- **Users**: Kinde-integrated authentication with role system
- **Events**: Event management with capacity, pricing, bank account assignment
- **Registration**: Event registrations with unique constraints
- **WaitingList**: Overflow handling when events reach capacity
- **Payment**: QR code payment tracking with variable symbols
- **RegistrationHistory**: Audit trail for all registration actions

### Authentication & Authorization

- Uses Kinde for authentication with role-based access control
- User roles: USER, REGULAR, MODERATOR, ADMIN
- Admin routes protected with role checks
- Environment-aware auth configuration (localhost vs production)

### State Management

- Zustand stores for client-side state:
  - `eventStore.ts` - Event data management
  - `registrationStore.ts` - Registration flow state
  - `userStore.ts` - User profile data
  - `eventRegistrationStore.ts` - Event-specific registration state

### API Structure

- RESTful API routes in `src/app/api/`
- Organized by feature area (events, registrations, admin, auth)
- Error handling with custom ApiError class
- Consistent response patterns using ErrorResponse utility

### Development Notes

- TypeScript and ESLint errors are ignored during builds (configured in
  next.config.js)
- Database seeding available via `prisma/seed.ts`
- QR code generation for payments using Slovak bank transfer format
- Email templates use React Email components
