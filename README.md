# 🎮 GameOne - Event Management System

A modern, production-ready event management platform built with Next.js, Kinde
Auth, and PostgreSQL. This comprehensive system handles event registration,
payments, user management, and internationalization with enterprise-grade
security and performance.

## 🚀 Features

### 🎯 Core Functionality

- **Event Management** - Create, manage, and publish events
- **User Registration** - Seamless event registration with approval workflows
- **Payment Processing** - QR codes, bank transfers, and payment tracking
- **Waiting Lists** - Manage event capacity and automatic promotions
- **User Management** - Role-based access control and permissions
- **Internationalization** - Czech and English language support

### 🔐 Authentication & Security

- **Kinde Auth** - Modern authentication with SSO and user management
- **Role-Based Access Control** - Granular permissions system
- **Secure Payments** - PCI DSS compliant payment processing
- **Rate Limiting** - API protection and abuse prevention
- **Data Encryption** - Field-level encryption for sensitive data

### 📧 Communication

- **Resend Email** - Reliable email delivery with templates
- **Notification System** - Automated event reminders and updates
- **Email Templates** - Professional, customizable email designs
- **Rate Limiting** - Controlled email sending to prevent spam

### 🗄️ Data Management

- **PostgreSQL Database** - Robust, scalable data storage
- **Prisma ORM** - Type-safe database operations
- **Data Migrations** - Safe schema evolution
- **Audit Logging** - Complete activity tracking
- **Backup & Recovery** - Automated data protection

## 🛠️ Tech Stack

### Frontend

- **Next.js 15+** - React framework with App Router
- **React 18** - Latest React features and hooks
- **TypeScript** - Strict type safety and development experience
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful, accessible component library

### Backend & Database

- **PostgreSQL** - Production-ready relational database
- **Prisma** - Next-generation ORM with type safety
- **Next.js API Routes** - Serverless API endpoints
- **Bun Runtime** - Fast JavaScript runtime for development

### Authentication & Services

- **Kinde Auth** - Complete authentication solution
- **Resend** - Modern email API service
- **JWT Tokens** - Secure session management
- **OAuth 2.0** - Industry-standard authentication

### Development & Quality

- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **TypeScript Strict Mode** - Maximum type safety
- **GitHub Actions** - Automated CI/CD pipeline

## 📦 Getting Started

### Prerequisites

