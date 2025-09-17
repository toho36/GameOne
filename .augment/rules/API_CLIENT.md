---
type: "always_apply"
---

# Data Fetching & API Client

Standardize on ky + React Query. Do not use raw `fetch`.

## Client helpers (authoritative)

- Location: `src/lib/api/client.ts`
- Use: `getJson<T>`, `postJson<T>`, `putJson<T>`, `patchJson<T>`,
  `deleteJson<T>`
- Behavior: unwraps `{ success, data }` shape automatically

## Query keys

- Location: `src/lib/api/query-keys.ts`
- Use stable keys: e.g., `['events', params]` to ensure cache correctness

## React Query (v5) usage

- Prefer `useQuery`/`useMutation` for server state
- Co-locate thin feature hooks under `src/components/features/<feature>/hooks/`
  when UI-specific
- Use global hooks in `src/hooks` when reusable across features

## Patterns

Fetching list with params:

```ts
import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/api/client'
import { eventsKeys } from '@/lib/api/query-keys'

export function usePublicEvents(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: eventsKeys.list(params),
    queryFn: () => getJson<{ events: any[]; pagination: any }>(`/api/events?page=${params.page}&limit=${params.limit}`),
  })
}
```

Posting data with mutation:

```ts
import { useMutation } from '@tanstack/react-query'
import { postJson } from '@/lib/api/client'

export function useRegister(eventId: string) {
  return useMutation({
    mutationFn: (payload: { numberOfGuests: number }) => postJson(`/api/events/${eventId}/register`, payload),
  })
}
```

## API routes (App Router)

- Validate payloads with zod
- Return `NextResponse.json({ success: true, data })` or proper error with
  status
- Use try/catch and never leak sensitive details
- Access env with bracket notation only: `process.env['VAR']`

Example handler sketch:

```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({ page: z.coerce.number().min(1).default(1) })

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const page = schema.parse({ page: url.searchParams.get('page') }).page
    const data = await listEvents({ page })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
```

## Do / Don't

- DO centralize network calls through ky helpers
- DO use React Query for caching/invalidations
- DO derive query keys from `query-keys.ts`
- DON'T call `fetch` directly in components/hooks
- DON'T access `process.env.VAR` (use bracket notation)
