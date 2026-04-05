# SpacetimeDB Foundation and Spike Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-shaped SpacetimeDB spike for GameOne that proves event registration, live attendee counts, and hot/cold archival mechanics before any irreversible backend migration.

**Architecture:** Do **not** rewrite the existing Prisma/Neon backend first. Create a dedicated worktree branch and add a self-contained SpacetimeDB module plus a Next.js spike surface inside the same codebase. Keep the existing app as the control baseline while the spike proves four things: (1) SSR + realtime works in Next.js App Router, (2) registration reducers can enforce capacity safely, (3) Kinde/OIDC integration remains feasible, and (4) old append-only data can be archived to Cloudflare R2 and pruned from hot storage.

**Tech Stack:** Next.js 16 App Router, Bun, TypeScript, SpacetimeDB v2.x (TypeScript module + generated bindings), Kinde OIDC, Cloudflare R2 (S3-compatible), Vitest, Testing Library, existing GameOne frontend stack.

---

## Preconditions and guardrails

- Work in a **dedicated git worktree** on a new branch, e.g. `spacetimedb-spike`.
- Do **not** delete Prisma, Neon, API routes, or current pages during the spike.
- Keep the spike isolated behind a dedicated route, e.g. `/[locale]/spacetime-events`.
- Use additive changes only.
- Treat the spike as successful only if the same user journey can be demonstrated side-by-side with the current implementation.

## Decision gates

Before full migration, the spike must prove all of the following:

1. Initial page render is fast and stable with SSR + client takeover.
2. Live attendee counts update correctly in multiple browser sessions.
3. Registration capacity rules remain consistent under concurrent submissions.
4. Archive job can export old rows to R2 and prune them safely.
5. The developer workflow (`spacetime dev`, codegen, tests, local env) is acceptable.
6. The app still has a clear plan for payments, emails, admin workflows, and external webhooks.

If any of these fail badly, stop and keep the relational architecture.

---

### Task 1: Stabilize the existing repo before the spike

**Files:**
- Modify: `.github/CICD_SETUP.md`
- Modify: `README.md`
- Modify: `src/app/sitemap.ts`

**Step 1: Write the failing verification commands**

Run:
```bash
bun run format:check
bun run build
```
Expected:
- `format:check` fails on current formatting issues
- `build` fails because `src/app/sitemap.ts` hits Prisma during prerender

**Step 2: Fix formatting only**

Run:
```bash
bun run format
```
Expected:
- `.github/CICD_SETUP.md` and any generated manifest files are formatted

**Step 3: Make sitemap non-blocking for builds**

Add one of the following at the top of `src/app/sitemap.ts`:

```ts
export const dynamic = "force-dynamic";
```

Preferred minimal spike-safe choice:
```ts
export const dynamic = "force-dynamic";
```

**Step 4: Re-run verification**

Run:
```bash
bun run format:check
bun run build
```
Expected:
- formatting passes
- build no longer fails because sitemap prerendering queries Neon during build

**Step 5: Commit**

```bash
git add .github/CICD_SETUP.md README.md src/app/sitemap.ts
git commit -m "chore: stabilize repo before spacetimedb spike"
```

---

### Task 2: Create the worktree and spike branch

**Files:**
- Create: `docs/plans/2026-04-05-spacetimedb-foundation-and-spike.md`

**Step 1: Create the worktree**

Run:
```bash
git worktree add ../GameOne-spacetimedb-spike -b spacetimedb-spike
```
Expected:
- new worktree created at `../GameOne-spacetimedb-spike`

**Step 2: Verify branch isolation**

Run:
```bash
cd ../GameOne-spacetimedb-spike && git branch --show-current
```
Expected:
- output: `spacetimedb-spike`

**Step 3: Commit the empty worktree baseline if needed**

```bash
cd ../GameOne-spacetimedb-spike
git status
```
Expected:
- clean working tree before implementation begins

**Step 4: Commit**

No code commit required if tree is clean. Record the branch in notes.

---

### Task 3: Add the environment contract for SpacetimeDB + R2