- **Bun** (>= 1.0.0) - [Download](https://bun.sh)
- **Node.js** (>= 18.0.0) - for compatibility
- **PostgreSQL** database - local or hosted
- **Git** - for version control

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <your-repo-url> gameone
   cd gameone
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**

   ```bash
   bun run db:generate
   bun run db:push
   bun run db:seed
   ```

5. **Start development server**
   ```bash
   bun run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 🔐 Required Services Setup

### 1. Database (PostgreSQL)

**Recommended**: [Neon](https://neon.tech) - Serverless PostgreSQL

- Create a new PostgreSQL database
- Get your connection URL
- Add to `.env.local`:
  ```env
  DATABASE_URL="postgresql://user:password@host:port/dbname"
  DIRECT_URL="postgresql://user:password@host:port/dbname"
  ```

### 2. Authentication (Kinde)

**Service**: [Kinde Auth](https://kinde.com)

- Sign up and create a new application
- Configure redirect URLs for development and production
- Add credentials to `.env.local`:
  ```env
  KINDE_CLIENT_ID=your_kinde_client_id
  KINDE_CLIENT_SECRET=your_kinde_client_secret
  KINDE_ISSUER_URL=https://your-domain.kinde.com
  KINDE_SITE_URL=http://localhost:3000
  ```

### 3. Email Service (Resend)

**Service**: [Resend](https://resend.com)

- Create an account and API key
- Verify your domain (recommended)
- Add to `.env.local`:
  ```env
  RESEND_API_KEY=re_your_resend_api_key
  DEFAULT_FROM_EMAIL=noreply@yourdomain.com
  ```

## 🗄️ Database Schema

The system includes comprehensive data models for:

- **Users** - Authentication, profiles, and roles
- **Events** - Event details, categories, and settings
- **Registrations** - User event registrations with status tracking
- **Payments** - Payment processing and tracking
- **Waiting Lists** - Capacity management and promotions
- **Audit Logs** - Complete activity tracking
- **Notifications** - User communication preferences

## 🚀 Available Commands

### Development

```bash
bun run dev          # Start development server
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

### Testing

```bash
bun run test         # Run tests
bun run test:coverage # Run tests with coverage
```

### Database

```bash
bun run db:generate  # Generate Prisma client
bun run db:push      # Push schema changes
bun run db:migrate   # Run migrations
bun run db:seed      # Seed database
bun run db:studio    # Open Prisma Studio
```

### Security

```bash
bun run security:check    # Security audit
bun run security:audit    # Dependency vulnerability check
bun run security:audit-fix # Auto-fix vulnerabilities
```

## 🌐 Internationalization

The application supports multiple languages:

- **English** - Default language
- **Czech** - Full localization support
- **Extensible** - Easy to add more languages

Translation files are located in the `messages/` directory.

## 🔒 Security Features

- **Authentication** - Secure OAuth 2.0 with Kinde
- **Authorization** - Role-based access control
- **Data Protection** - Field-level encryption
- **Input Validation** - Zod schemas for all inputs
- **Rate Limiting** - API abuse prevention
- **Security Headers** - CSP, XSS protection
- **Audit Logging** - Complete activity tracking

## 📱 Responsive Design

- **Mobile-First** - Optimized for mobile devices
- **Progressive Web App** - Installable and offline-capable
- **Accessibility** - WCAG 2.1 AA compliant
- **Performance** - Optimized loading and rendering

## 🚀 Deployment

### Vercel (Recommended)

The application is optimized for Vercel deployment:

1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

Can be deployed to any platform supporting Node.js:

- Railway
- DigitalOcean App Platform
- AWS
- Google Cloud Run

## 🔄 CI/CD Pipeline

### GitHub Actions

Automated quality checks on every push:

- TypeScript type checking
- ESLint code quality
- Security vulnerability scanning
- Automatic deployment to Vercel

### CodeRabbit Integration

AI-powered code reviews for pull requests.

## 🛡️ Production Checklist

- [ ] Set up production database
- [ ] Configure production environment variables
- [ ] Set up monitoring and error tracking
- [ ] Configure backup and recovery
- [ ] Set up SSL certificates
- [ ] Configure CDN and caching
- [ ] Set up logging and analytics

## 🆘 Troubleshooting

### Common Issues

- **Database Connection**: Verify DATABASE_URL format and credentials
- **Authentication**: Check Kinde configuration and redirect URLs
- **Email**: Verify Resend API key and domain verification
- **Build Errors**: Run `bun run type-check` for TypeScript issues

### Getting Help

1. Check this README and [SETUP.md](./SETUP.md)
2. Review error logs and console output
3. Check GitHub Issues for known problems
4. Create a new issue with detailed error information

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Comprehensive setup guide
- **[API Documentation](./docs/api.md)** - API endpoints and usage
- **[Database Schema](./prisma/schema.prisma)** - Data models and relationships
- **[Component Library](./src/components/)** - UI components and usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the coding standards
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE)
file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) team for the amazing framework
- [Vercel](https://vercel.com/) for the deployment platform
- [Kinde](https://kinde.com/) for authentication services
- [Resend](https://resend.com/) for email delivery
- [Prisma](https://prisma.io/) for the excellent ORM
- [Shadcn](https://ui.shadcn.com/) for the beautiful components
- Open source community for the amazing tools

---

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/toho36/GameOne?utm_source=oss&utm_medium=github&utm_campaign=toho36%2FGameOne&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
Built with ❤️ using modern web technologies. Happy coding!