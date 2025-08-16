"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { EventType } from "@prisma/client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventFormData } from "@/lib/schemas/event-schemas";
import { LanguageTabs } from "@/components/features/events/language-tabs";

interface BasicInfoStepProps {
  form: UseFormReturn<any>;
  locale: string;
  categories?: Array<{ id: string; name: string }>;
  formData: EventFormData;
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  WORKSHOP: "Workshop",
  SEMINAR: "Seminar",
  CONFERENCE: "Conference",
  MEETUP: "Meetup",
  TRAINING: "Training",
  SOCIAL: "Social Event",
  OTHER: "Other",
};

export function BasicInfoStep({ form, locale, categories = [], formData }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Basic Event Information</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Provide the essential details about your event that will help attendees understand what
          it&apos;s about.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter event title" {...field} className="text-lg" />
                </FormControl>
                <FormDescription>
                  Choose a clear, descriptive title that captures the essence of your event.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Select the category that best describes your event.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {categories.length > 0 && (
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Optional: Choose a specific category for better organization.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name="shortDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief summary of your event (max 500 characters)"
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A concise summary that will appear in event listings and previews.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Detailed description of your event, including agenda, speakers, requirements, etc."
                    className="resize-none"
                    rows={6}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide comprehensive details about your event. This will be displayed on the
                  event page.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter tags separated by commas (e.g., javascript, workshop, beginner)"
                    value={field.value?.join(", ") || ""}
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag.length > 0);
                      field.onChange(tags);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Add relevant tags to help people discover your event. Separate multiple tags with
                  commas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Image URL</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com/event-image.jpg" {...field} />
              </FormControl>
              <FormDescription>
                Optional: Add an image URL to make your event more visually appealing.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com" {...field} />
              </FormControl>
              <FormDescription>
                Optional: Link to your event website or additional information.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Language Translations */}
      <div className="mt-8">
        <LanguageTabs form={form} currentLocale={locale} formData={formData} />
      </div>
    </div>
  );
}
