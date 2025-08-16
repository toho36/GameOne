import { z } from "zod";
import { EventType, EventStatus } from "@prisma/client";

export const eventTranslationSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().optional(),
  shortDescription: z
    .string()
    .max(500, "Short description must be less than 500 characters")
    .optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
});

export const eventFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().optional(),
  shortDescription: z
    .string()
    .max(500, "Short description must be less than 500 characters")
    .optional(),
  type: z.nativeEnum(EventType),
  startDate: z.string().datetime("Please provide a valid start date"),
  endDate: z.string().datetime("Please provide a valid end date").optional(),
  timezone: z.string().default("Europe/Bratislava"),
  capacity: z
    .number()
    .min(1, "Capacity must be at least 1")
    .max(10000, "Capacity cannot exceed 10,000"),
  registrationStartDate: z
    .string()
    .datetime("Please provide a valid registration start date")
    .optional(),
  registrationEndDate: z
    .string()
    .datetime("Please provide a valid registration end date")
    .optional(),
  requiresApproval: z.boolean().default(false),
  allowWaitingList: z.boolean().default(true),
  maxWaitingList: z.number().min(0, "Waiting list capacity cannot be negative").optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("Slovakia"),
  isOnline: z.boolean().default(false),
  onlineUrl: z.string().url("Please provide a valid URL").optional(),
  requiresPayment: z.boolean().default(false),
  price: z.number().min(0, "Price cannot be negative").optional(),
  currency: z.string().default("EUR"),
  bankAccountId: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().url("Please provide a valid image URL").optional(),
  websiteUrl: z.string().url("Please provide a valid website URL").optional(),
  translations: z.record(z.string(), eventTranslationSchema).optional(),
});

export const eventStatusSchema = z.object({
  status: z.nativeEnum(EventStatus),
  reason: z.string().optional(),
});

export const eventQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.nativeEnum(EventStatus).optional(),
  type: z.nativeEnum(EventType).optional(),
  search: z.string().optional(),
  creatorId: z.string().optional(),
  categoryId: z.string().optional(),
  city: z.string().optional(),
  startDateFrom: z.string().datetime().optional(),
  startDateTo: z.string().datetime().optional(),
  requiresPayment: z.coerce.boolean().optional(),
  isOnline: z.coerce.boolean().optional(),
});

export type EventFormData = z.infer<typeof eventFormSchema>;
export type EventTranslationData = z.infer<typeof eventTranslationSchema>;
export type EventStatusData = z.infer<typeof eventStatusSchema>;
export type EventQueryData = z.infer<typeof eventQuerySchema>;