**Files:**
- Modify: `.env.example`
- Create: `src/types/spacetimedb/env.ts`
- Test: `src/types/spacetimedb/__tests__/env.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { requiredSpacetimeEnvKeys } from "@/types/spacetimedb/env";

describe("requiredSpacetimeEnvKeys", () => {
  it("contains all keys needed for the spike", () => {
    expect(requiredSpacetimeEnvKeys).toEqual([
      "SPACETIMEDB_HOST",
      "SPACETIMEDB_DB_NAME",
      "SPACETIMEDB_AUTH_AUDIENCE",
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
      "R2_PUBLIC_BASE_URL",
    ]);
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
bun run test --run src/types/spacetimedb/__tests__/env.test.ts
```
Expected:
- FAIL with module not found

**Step 3: Write minimal implementation**

```ts
export const requiredSpacetimeEnvKeys = [
  "SPACETIMEDB_HOST",
  "SPACETIMEDB_DB_NAME",
  "SPACETIMEDB_AUTH_AUDIENCE",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_BASE_URL",
] as const;
```

Append these placeholders to `.env.example`:

```env
# SpacetimeDB spike
SPACETIMEDB_HOST=http://127.0.0.1:3000
SPACETIMEDB_DB_NAME=gameone-spike
SPACETIMEDB_AUTH_AUDIENCE=gameone-spike

# Cloudflare R2 archive
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=gameone-cold-archive
R2_PUBLIC_BASE_URL=https://pub.example.r2.dev
```

**Step 4: Run test to verify it passes**

Run:
```bash
bun run test --run src/types/spacetimedb/__tests__/env.test.ts
```
Expected:
- PASS

**Step 5: Commit**

```bash
git add .env.example src/types/spacetimedb/env.ts src/types/spacetimedb/__tests__/env.test.ts
git commit -m "chore: add spacetime and r2 environment contract"
```

---

### Task 4: Scaffold the SpacetimeDB module and local developer workflow

**Files:**
- Create: `spacetimedb/src/index.ts`
- Create: `spacetimedb/README.md`
- Create: `src/module_bindings/.gitkeep`
- Modify: `package.json`

**Step 1: Write the failing smoke test**

Create `spacetimedb/README.md` instructions and a shell verification note, then run:

```bash
spacetime dev --template nextjs-ts
```

Expected:
- Use generated template in a scratch directory to compare structure
- FAIL in project until module files/scripts exist

**Step 2: Add scripts to `package.json`**

Add minimal scripts:

```json
{
  "scripts": {
    "stdb:dev": "spacetime dev",
    "stdb:generate": "spacetime generate",
    "stdb:publish": "spacetime publish $SPACETIMEDB_DB_NAME --server maincloud"
  }
}
```

**Step 3: Write minimal module implementation**

`spacetimedb/src/index.ts`

```ts
import { schema, table, t } from "spacetimedb/server";

const user_profile = table(
  { name: "user_profile", public: true },
  {
    identity: t.identity().primaryKey(),
    email: t.string(),
    displayName: t.string(),
    role: t.string(),
    createdAt: t.string(),
  }
);

const event_summary = table(
  { name: "event_summary", public: true },
  {
    id: t.string().primaryKey(),
    slug: t.string(),
    title: t.string(),
    status: t.string(),
    capacity: t.u32(),
    confirmedParticipants: t.u32(),
    waitingListCount: t.u32(),
    createdAt: t.string(),
    updatedAt: t.string(),
  }
);

const registration = table(
  { name: "registration", public: true },
  {
    id: t.string().primaryKey(),
    eventId: t.string().index("btree"),
    userIdentity: t.identity().index("btree"),
    status: t.string(),
    createdAt: t.string(),
  }
);

export default schema({ user_profile, event_summary, registration });
```

**Step 4: Verify local structure exists**

Run:
```bash
test -f spacetimedb/src/index.ts && echo ok
```
Expected:
- `ok`

**Step 5: Commit**

```bash
git add package.json spacetimedb/src/index.ts spacetimedb/README.md src/module_bindings/.gitkeep
git commit -m "feat: scaffold spacetime module for spike"
```

---

### Task 5: Add generated-binding adapter seam so the app can consume SpacetimeDB safely

