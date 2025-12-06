---
description: Create a new API route with proper validation
---

# New API Route t

Create a new API route following Next.js App Router conventions with Zod
validation.

## Steps

1. **Determine route structure**
   - Resource-based: `/api/events`, `/api/users`
   - Nested resources: `/api/events/[id]/register`
   - Use RESTful conventions (GET/POST/PUT/DELETE)

2. **Create route file** at `src/app/api/<resource>/route.ts`

3. **Add Zod validation schema**

```typescript
import { z } from "zod";

const schema = z.object({
  field: z.string().min(1),
  // ... other fields
});
```

4. **Implement HTTP handlers**

```typescript
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Parse and validate
    const url = new URL(req.url);
    const params = schema.parse({
      field: url.searchParams.get("field"),
    });

    // Business logic
    const data = await fetchData(params);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Error message" },
      { status: 400 }
    );
  }
}
```

5. **Add authentication** (if needed)

```typescript
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const { getUser } = getKindeServerSession();
const user = await getUser();

if (!user) {
  return NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 401 }
  );
}
```

6. **Test route**
   - Use Postman/Thunder Client
   - Test happy path
   - Test validation errors
   - Test auth (if applicable)

// turbo 7. **Run validation**

```bash
bun run type-check
bun run lint
```

## Best Practices

- ✅ Always validate input with Zod
- ✅ Use `process.env["VAR"]` bracket notation
- ✅ Return `{ success, data }` or `{ success: false, error }`
- ✅ Use proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- ✅ Never expose sensitive errors to client
- ✅ Add try-catch for all async operations
