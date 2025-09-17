---
type: "always_apply"
---

# Security & Compliance

## Input validation

- Validate all API inputs with zod; reject invalid requests with appropriate
  status
- Sanitize or encode user-generated content in UI when necessary

## Authentication & Authorization

- Use server-only checks for sensitive operations
- Integrate with auth utilities from `src/lib/auth.ts` and feature-specific
  guards
- Do not rely on client state for authorization decisions

## Environment variables

- Access using bracket notation only: `process.env["VAR"]` (never dot access)
- Do not expose secrets in client bundles; only use public envs client-side if
  absolutely necessary

## API routes

- Use try/catch; return explicit status codes and safe error messages
- Rate-limit sensitive operations where applicable (see
  `src/lib/api/email/rate-limiter.ts`)
- Avoid leaking stack traces or internal details

## Database & Prisma

- Use Prisma client from `src/lib/prisma.ts`
- Never interpolate raw SQL with user input; prefer Prisma API
- Handle soft-deletes and audit trails consistently, where implemented

## Dependencies

- Keep dependencies updated; audit regularly
- Commands: `bun run security:check`, `bun run security:audit`

## Data protection

- Avoid logging PII in production; use structured logging with redaction in
  `src/lib/logger.ts`
- Encrypt or hash sensitive data where appropriate

## Frontend security

- Escape/encode user content; use `dangerouslySetInnerHTML` only with sanitized
  input
- Prefer Next.js `<Image>` for remote image handling
- Avoid exposing internal identifiers unnecessarily

## Checklist

- [ ] zod validation on API inputs
- [ ] AuthZ enforced on protected routes
- [ ] No secret exposure in client code
- [ ] Safe error messages (no internals)
- [ ] Prisma used safely; no raw string interpolation
- [ ] Rate limiting applied where needed