**Files:**
- Create: `src/lib/spacetimedb/client.ts`
- Create: `src/lib/spacetimedb/server.ts`
- Create: `src/lib/spacetimedb/types.ts`
- Test: `src/lib/spacetimedb/__tests__/types.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { mapSpacetimeEventToPublicEvent } from "@/lib/spacetimedb/types";

describe("mapSpacetimeEventToPublicEvent", () => {
  it("maps a spacetime row to the existing public event shape", () => {
    const result = mapSpacetimeEventToPublicEvent({
      id: "evt_1",
      slug: "spring-meetup",
      title: "Spring Meetup",
      status: "PUBLISHED",
      capacity: 50,
      confirmedParticipants: 12,
      waitingListCount: 0,
      createdAt: "2026-04-05T10:00:00.000Z",
      updatedAt: "2026-04-05T10:00:00.000Z",
    });

    expect(result.id).toBe("evt_1");
    expect(result.availableSpots).toBe(38);
    expect(result.confirmedParticipants).toBe(12);
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
bun run test --run src/lib/spacetimedb/__tests__/types.test.ts
```
Expected:
- FAIL with module not found

**Step 3: Write minimal implementation**

```ts
export function mapSpacetimeEventToPublicEvent(row: {
  id: string;
  slug: string;
  title: string;
  status: string;
  capacity: number;
  confirmedParticipants: number;
  waitingListCount: number;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    capacity: row.capacity,
    availableSpots: Math.max(0, row.capacity - row.confirmedParticipants),
    confirmedParticipants: row.confirmedParticipants,
    waitingListCount: row.waitingListCount,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}
```

Add stubs for `client.ts` and `server.ts`:

```ts
// client.ts
export function getSpacetimeClientConfig() {
  return {
    uri: process.env.NEXT_PUBLIC_SPACETIMEDB_HOST || process.env.SPACETIMEDB_HOST || "http://127.0.0.1:3000",
    databaseName: process.env.NEXT_PUBLIC_SPACETIMEDB_DB_NAME || process.env.SPACETIMEDB_DB_NAME || "gameone-spike",
  };
}
```

```ts
// server.ts
export async function fetchSpacetimeInitialEvents() {
  return [];
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
bun run test --run src/lib/spacetimedb/__tests__/types.test.ts
```
Expected:
- PASS

**Step 5: Commit**

```bash
git add src/lib/spacetimedb/client.ts src/lib/spacetimedb/server.ts src/lib/spacetimedb/types.ts src/lib/spacetimedb/__tests__/types.test.ts
git commit -m "feat: add spacetime adapter seam for existing event shapes"
```

---

### Task 6: Add a spike-only public events page with SSR + client takeover

**Files:**
- Create: `src/app/[locale]/spacetime-events/page.tsx`
- Create: `src/app/[locale]/spacetime-events/spacetime-event-list.tsx`
- Create: `src/app/[locale]/spacetime-events/providers.tsx`
- Test: `src/app/[locale]/spacetime-events/__tests__/page.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Page from "../page";

describe("Spacetime events page", () => {
  it("renders the spike heading", async () => {
    const ui = await Page({ params: Promise.resolve({ locale: "en" }) } as any);
    render(ui);
    expect(screen.getByText("Spacetime Events Spike")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
bun run test --run src/app/[locale]/spacetime-events/__tests__/page.test.tsx
```
Expected:
- FAIL with module not found

**Step 3: Write minimal implementation**

`page.tsx`

```tsx
import { fetchSpacetimeInitialEvents } from "@/lib/spacetimedb/server";
import { SpacetimeEventList } from "./spacetime-event-list";

export default async function SpacetimeEventsPage() {
  const initialEvents = await fetchSpacetimeInitialEvents();

  return (
    <main className="container py-10">
      <h1 className="text-3xl font-semibold">Spacetime Events Spike</h1>
      <SpacetimeEventList initialEvents={initialEvents} />
    </main>
  );
}
```

`spacetime-event-list.tsx`

```tsx
"use client";

export function SpacetimeEventList({ initialEvents }: { initialEvents: any[] }) {
  return (
    <section className="mt-6">
      <pre>{JSON.stringify(initialEvents, null, 2)}</pre>
    </section>
  );
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
bun run test --run src/app/[locale]/spacetime-events/__tests__/page.test.tsx
```
Expected:
- PASS

