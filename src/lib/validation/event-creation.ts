import { z } from "zod";

// Function to create event creation schema with translated messages
export const createEventCreationSchema = (messages?: {
  titleMin?: string;
  titleMax?: string;
  descriptionMax?: string;
  venueRequired?: string;
  venueMax?: string;
  capacityInteger?: string;
  capacityMin?: string;
  capacityMax?: string;
  priceMin?: string;
  priceMax?: string;
  startDateInvalid?: string;
  endDateInvalid?: string;
  endDateAfterStart?: string;
}) => {
  const msgs = messages || {
    titleMin: "Title must be at least 3 characters long",
    titleMax: "Title must not exceed 200 characters",
    descriptionMax: "Description must not exceed 5000 characters",
    venueRequired: "Place/Address is required",
    venueMax: "Place/Address must not exceed 200 characters",
    capacityInteger: "Capacity must be a whole number",
    capacityMin: "Capacity must be at least 1",
    capacityMax: "Capacity cannot exceed 10,000",
    priceMin: "Price cannot be negative",
    priceMax: "Price cannot exceed 100,000",
    startDateInvalid: "Invalid start date format",
    endDateInvalid: "Invalid end date format",
    endDateAfterStart: "End date must be after start date",
  };

  return z
    .object({
      // Basic information
      title: z.string().min(3, msgs.titleMin).max(200, msgs.titleMax).trim(),

      description: z.string().max(5000, msgs.descriptionMax).optional(),

      // Location
      venue: z.string().min(1, msgs.venueRequired).max(200, msgs.venueMax),

      // Event details
      capacity: z
        .union([z.number(), z.string()])
        .transform((val) => {
          const numVal = typeof val === "string" ? parseInt(val, 10) : val;
          return isNaN(numVal) ? 1 : numVal;
        })
        .pipe(
          z.number().int(msgs.capacityInteger).min(1, msgs.capacityMin).max(10000, msgs.capacityMax)
        ),

      price: z
        .union([z.number(), z.string(), z.null(), z.undefined()])
        .transform((val) => {
          if (val === null || val === undefined || val === "") return 0;
          const numVal = typeof val === "string" ? parseFloat(val) : val;
          return isNaN(numVal) ? 0 : numVal;
        })
        .pipe(z.number().min(0, msgs.priceMin).max(100000, msgs.priceMax))
        .default(0),

      currency: z.string().default("CZK"),

      // Scheduling
      startDate: z.union([z.date(), z.string()]).transform((val) => {
        if (typeof val === "string") {
          const date = new Date(val);
          if (isNaN(date.getTime())) {
            throw new Error(msgs.startDateInvalid);
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
              throw new Error(msgs.endDateInvalid);
            }
            return date;
          }
          return val;
        })
        .optional(),

      // Registration control
      registrationStartDate: z
        .union([z.date(), z.string()])
        .transform((val) => {
          if (typeof val === "string") {
            const date = new Date(val);
            if (isNaN(date.getTime())) {
              throw new Error("Invalid registration start date format");
            }
            return date;
          }
          return val;
        })
        .optional(),

      registrationEndDate: z
        .union([z.date(), z.string()])
        .transform((val) => {
          if (typeof val === "string") {
            const date = new Date(val);
            if (isNaN(date.getTime())) {
              throw new Error("Invalid registration end date format");
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
        message: msgs.endDateAfterStart,
        path: ["endDate"],
      }
    );
};

// Default schema for backward compatibility
export const eventCreationSchema = createEventCreationSchema();

// Function to create event update schema with translated messages
export const createEventUpdateSchema = (
  messages?: Parameters<typeof createEventCreationSchema>[0]
) => {
  const msgs = messages || {
    endDateAfterStart: "End date must be after start date",
  };

  return createEventCreationSchema(messages)
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
        message: msgs.endDateAfterStart,
        path: ["endDate"],
      }
    );
};

// Default schema for backward compatibility
export const eventUpdateSchema = createEventUpdateSchema();

// Type inference from schema
export type EventCreationFormData = z.infer<typeof eventCreationSchema>;
export type EventUpdateFormData = z.infer<typeof eventUpdateSchema>;

// Validation helper functions
export const validateEventCreation = (
  data: unknown,
  messages?: Parameters<typeof createEventCreationSchema>[0]
) => {
  return createEventCreationSchema(messages).safeParse(data);
};

export const validateEventUpdate = (
  data: unknown,
  messages?: Parameters<typeof createEventUpdateSchema>[0]
) => {
  return createEventUpdateSchema(messages).safeParse(data);
};

// Form field validation helpers
export const validateTitle = (title: string) => {
  return z.string().min(3).max(200).safeParse(title);
};

export const validateCapacity = (capacity: number | string) => {
  const numVal = typeof capacity === "string" ? parseInt(capacity, 10) : capacity;
  if (isNaN(numVal)) return { success: false, error: { message: "Invalid capacity value" } };
  return z.number().int().min(1).max(10000).safeParse(numVal);
};

export const validatePrice = (price?: number | string | null) => {
  if (price === undefined || price === null || price === "") return { success: true };
  const numVal = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numVal)) return { success: false, error: { message: "Invalid price value" } };
  return z.number().min(0).max(100000).safeParse(numVal);
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
