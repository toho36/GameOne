---
alwaysApply: true
---

# Data Fetching Architecture (Ky + React Query)

## Overview

- Centralized HTTP client in `src/lib/api/client.ts` based on Ky
- Automatic unwrapping of `{ success, data }` API responses
- Typed helpers: `getJson`, `postJson`, `putJson`, `patchJson`, `deleteJson`
- React Query provider wired in App layout for caching, retries, and
  deduplication

## Golden Rules

1. Do not use raw `fetch()` in components/hooks. Use the Ky helpers.
2. API responses may be raw or wrapped; the client auto‑unwraps. Consume as the
   actual payload.
3. Prefer React Query for server state (lists, detail, mutations). Local UI
   state remains with React state.
4. Defensive programming at the usage site: null checks and sane defaults to
   avoid runtime crashes.

## Usage Examples

### GET

```typescript
import { getJson } from "@/lib/api/client";

const data = await getJson<{ events: Event[]; pagination: Pagination }>(
  `/api/events?${params}`
);
const events = Array.isArray(data?.events) ? data.events : [];
```

### POST (JSON)

```typescript
import { postJson } from "@/lib/api/client";

const created = await postJson<Event>("/api/events", payload);
```

### React Query (recommended)

```typescript
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { getJson, postJson } from "@/lib/api/client";
import { eventsKeys } from "@/lib/api/query-keys";

export function useEvents(params: { page: number; limit: number }) {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  }).toString();
  return useQuery({
    queryKey: eventsKeys.list(params),
    queryFn: () =>
      getJson<{ events: any[]; pagination: any }>(`/api/events?${search}`),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => postJson("/api/events", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventsKeys.lists() }),
  });
}
```

## Error Handling

- Ky throws on non‑2xx with an `HTTPError` containing `response.status`
- Pattern:

```typescript
try {
  const data = await getJson<any>("/api/resource");
} catch (err: any) {
  const status = err?.response?.status ?? err?.status;
  if (status === 401) {
    // handle unauthenticated
  } else if (status === 403) {
    // handle forbidden
  } else {
    // show generic error
  }
}
```

## Migration Guide (from raw fetch)

Before:

```typescript
const res = await fetch("/api/users");
if (!res.ok) throw new Error("Failed");
const data = await res.json();
```

After:

```typescript
const data = await getJson<UsersResponse>("/api/users");
```

## Defensive Defaults

Use safe defaults to avoid runtime errors if a field is missing:

```typescript
const total = data?.pagination?.totalCount ?? 0;
const items = Array.isArray(data?.items) ? data.items : [];
```

## Provider Setup

- React Query provider is available in `src/app/[locale]/layout.tsx` via
  `ReactQueryProvider`.

## Query Key Utilities

- Use factories in `src/lib/api/query-keys.ts` for consistent, hierarchical
  keys.
- Examples:

```typescript
import {
  eventsKeys,
  usersKeys,
  bankAccountsKeys,
  rolesKeys,
} from "@/lib/api/query-keys";

// Lists
eventsKeys.list({ page, limit, filters });
usersKeys.list({ page, limit, filters });

// Details
eventsKeys.detail(id);
usersKeys.detail(id);
```

## Mutation Hook Pattern

- Place feature mutations in `hooks/*-mutations.ts` files
- Always invalidate affected list/detail keys on success
- Normalize errors with `normalizeApiError()` and let components render friendly
  messages

```typescript
export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJson(`/api/events/${id}`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: eventsKeys.lists() });
      if (id) qc.invalidateQueries({ queryKey: eventsKeys.detail(id) });
    },
  });
}
```

## DevTools

- React Query DevTools are installed as a dev dependency and only render in
  development.
- Provider: `src/components/providers/react-query-provider.tsx`
- Snippet:

```tsx
{
  process.env.NODE_ENV === "development" ? (
    <ReactQueryDevtools initialIsOpen={false} />
  ) : null;
}
```

- Wrap any client subtree with this provider when building isolated sandboxes,
  otherwise the app layout includes it.
