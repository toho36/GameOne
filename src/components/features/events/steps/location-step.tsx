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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { EventFormData } from "@/lib/schemas/event-schemas";

interface LocationStepProps {
  form: UseFormReturn<EventFormData>;
  locale: string;
  formData: EventFormData;
}

export function LocationStep({ form, formData }: LocationStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Event Location</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Specify where your event will take place. You can choose between physical location,
          online, or hybrid.
        </p>
      </div>

      <div className="space-y-6">
        <FormField
          control={form.control}
          name="isOnline"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>This is an online event</FormLabel>
                <FormDescription>
                  Check this if your event will be held online or includes online participation.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {formData.isOnline && (
          <FormField
            control={form.control}
            name="onlineUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Online Event URL *</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://zoom.us/j/123456789 or https://meet.google.com/abc-def-ghi"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide the link where attendees can join your online event (Zoom, Google Meet,
                  etc.).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!formData.isOnline && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Conference Center, Hotel Name, Company Office, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The name of the venue or building where the event will be held.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Street name, building number, floor, room number"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Full street address including building number and any additional location
                        details.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Bratislava, Prague, Vienna, etc." {...field} />
                    </FormControl>
                    <FormDescription>The city where your event will take place.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Slovakia, Czech Republic, Austria, etc." {...field} />
                    </FormControl>
                    <FormDescription>The country where your event will take place.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Location Preview */}
        {(formData.venue || formData.address || formData.city || formData.isOnline) && (
          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-medium">Location Preview</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              {formData.isOnline ? (
                <div>
                  <strong>Online Event</strong>
                  {formData.onlineUrl && (
                    <div className="mt-1">
                      <strong>Join URL:</strong> {formData.onlineUrl}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {formData.venue && (
                    <div>
                      <strong>Venue:</strong> {formData.venue}
                    </div>
                  )}
                  {formData.address && (
                    <div>
                      <strong>Address:</strong> {formData.address}
                    </div>
                  )}
                  {(formData.city || formData.country) && (
                    <div>
                      <strong>Location:</strong>{" "}
                      {[formData.city, formData.country].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
