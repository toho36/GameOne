---
description: Database setup and migration workflow
---

# Database Migration

Complete workflow for database schema changes, migrations, and seeding.

## Steps

1. **Make schema changes** in `prisma/schema.prisma`
   - Follow Prisma best practices
   - Add proper relations and constraints
   - Document complex fields with comments

// turbo 2. **Validate schema**

```bash
bun run db:verify
```

// turbo 3. **Generate Prisma client**

```bash
bun run db:generate
```

4. **Create migration** (development)

```bash
bun run db:migrate
# Enter migration name when prompted
```

5. **Review migration SQL** in `prisma/migrations/`
   - Check for data loss warnings
   - Verify indexes are created
   - Ensure foreign keys are correct

// turbo 6. **Seed database**

```bash
bun run db:seed
```

// turbo 7. **Verify setup**

```bash
bun run db:studio
# Check data in Prisma Studio
```

## Deployment Workflow

For production deployments:

```bash
# Single command for deployment
bun run db:deploy
# This runs: db:generate + db:migrate:deploy + db:seed
```

## Troubleshooting

- **Migration conflicts**: Reset with `bun run db:migrate:reset` (DESTRUCTIVE)
- **Schema out of sync**: Run `bun run db:push` for dev environments
- **Check migration status**: Run `bun run db:migrate:status`
