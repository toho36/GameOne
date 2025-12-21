"use client";

import { useTranslations } from "next-intl";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { EventMetadataSettingsProps } from "@/types/components/event-creation-form.types";

import { FormField } from "./components/form-field";
import { TagInput } from "./components/tag-input";

export function EventMetadataSettings({
  formData,
  errors,
  onChange,
  isLoading,
}: EventMetadataSettingsProps) {
  const t = useTranslations("Events");

  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("form.sections.metadata")}</CardTitle>
        <CardDescription>{t("form.descriptions.metadata")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Event Tags */}
        <FormField
          label={t("form.labels.tags")}
          error={errors.tags}
          description={t("form.descriptions.tags")}
        >
          <TagInput
            value={formData.tags}
            onChange={(tags) => handleFieldChange("tags", tags)}
            error={errors.tags}
            placeholder={t("form.placeholders.tags")}
            maxTags={10}
            disabled={isLoading}
            description={t("form.descriptions.tagInput")}
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
