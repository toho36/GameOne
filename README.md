# BunPlate

A comprehensive modern web application boilerplate built with Bun runtime and optimized for Vercel deployment. This boilerplate includes everything you need to build scalable, production-ready web applications with the latest technologies and best practices.

## 🚀 Features

### Core Technologies
- **[Bun](https://bun.sh/)** - Fast JavaScript runtime for development and build processes
- **[Next.js 14+](https://nextjs.org/)** - React framework with App Router and Server Components
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript with strict configuration
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework with custom design system
- **[Prisma](https://prisma.io/)** - Next-generation ORM for PostgreSQL
- **[NextAuth.js](https://next-auth.js.org/)** - Complete authentication solution

### Development Experience
- **ESLint & Prettier** - Code linting and formatting with modern rules
- **Vitest** - Fast unit testing with React Testing Library
- **Playwright** - Reliable end-to-end testing
- **TypeScript Strict Mode** - Maximum type safety
- **Path Mapping** - Clean imports with `@/` prefix
- **Hot Module Replacement** - Fast development with Turbopack

### Production Ready
- **Vercel Optimization** - Configured for Vercel's edge network
- **Docker Support** - Multi-stage builds for development and production
- **CI/CD Pipeline** - GitHub Actions for testing and deployment
- **SEO Optimization** - Metadata API, sitemap, and structured data
- **Performance** - Image optimization, ISR, and caching strategies
- **Security** - CSP headers, CSRF protection, and authentication
- **Accessibility** - ARIA compliance and keyboard navigation

### UI/UX
- **Shadcn/ui** - Beautiful, accessible component library
- **Dark Mode** - System-aware theme switching
- **Responsive Design** - Mobile-first approach
- **Loading States** - Skeleton screens and suspense boundaries
- **Error Boundaries** - Graceful error handling
- **Toast Notifications** - User feedback system

## 📦 Getting Started

### Prerequisites

- **Bun** 1.0+ or Node.js 18+
- **PostgreSQL** database
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/bunplate.git
   cd bunplate
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update the following variables in `.env.local`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/bunplate"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   bun run db:push
   bun run db:seed
   ```

5. **Start the development server**
   ```bash
   bun run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker Development

Run the entire stack with Docker Compose:

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

This includes:
- Next.js application
- PostgreSQL database
- Redis for caching
- Adminer for database management

## 🧪 Testing

```bash
# Run unit tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch

# Run E2E tests
bun run e2e

# Run E2E tests with UI
bun run e2e:ui
```

## 🏗️ Project Structure

```
src/
├── app/                   # Next.js App Router
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── ui/               # Reusable UI components
│   └── auth/             # Authentication components
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Database client
│   ├── env.ts            # Environment variables
│   └── utils.ts          # Utility functions
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── test/                 # Test utilities and setup
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | No |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | No |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |

### Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run lint:fix` | Fix ESLint errors |
| `bun run format` | Format code with Prettier |
| `bun run type-check` | Run TypeScript check |
| `bun run test` | Run unit tests |
| `bun run e2e` | Run E2E tests |
| `bun run db:push` | Push database schema |
| `bun run db:seed` | Seed database |
| `bun run db:studio` | Open Prisma Studio |

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in the Vercel dashboard
3. **Deploy automatically** on push to main branch

The project includes:
- `vercel.json` configuration
- GitHub Actions for CI/CD
- Automatic preview deployments

### Docker

```bash
# Build production image
docker build -t bunplate .

# Run container
docker run -p 3000:3000 bunplate
```

## 🔒 Security

The boilerplate includes several security features:

- **Authentication** - Secure OAuth and email authentication
- **CSRF Protection** - Built into NextAuth.js
- **Security Headers** - CSP, X-Frame-Options, etc.
- **Input Validation** - Zod schemas for API routes
- **Rate Limiting** - API route protection
- **Environment Validation** - Type-safe environment variables

## 🎨 Customization

### Theme

Customize the design system in `tailwind.config.ts` and `src/styles/globals.css`.

### Components

Add new components to `src/components/ui/` following the established patterns.

### Database

Modify `prisma/schema.prisma` and run:
```bash
bun run db:push
```

## 📈 Performance

The boilerplate is optimized for performance:

- **Server Components** - Reduce client-side JavaScript
- **Image Optimization** - Next.js Image component
- **Code Splitting** - Automatic route-based splitting
- **Caching** - ISR and edge caching
- **Bundle Analysis** - Built-in bundle analyzer

## 🛠️ Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) team for the amazing framework
- [Vercel](https://vercel.com/) for the deployment platform
- [Bun](https://bun.sh/) team for the fast runtime
- [Shadcn](https://ui.shadcn.com/) for the beautiful components
- Open source community for the amazing tools

---

Built with ❤️ using modern web technologies. Happy coding! 🚀