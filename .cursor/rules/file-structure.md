---
trigger: always_on
glob:
description: File structure and organization rules
---

# 📁 File Structure Rules

## 1. TYPES IN SEPARATE FILES

```
src/
├── types/                    # Global types
│   ├── auth/                 # Auth types
│   ├── event/                # Event types
│   ├── components/           # Prop types
│   └── global/               # Shared types
├── components/
│   └── features/
│       └── event-form/
│           ├── EventForm.tsx
│           └── event-form.types.ts
```

```typescript
// ❌ FORBIDDEN - inline types
export function EventCard({ event }: { event: Event; onClick: () => void }) {}

// ✅ REQUIRED - import from types file
import type { EventCardProps } from "./event-card.types";
export function EventCard({ event, onClick }: EventCardProps) {}
```

---

## 2. MAXIMUM 300 LINES PER FILE

- **Plan refactoring at 200 lines**
- **STOP and refactor at 300 lines**
- **Extract sub-components at 50+ lines JSX**
- **Extract custom hooks at 50+ lines logic**
- **Functions max 50 lines**

---

## 3. IMPORT ORDER

```typescript
// 1. React/Next.js
import React from "react";
import { useRouter } from "next/navigation";

// 2. External libraries
import { z } from "zod";
import { useForm } from "react-hook-form";

// 3. Internal utilities
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

// 4. Types (separate with `type` keyword)
import type { EventCardProps } from "./event-card.types";
import type { Event } from "@prisma/client";

// 5. Internal components
import { Button } from "@/components/ui/button";
import { useEventData } from "@/hooks/use-event-data";
```

---

## 4. COMPONENT PROPS INTERFACE

```typescript
// ✅ Use interface for props
interface EventCardProps {
  event: Event;
  onClick?: () => void;
  className?: string;
  isLoading?: boolean;
}

// ✅ Extend HTML attributes
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

// ✅ PropsWithChildren
import type { PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
  title: string;
}
```

---

## 5. EVENT HANDLERS

```typescript
// ✅ Typed handlers
interface FormProps {
  onSubmit: (data: EventCreationFormData) => Promise<void>;
  onChange: (field: keyof EventCreationFormData, value: unknown) => void;
}

// ✅ React events
interface ButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

// ✅ Form handling
const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
};
```

---

## 6. FILE NAMING

| Type       | Pattern            | Example               |
| ---------- | ------------------ | --------------------- |
| Components | `PascalCase.tsx`   | `EventCard.tsx`       |
| Hooks      | `use-hook-name.ts` | `use-event-data.ts`   |
| Utils      | `kebab-case.ts`    | `format-date.ts`      |
| Types      | `name.types.ts`    | `event-card.types.ts` |
| Tests      | `name.test.tsx`    | `EventCard.test.tsx`  |

---

## 7. FOLDER ORGANIZATION

```
src/
├── app/           # Next.js App Router
├── components/
│   ├── ui/        # Simple (<100 lines)
│   ├── layout/    # Layout components
│   └── features/  # Complex features
├── hooks/         # Global hooks
├── lib/           # Utilities, services
├── types/         # Global types
└── styles/        # Global styles
```