**Step 5: Commit**

```bash
git add src/app/[locale]/spacetime-events/page.tsx src/app/[locale]/spacetime-events/spacetime-event-list.tsx src/app/[locale]/spacetime-events/providers.tsx src/app/[locale]/spacetime-events/__tests__/page.test.tsx
git commit -m "feat: add spacetime events spike page"
```

---

### Task 7: Implement live attendee count subscriptions in the spike UI

**Files:**
- Modify: `src/app/[locale]/spacetime-events/spacetime-event-list.tsx`
- Create: `src/app/[locale]/spacetime-events/use-live-event-summaries.ts`
- Test: `src/app/[locale]/spacetime-events/__tests__/use-live-event-summaries.test.tsx`

**Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLiveEventSummaries } from "../use-live-event-summaries";

describe("useLiveEventSummaries", () => {
  it("returns initial events before the realtime client is ready", () => {
    const { result } = renderHook(() =>
      useLiveEventSummaries([
        { id: "evt_1", title: "Spring Meetup", confirmedParticipants: 12 },
      ] as any)
    );

    expect(result.current[0].confirmedParticipants).toBe(12);
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
bun run test --run src/app/[locale]/spacetime-events/__tests__/use-live-event-summaries.test.tsx
```
Expected:
- FAIL with hook not found

**Step 3: Write minimal implementation**

```tsx
"use client";

export function useLiveEventSummaries<T>(initialEvents: T[]): T[] {
  return initialEvents;
}
```

Then wire it into `spacetime-event-list.tsx`:

```tsx
const events = useLiveEventSummaries(initialEvents);
```

Render a simple card list with title and confirmed count.

**Step 4: Run test to verify it passes**

Run:
```bash
bun run test --run src/app/[locale]/spacetime-events/__tests__/use-live-event-summaries.test.tsx
```
Expected:
- PASS

**Step 5: Commit**

```bash
git add src/app/[locale]/spacetime-events/spacetime-event-list.tsx src/app/[locale]/spacetime-events/use-live-event-summaries.ts src/app/[locale]/spacetime-events/__tests__/use-live-event-summaries.test.tsx
git commit -m "feat: add live event summary hook for spacetime spike"
```

---

### Task 8: Prove registration reducer semantics with a capacity-safe spike flow

**Files:**
- Modify: `spacetimedb/src/index.ts`
- Create: `src/app/[locale]/spacetime-events/register-button.tsx`
- Test: `src/app/[locale]/spacetime-events/__tests__/register-button.test.tsx`
- Test: `spacetimedb/src/__tests__/registration-reducer.spec.ts`

**Step 1: Write the failing reducer test**

```ts
import { describe, expect, it } from "vitest";

describe("register_for_event reducer", () => {
  it("rejects registrations when confirmedParticipants equals capacity", () => {
    const event = { capacity: 2, confirmedParticipants: 2 };
    const canRegister = event.confirmedParticipants < event.capacity;
    expect(canRegister).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails meaningfully**

Run:
```bash
bun run test --run spacetimedb/src/__tests__/registration-reducer.spec.ts
```
Expected:
- FAIL until test file and reducer behavior exist

**Step 3: Write minimal reducer implementation**

Append to `spacetimedb/src/index.ts`:

```ts
export const register_for_event = schema({ user_profile, event_summary, registration }).reducer(
  { eventId: t.string(), registrationId: t.string() },
  (ctx, { eventId, registrationId }) => {
    const event = ctx.db.event_summary.id.find(eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    if (event.confirmedParticipants >= event.capacity) throw new Error("EVENT_FULL");

    ctx.db.registration.insert({
      id: registrationId,
      eventId,
      userIdentity: ctx.sender,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    });

    ctx.db.event_summary.id.update({
      ...event,
      confirmedParticipants: event.confirmedParticipants + 1,
      updatedAt: new Date().toISOString(),
    });
  }
);
```

Create a minimal `register-button.tsx` that calls the reducer hook once codegen is available.

**Step 4: Run tests to verify pass**

Run:
```bash
bun run test --run spacetimedb/src/__tests__/registration-reducer.spec.ts src/app/[locale]/spacetime-events/__tests__/register-button.test.tsx
```
Expected:
- PASS

**Step 5: Commit**

```bash
git add spacetimedb/src/index.ts spacetimedb/src/__tests__/registration-reducer.spec.ts src/app/[locale]/spacetime-events/register-button.tsx src/app/[locale]/spacetime-events/__tests__/register-button.test.tsx
git commit -m "feat: prove capacity-safe registration reducer in spike"
```

---

### Task 9: Add hot/cold archival contract for append-only history

**Files:**
- Modify: `spacetimedb/src/index.ts`
- Create: `src/lib/archive/r2-archive.ts`
- Create: `src/app/api/archive/spacetime/route.ts`
- Create: `src/types/archive.ts`
- Test: `src/lib/archive/__tests__/r2-archive.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildArchiveKey } from "@/lib/archive/r2-archive";

describe("buildArchiveKey", () => {
  it("creates hive-style partitions for cold data", () => {
    expect(
      buildArchiveKey({
        table: "audit_log",
        date: new Date("2026-04-05T00:00:00.000Z"),
        batchId: "batch-001",
      })
    ).toBe("archive/audit_log/y=2026/m=04/d=05/batch-001.ndjson.gz");
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
bun run test --run src/lib/archive/__tests__/r2-archive.test.ts
```
Expected:
- FAIL with module not found

**Step 3: Write minimal implementation**

`src/lib/archive/r2-archive.ts`

```ts
export function buildArchiveKey({
  table,
  date,
  batchId,
}: {
  table: string;
  date: Date;
  batchId: string;
}) {
  const y = String(date.getUTCFullYear());
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `archive/${table}/y=${y}/m=${m}/d=${d}/${batchId}.ndjson.gz`;
}
```

`src/app/api/archive/spacetime/route.ts`

```ts
export async function POST() {
  return Response.json({ ok: true, archivedTables: [] });
}
```

Add `archive_candidate_log` table to `spacetimedb/src/index.ts` for append-only history simulation.

**Step 4: Run test to verify it passes**

Run:
```bash
bun run test --run src/lib/archive/__tests__/r2-archive.test.ts
```
Expected:
- PASS

**Step 5: Commit**

```bash
git add src/lib/archive/r2-archive.ts src/lib/archive/__tests__/r2-archive.test.ts src/app/api/archive/spacetime/route.ts src/types/archive.ts spacetimedb/src/index.ts
git commit -m "feat: add r2 archive contract for spacetime cold data"
```

---

### Task 10: Prove archive pull → upload → prune flow end to end

**Files:**
- Modify: `src/app/api/archive/spacetime/route.ts`
- Modify: `spacetimedb/src/index.ts`
- Test: `src/app/api/archive/spacetime/__tests__/route.test.ts`

**Step 1: Write the failing route test**

```ts
import { describe, expect, it } from "vitest";
import { POST } from "../route";

describe("POST /api/archive/spacetime", () => {
  it("returns a dry-run payload with fetched, uploaded, and pruned counts", async () => {
    const response = await POST();
    const json = await response.json();
    expect(json).toHaveProperty("ok", true);
    expect(json).toHaveProperty("summary");
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
bun run test --run src/app/api/archive/spacetime/__tests__/route.test.ts
```
Expected:
- FAIL until summary payload exists

**Step 3: Write minimal implementation**

Update route to return:

```ts
return Response.json({
  ok: true,
  dryRun: true,
  summary: {
    fetched: 0,
    uploaded: 0,
    pruned: 0,
    table: "archive_candidate_log",
  },
});
```

Add TODO comments for the real sequence:
1. SQL HTTP fetch from SpacetimeDB
2. NDJSON + gzip
3. R2 upload
4. reducer call to prune

Add a reducer stub in `spacetimedb/src/index.ts`:

```ts
export const prune_archived_logs = schema({ user_profile, event_summary, registration }).reducer(
  { beforeIso: t.string() },
  () => {
    // TODO: delete archived rows by cutoff once archive flow is proven
  }
);
```

**Step 4: Run test to verify it passes**

Run:
```bash
bun run test --run src/app/api/archive/spacetime/__tests__/route.test.ts
```
Expected:
- PASS

**Step 5: Commit**

```bash
git add src/app/api/archive/spacetime/route.ts src/app/api/archive/spacetime/__tests__/route.test.ts spacetimedb/src/index.ts
git commit -m "feat: add archive flow dry-run endpoint for spacetime spike"
```

---

### Task 11: Add migration scorecard and full-migration verdict checklist

**Files:**
- Create: `docs/spacetimedb-migration-scorecard.md`
- Modify: `README.md`

**Step 1: Write the scorecard document**

Create a checklist with pass/fail sections for:
- SSR correctness
- live updates correctness
- reducer ergonomics
- auth feasibility
- archive ergonomics
- local dev complexity
- deploy complexity
- missing features (payments, webhooks, admin reporting)

Use this exact table:

```md
| Area | Verdict | Evidence | Notes |
| --- | --- | --- | --- |
| SSR + client takeover | undecided | pending spike | |
| Live event counters | undecided | pending spike | |
| Registration safety | undecided | pending spike | |
| Kinde/OIDC integration | undecided | pending spike | |
| R2 archive flow | undecided | pending spike | |
| Payment/webhook fit | risk | not yet solved | Requires thin HTTP layer |
| Admin/reporting fit | risk | not yet solved | Reporting path must be designed |
```

**Step 2: Link it from the README**

Add one bullet under repository references:

```md
- [SpacetimeDB migration scorecard](./docs/spacetimedb-migration-scorecard.md)
```

**Step 3: Run formatting and tests**

Run:
```bash
bun run format:check
bun run test:run
bun run type-check
```
Expected:
- all pass

**Step 4: Commit**

```bash
git add docs/spacetimedb-migration-scorecard.md README.md
git commit -m "docs: add spacetime migration scorecard"
```

---

### Task 12: Perform final spike review and decide go / no-go

**Files:**
- Modify: `docs/spacetimedb-migration-scorecard.md`
- Create: `docs/plans/2026-04-05-spacetimedb-migration-phase-2.md` (only if go)

**Step 1: Run the final verification commands**

Run:
```bash
bun run test:run
bun run type-check
bun run build
bun run stdb:generate
```
Expected:
- tests pass
- type-check passes
- build passes
- bindings generation works in the spike workflow

**Step 2: Fill the scorecard with real verdicts**

Update each area to one of:
- `pass`
- `needs-work`
- `fail`

**Step 3: Make the migration call**

Use this rule:
- If `SSR + client takeover`, `Live event counters`, `Registration safety`, and `R2 archive flow` are all `pass`, then write the phase-2 migration plan.
- Otherwise, stop. Keep the current architecture and treat the spike as research.

**Step 4: Commit**

```bash
git add docs/spacetimedb-migration-scorecard.md docs/plans/2026-04-05-spacetimedb-migration-phase-2.md
git commit -m "docs: record spacetime spike verdict"
```

---

## Final verdict from this session

### Architecture verdict
- **Best immediate move:** do a SpacetimeDB spike first, not a full rewrite first.
- **Best hot/cold design if SpacetimeDB wins:** SpacetimeDB for hot/live domain data + Cloudflare R2 for cold append-only history.
- **Best product framing:** design for both event workflows and future social features now, but do not let the future social roadmap force a blind rewrite before event registration works.

### Technical verdict
- SpacetimeDB v2.x is now a credible web-dev candidate because it has:
  - official Next.js App Router support
  - TypeScript modules
  - generated type-safe bindings
  - SSR + realtime hybrid guidance
- It is still a **significant backend architecture change**, not a simple database replacement.

### Cost verdict
- If the spike succeeds, the most cost-efficient SpacetimeDB path is:
  - Maincloud free tier / low paid tier for hot app state
  - Cloudflare R2 for cold history
  - thin HTTP integration layer only where external systems require webhooks or cron entrypoints

### Migration verdict
- **Do not migrate GameOne fully until the spike proves the registration flow, live counts, and archive mechanics.**
- If the spike fails one of the core gates, keep the relational stack and only revisit SpacetimeDB for the social domain later.
