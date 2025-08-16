"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventFormData } from "@/lib/schemas/event-schemas";

interface SchedulingStepProps {
  form: UseFormReturn<EventFormData>;
  locale: string;
  formData: EventFormData;
}

const TIMEZONE_OPTIONS = [
  { value: "Europe/Bratislava", label: "Central European Time (Bratislava)" },
  { value: "Europe/Prague", label: "Central European Time (Prague)" },
  { value: "Europe/Vienna", label: "Central European Time (Vienna)" },
  { value: "Europe/Budapest", label: "Central European Time (Budapest)" },
  { value: "Europe/London", label: "Greenwich Mean Time (London)" },
  { value: "Europe/Berlin", label: "Central European Time (Berlin)" },
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
];

export function SchedulingStep({ form, locale, formData }: SchedulingStepProps) {
  const formatDateTimeLocal = (date: string | undefined): string => {
    if (!date) return "";
    try {
      const d = new Date(date);
      return d.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleDateTimeChange = (inputValue: string, onChange: (value: string) => void) => {
    if (!inputValue) {
      onChange("");
      return;
    }

    try {
      const date = new Date(inputValue);
      onChange(date.toISOString());
    } catch {
      onChange("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Event Schedule</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Set the date, time, and timezone for your event. Make sure to consider your target
          audience&apos;s location.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date & Time *</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  value={formatDateTimeLocal(field.value)}
                  onChange={(e) => handleDateTimeChange(e.target.value, field.onChange)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </FormControl>
              <FormDescription>
                When does your event start? This will be displayed to attendees.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date & Time</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  value={formatDateTimeLocal(field.value)}
                  onChange={(e) => handleDateTimeChange(e.target.value, field.onChange)}
                  min={formatDateTimeLocal(formData.startDate)}
                />
              </FormControl>
              <FormDescription>
                Optional: When does your event end? Leave empty for open-ended events.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the timezone for your event. This helps attendees understand the local
                  time.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {formData.startDate && (
          <div className="rounded-lg bg-muted p-4 md:col-span-2">
            <h4 className="mb-2 font-medium">Event Schedule Preview</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                <strong>Start:</strong>{" "}
                {new Date(formData.startDate).toLocaleString(locale, {
                  timeZone: formData.timezone,
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </div>
              {formData.endDate && (
                <div>
                  <strong>End:</strong>{" "}
                  {new Date(formData.endDate).toLocaleString(locale, {
                    timeZone: formData.timezone,
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </div>
              )}
              <div>
                <strong>Timezone:</strong> {formData.timezone}
              </div>
              {formData.startDate && formData.endDate && (
                <div>
                  <strong>Duration:</strong>{" "}
                  {Math.round(
                    (new Date(formData.endDate).getTime() -
                      new Date(formData.startDate).getTime()) /
                      (1000 * 60 * 60)
                  )}{" "}
                  hours
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
