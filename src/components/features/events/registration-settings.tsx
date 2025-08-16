"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Calendar, Users, Clock, UserCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { EventFormData } from "@/lib/schemas/event-schemas";

interface RegistrationSettingsProps {
  form: UseFormReturn<any>;
  locale: string;
  formData: EventFormData;
}

export function RegistrationSettings({ form, locale, formData }: RegistrationSettingsProps) {
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

  const getRegistrationStatus = () => {
    const now = new Date();
    const startDate = formData.registrationStartDate
      ? new Date(formData.registrationStartDate)
      : null;
    const endDate = formData.registrationEndDate ? new Date(formData.registrationEndDate) : null;
    const eventStart = formData.startDate ? new Date(formData.startDate) : null;

    if (startDate && now < startDate) {
      return { status: "upcoming", label: "Opens Soon", color: "blue" };
    }

    if (endDate && now > endDate) {
      return { status: "closed", label: "Closed", color: "red" };
    }

    if (eventStart && now > eventStart) {
      return { status: "ended", label: "Event Ended", color: "gray" };
    }

    return { status: "open", label: "Open", color: "green" };
  };

  const registrationStatus = getRegistrationStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Registration Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure how people can register for your event, including capacity limits and
          registration periods.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Capacity Settings */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Event Capacity *
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="10000"
                    placeholder="50"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Maximum number of attendees for your event (1-10,000).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="requiresApproval"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Require approval for registrations
                    </FormLabel>
                    <FormDescription>
                      Manually approve each registration before confirming attendance.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowWaitingList"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Allow waiting list
                    </FormLabel>
                    <FormDescription>
                      Let people join a waiting list when the event is full.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Waiting List Settings */}
        {formData.allowWaitingList && (
          <div className="rounded-lg bg-muted p-4">
            <FormField
              control={form.control}
              name="maxWaitingList"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Waiting List Size</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Leave empty for unlimited"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Limit the number of people who can join the waiting list.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Registration Period */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <h4 className="font-medium">Registration Period</h4>
            <Badge variant={registrationStatus.color === "green" ? "secondary" : "outline"}>
              {registrationStatus.label}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="registrationStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Opens</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={formatDateTimeLocal(field.value)}
                      onChange={(e) => handleDateTimeChange(e.target.value, field.onChange)}
                      max={formatDateTimeLocal(formData.startDate)}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: When registration opens. Leave empty to open immediately.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registrationEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Closes</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={formatDateTimeLocal(field.value)}
                      onChange={(e) => handleDateTimeChange(e.target.value, field.onChange)}
                      min={formatDateTimeLocal(formData.registrationStartDate)}
                      max={formatDateTimeLocal(formData.startDate)}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: When registration closes. Leave empty to close at event start.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Registration Preview */}
        <div className="rounded-lg bg-muted p-4">
          <h4 className="mb-3 font-medium">Registration Settings Summary</h4>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Capacity:</span>
                <span className="font-medium">{formData.capacity} attendees</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Approval:</span>
                <Badge variant={formData.requiresApproval ? "destructive" : "secondary"}>
                  {formData.requiresApproval ? "Required" : "Automatic"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Waiting List:</span>
                <div className="flex items-center gap-2">
                  <Badge variant={formData.allowWaitingList ? "secondary" : "outline"}>
                    {formData.allowWaitingList ? "Enabled" : "Disabled"}
                  </Badge>
                  {formData.allowWaitingList && formData.maxWaitingList && (
                    <span className="text-xs text-muted-foreground">
                      (max {formData.maxWaitingList})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {formData.registrationStartDate && (
                <div>
                  <span className="text-muted-foreground">Opens:</span>
                  <div className="text-xs">
                    {new Date(formData.registrationStartDate).toLocaleString(locale, {
                      timeZone: formData.timezone,
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              )}
              {formData.registrationEndDate && (
                <div>
                  <span className="text-muted-foreground">Closes:</span>
                  <div className="text-xs">
                    {new Date(formData.registrationEndDate).toLocaleString(locale, {
                      timeZone: formData.timezone,
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              )}
              {!formData.registrationStartDate && !formData.registrationEndDate && (
                <div className="text-xs text-muted-foreground">
                  Registration is open from now until event starts
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
