"use client";

import React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { EventMetadataSettingsProps } from "./event-creation-form.types";

import { FormField } from "./components/form-field";
import { TagInput } from "./components/tag-input";

export function EventMetadataSettings({
  formData,
  errors,
  onChange,
  isLoading,
}: EventMetadataSettingsProps) {
  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags & Metadata</CardTitle>
        <CardDescription>
          Add tags and additional information to help people discover your event.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Event Tags */}
        <FormField
          label="Event Tags"
          error={errors.tags}
          description="Add relevant tags to help people find your event (max 10 tags)"
        >
          <TagInput
            value={formData.tags}
            onChange={(tags) => handleFieldChange("tags", tags)}
            error={errors.tags}
            placeholder="Add a tag..."
            maxTags={10}
            disabled={isLoading}
            description="Press Enter or comma to add a tag"
            suggestions={[
              "workshop",
              "conference",
              "networking",
              "technology",
              "business",
              "education",
              "social",
              "training",
              "meetup",
              "seminar",
            ]}
          />
        </FormField>
      </CardContent>
    </Card>
  );
}

export default EventMetadataSettings;
