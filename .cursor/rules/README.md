# GameOne Architecture Rules

This directory contains comprehensive architectural guidelines and patterns for the GameOne event management system. These rules ensure consistent code organization, maintainability, and scalability across the entire codebase.

## 📋 Overview

The GameOne system is a modern, enterprise-grade event management platform built with Next.js 15+, TypeScript, Prisma, and PostgreSQL. These architectural rules provide detailed guidance for:

- **API Structure** - RESTful endpoints with consistent patterns
- **Component Organization** - React component architecture and patterns  
- **Database Patterns** - Prisma ORM usage and schema design
- **Hook Organization** - Custom React hooks structure
- **Library Structure** - Utility functions and shared libraries
- **Type Definitions** - Comprehensive TypeScript type system

## 📁 Rule Files

### [api-structure.md](./api-structure.md)
**API Structure and Routing Rules**
- RESTful API design patterns
- Route organization and naming conventions
- Request/response formatting standards
- Authentication and authorization patterns
- Error handling and status codes
- Performance optimization strategies

### [component-organization.md](./component-organization.md)
**Component Organization and Patterns**
- Component directory structure
- TypeScript patterns for React components
- Styling conventions with Tailwind CSS
- State management patterns
- Performance optimization techniques
- Testing strategies for components

### [database-patterns.md](./database-patterns.md)
**Database Schema and ORM Patterns**
- Prisma schema design principles
- Repository pattern implementation
- Query optimization strategies
- Transaction management
- Data migration patterns
- Database testing approaches

### [hooks-organization.md](./hooks-organization.md)
**Hooks Organization and Conventions**
- Custom hook directory structure
- Hook naming conventions
- State management with hooks
- Data fetching patterns
- Performance optimization hooks
- Hook testing methodologies

### [libs-and-utilities.md](./libs-and-utilities.md)
**Libraries and Utilities Structure**
- Utility library organization
- Core system utilities (auth, config, logging)
- API utilities and helpers
- Data processing and transformation
- Validation and security utilities
- Testing utilities and mocks

### [type-definitions.md](./type-definitions.md)
**Type Definitions and Interfaces**
- TypeScript type organization
- API request/response types
- Database model types
- UI component prop types
- Utility types and type guards
- Global type declarations

## 🎯 Key Principles

### 1. **Consistency**
All code should follow the established patterns and conventions outlined in these rules. Consistency reduces cognitive load and improves maintainability.

### 2. **Type Safety**
Comprehensive TypeScript usage with strict type checking. Every function, component, and API should be properly typed.

### 3. **Performance**
Code should be optimized for performance with proper caching, lazy loading, and efficient database queries.

### 4. **Scalability**
Architecture should support growth in both features and team size through modular design and clear separation of concerns.

### 5. **Testability**
All code should be easily testable with clear interfaces and minimal dependencies.

### 6. **Security**
Security-first approach with proper authentication, authorization, input validation, and data protection.

## 🚀 Getting Started

1. **Read the relevant rule files** for the area you're working on
2. **Follow the established patterns** and naming conventions
3. **Use the provided examples** as templates for new code
4. **Validate your implementation** against the documented standards
5. **Update rules** when introducing new patterns (with team approval)

## 🔧 Technology Stack

- **Runtime**: Bun (preferred over Node.js)
- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript with strict mode
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS with Shadcn/ui
- **Authentication**: Kinde Auth
- **Internationalization**: next-intl
- **Testing**: Vitest for unit tests
- **Deployment**: Vercel

## 📊 Project Structure Overview

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   └── api/               # API endpoints
├── components/            # React components
│   ├── ui/               # Design system components
│   ├── features/         # Feature-specific components
│   └── shared/           # Shared utility components
├── hooks/                 # Custom React hooks
│   ├── core/             # System hooks
│   ├── data/             # Data fetching hooks
│   └── features/         # Feature-specific hooks
├── lib/                   # Utility libraries
│   ├── core/             # Core utilities
│   ├── api/              # API utilities
│   └── validation/       # Validation schemas
├── types/                 # TypeScript definitions
│   ├── api/              # API types
│   ├── features/         # Feature types
│   └── ui/               # Component types
└── styles/               # Global styles
```

## 📝 Contributing

When contributing to the codebase:

1. **Follow these architectural rules** strictly
2. **Add new patterns** to the appropriate rule file when needed
3. **Update documentation** for any architectural changes
4. **Ensure type safety** with comprehensive TypeScript usage
5. **Add tests** for new functionality
6. **Review security implications** of any changes

## 🔍 Code Review Checklist

- [ ] Follows established directory structure
- [ ] Uses consistent naming conventions
- [ ] Properly typed with TypeScript
- [ ] Includes appropriate error handling
- [ ] Has necessary tests
- [ ] Follows security best practices
- [ ] Optimized for performance
- [ ] Documentation is updated

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Kinde Auth Documentation](https://kinde.com/docs/)

---

These architectural rules are living documents that should evolve with the project. Regular reviews and updates ensure they remain relevant and useful for the development team.