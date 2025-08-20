import { z } from "zod";

// Simplified event creation validation schema
export const eventCreationSchema = z
  .object({
    // Basic information
    title: z
      .string()
      .min(3, "Title must be at least 3 characters long")
      .max(200, "Title must not exceed 200 characters")
      .trim(),

    description: z.string().max(5000, "Description must not exceed 5000 characters").optional(),

    // Location
    venue: z
      .string()
      .min(1, "Place/Address is required")
      .max(200, "Place/Address must not exceed 200 characters"),

    // Event details
    capacity: z
      .number()
      .int("Capacity must be a whole number")
      .min(1, "Capacity must be at least 1")
      .max(10000, "Capacity cannot exceed 10,000"),

    price: z
      .number()
      .min(0, "Price cannot be negative")
      .max(100000, "Price cannot exceed 100,000")
      .default(0),

    currency: z.string().default("CZK"),

    // Scheduling
    startDate: z.union([z.date(), z.string()]).transform((val) => {
      if (typeof val === "string") {
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid start date format");
        }
        return date;
      }
      return val;
    }),

    endDate: z
      .union([z.date(), z.string()])
      .transform((val) => {
        if (typeof val === "string") {
          const date = new Date(val);
          if (isNaN(date.getTime())) {
            throw new Error("Invalid end date format");
          }
          return date;
        }
        return val;
      })
      .optional(),

    // Payment settings
    bankAccountId: z.string().optional(),

    // Visibility/Status
    status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),

    // Default required fields for API compatibility
    type: z.string().default("OTHER"),
    country: z.string().default("Czech Republic"),
    timezone: z.string().default("Europe/Prague"),
    isOnline: z.boolean().default(false),
    requiresApproval: z.boolean().default(false),
    allowWaitingList: z.boolean().default(true),
    requiresPayment: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

// Event update schema (for editing existing events)
export const eventUpdateSchema = eventCreationSchema
  .partial({
    startDate: true, // Allow editing events that already started
  })
  .refine(
    (data) => {
      // For updates, we can be more lenient with dates
      if (data.endDate && data.startDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

// Type inference from schema
export type EventCreationFormData = z.infer<typeof eventCreationSchema>;
export type EventUpdateFormData = z.infer<typeof eventUpdateSchema>;

// Validation helper functions
export const validateEventCreation = (data: unknown) => {
  return eventCreationSchema.safeParse(data);
};

export const validateEventUpdate = (data: unknown) => {
  return eventUpdateSchema.safeParse(data);
};

// Form field validation helpers
export const validateTitle = (title: string) => {
  return z.string().min(3).max(200).safeParse(title);
};

export const validateCapacity = (capacity: number) => {
  return z.number().int().min(1).max(10000).safeParse(capacity);
};

export const validatePrice = (price?: number) => {
  if (price === undefined) return { success: true };
  return z.number().min(0).max(100000).safeParse(price);
};

export const validateEmail = (email: string) => {
  return z.string().email().safeParse(email);
};

export const validateUrl = (url: string) => {
  if (!url) return { success: true };
  return z.string().url().safeParse(url);
};

// Error message helpers
export const getFieldError = (errors: z.ZodError, fieldName: string): string | undefined => {
  const fieldError = errors.issues.find((error) => error.path.join(".") === fieldName);
  return fieldError?.message;
};

export const formatValidationErrors = (errors: z.ZodError) => {
  return errors.issues.reduce(
    (acc, error) => {
      const field = error.path.join(".");
      acc[field] = error.message;
      return acc;
    },
    {} as Record<string, string>
  );
};
