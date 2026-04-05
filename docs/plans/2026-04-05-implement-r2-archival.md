# R2 Archival System Implementation Plan

> **For the agent:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Automated weekly archival of cold AuditLog, RegistrationHistory, and NotificationLog records to Cloudflare R2 as Gzipped NDJSON.

**Architecture:** Use a Next.js API route as a Vercel Cron job that fetches records older than 30 days, compresses them using zlib, uploads them to R2 via S3 SDK, and deletes the local DB records.

**Tech Stack:** Next.js (App Router), Prisma, @aws-sdk/client-s3, zlib, Bun.

---

### Task 1: Install S3 SDK

**Files:**
- Modify: `package.json`

**Step 1: Install dependencies**
Run: `bun add @aws-sdk/client-s3`

**Step 2: Verify installation**
Run: `bun list @aws-sdk/client-s3`
Expected: @aws-sdk/client-s3@^3.x.x

**Step 3: Commit**
```bash
git add package.json bun.lock
git commit -m "chore: add @aws-sdk/client-s3 for R2 archival"
```

---

### Task 2: Configure R2 Client

**Files:**
- Create: `lib/s3.ts`

**Step 1: Create the S3 client wrapper**
```typescript
import { S3Client } from "@aws-sdk/client-s3";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: \`https://\${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com\`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
```

**Step 2: Verify syntax**
Run: `bun x tsc lib/s3.ts --noEmit --esModuleInterop --skipLibCheck`
Expected: No errors

**Step 3: Commit**
```bash
git add lib/s3.ts
git commit -m "feat: add R2 S3 client configuration"
```

---

### Task 3: Implement Archival Utility

**Files:**
- Create: `lib/archival.ts`

**Step 1: Write the archival logic**
```typescript
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "./s3";
import { gzipSync } from "zlib";

export async function archiveToR2(tableName: string, data: any[]) {
  if (data.length === 0) return null;

  const ndjson = data.map((row) => JSON.stringify(row)).join("\n");
  const compressed = gzipSync(Buffer.from(ndjson));

  const now = new Date();
  const key = \`archive/\${tableName}/y=\${now.getFullYear()}/m=\${String(
    now.getMonth() + 1
  ).padStart(2, "0")}/d=\${String(now.getDate()).padStart(
    2,
    "0"
  )}/\${Date.now()}.ndjson.gz\`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: compressed,
      ContentType: "application/x-ndjson",
      ContentEncoding: "gzip",
    })
  );

  return key;
}
```

**Step 2: Verify syntax**
Run: `bun x tsc lib/archival.ts --noEmit --esModuleInterop --skipLibCheck`
Expected: No errors

**Step 3: Commit**
```bash
git add lib/archival.ts
git commit -m "feat: add archival utility for Gzipped NDJSON"
```

---

### Task 4: Create Cron Job Route

**Files:**
- Create: `app/api/cron/archive/route.ts`

**Step 1: Implement the Cron API route**
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { archiveToR2 } from "@/lib/archival";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const tables = ["AuditLog", "RegistrationHistory", "NotificationLog"];
  const results: Record<string, any> = {};

  for (const table of tables) {
    // Note: This requires dynamic table access or separate queries per table
    // For safety and type-check, we'll implement per-table explicitly
    let data: any[] = [];
    let prismaTable: any;

    if (table === "AuditLog") {
      data = await prisma.auditLog.findMany({ where: { createdAt: { lt: cutoff } }, take: 1000 });
      prismaTable = prisma.auditLog;
    } else if (table === "RegistrationHistory") {
      data = await prisma.registrationHistory.findMany({ where: { createdAt: { lt: cutoff } }, take: 1000 });
      prismaTable = prisma.registrationHistory;
    } else if (table === "NotificationLog") {
      data = await prisma.notificationLog.findMany({ where: { createdAt: { lt: cutoff } }, take: 1000 });
      prismaTable = prisma.notificationLog;
    }

    if (data.length > 0) {
      const key = await archiveToR2(table, data);
      await prismaTable.deleteMany({ where: { id: { in: data.map((d) => d.id) } } });
      results[table] = { count: data.length, key };
    }
  }

  return NextResponse.json({ success: true, results });
}
```

**Step 2: Commit**
```bash
git add app/api/cron/archive/route.ts
git commit -m "feat: add Next.js Cron job route for data archival"
```

---

### Task 5: Add Documentation

**Files:**
- Create: `docs/archival.md`

**Step 1: Add operations documentation**
Include info on how to query with DuckDB and environment variables needed.

**Step 2: Commit**
```bash
git add docs/archival.md
git commit -m "docs: add archival operations guide"
```
