"use client";

import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Languages, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EventFormData, EventTranslationData } from "@/lib/schemas/event-schemas";

interface LanguageTabsProps {
  form: UseFormReturn<any>;
  currentLocale: string;
  formData: EventFormData;
}

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "cs", name: "Čeština", flag: "🇨🇿" },
] as const;

export function LanguageTabs({ form, currentLocale, formData }: LanguageTabsProps) {
  const [activeLanguage, setActiveLanguage] = useState<string>(currentLocale);

  const getTranslationForLanguage = (language: string): EventTranslationData => {
    const translations = formData.translations || {};
    return (
      translations[language] || {
        title: "",
        description: undefined,
        shortDescription: undefined,
        venue: undefined,
        address: undefined,
      }
    );
  };

  const updateTranslation = (
    language: string,
    field: keyof EventTranslationData,
    value: string | undefined
  ) => {
    const currentTranslations = formData.translations || {};
    const languageTranslation = currentTranslations[language] || {};

    const updatedTranslation = {
      ...languageTranslation,
      [field]: value,
    };

    const updatedTranslations = {
      ...currentTranslations,
      [language]: updatedTranslation,
    };

    form.setValue("translations", updatedTranslations);
  };

  const getTranslationCompleteness = (language: string): { completed: number; total: number } => {
    const translation = getTranslationForLanguage(language);
    const requiredFields = ["title"] as const;

    let completed = 0;
    const total = requiredFields.length;

    // Check required fields
    requiredFields.forEach((field) => {
      if (translation[field] && translation[field].trim().length > 0) {
        completed++;
      }
    });

    return { completed, total };
  };

  const isLanguageComplete = (language: string): boolean => {
    const { completed, total } = getTranslationCompleteness(language);
    return completed === total;
  };

  const currentTranslation = getTranslationForLanguage(activeLanguage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Multi-language Content
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Provide translations for your event in multiple languages to reach a broader audience.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Language Tabs */}
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_LANGUAGES.map((language) => {
            const isComplete = isLanguageComplete(language.code);
            const { completed, total } = getTranslationCompleteness(language.code);

            return (
              <Button
                key={language.code}
                type="button"
                variant={activeLanguage === language.code ? "default" : "outline"}
                onClick={() => setActiveLanguage(language.code)}
                className="flex items-center gap-2"
              >
                <span>{language.flag}</span>
                <span>{language.name}</span>
                {isComplete ? (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    ✓
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-1 text-xs">
                    {completed}/{total}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>

        {/* Translation Form Fields */}
        <div className="space-y-4 border-t pt-4">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <h4 className="font-medium">
              {SUPPORTED_LANGUAGES.find((l) => l.code === activeLanguage)?.name} Translation
            </h4>
          </div>

          <div className="space-y-4">
            {/* Title Translation */}
            <div>
              <FormLabel>Event Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder={`Enter event title in ${SUPPORTED_LANGUAGES.find((l) => l.code === activeLanguage)?.name}`}
                  value={currentTranslation.title || ""}
                  onChange={(e) => updateTranslation(activeLanguage, "title", e.target.value)}
                  className="text-lg"
                />
              </FormControl>
              <FormDescription>
                The main title of your event in{" "}
                {SUPPORTED_LANGUAGES.find((l) => l.code === activeLanguage)?.name}.
              </FormDescription>
              {!currentTranslation.title && (
                <p className="text-sm text-destructive">Title is required for this language</p>
              )}
            </div>

            {/* Short Description Translation */}
            <div>
              <FormLabel>Short Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Brief summary in ${SUPPORTED_LANGUAGES.find((l) => l.code === activeLanguage)?.name} (max 500 characters)`}
                  className="resize-none"
                  rows={3}
                  value={currentTranslation.shortDescription || ""}
                  onChange={(e) =>
                    updateTranslation(activeLanguage, "shortDescription", e.target.value)
                  }
                />
              </FormControl>
              <FormDescription>
                A concise summary that will appear in event listings.
              </FormDescription>
            </div>

            {/* Full Description Translation */}
            <div>
              <FormLabel>Full Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Detailed description in ${SUPPORTED_LANGUAGES.find((l) => l.code === activeLanguage)?.name}`}
                  className="resize-none"
                  rows={6}
                  value={currentTranslation.description || ""}
                  onChange={(e) => updateTranslation(activeLanguage, "description", e.target.value)}
                />
              </FormControl>
              <FormDescription>
                Comprehensive details about your event in{" "}
                {SUPPORTED_LANGUAGES.find((l) => l.code === activeLanguage)?.name}.
              </FormDescription>
            </div>

            {/* Venue Translation */}
            <div>
              <FormLabel>Venue Name</FormLabel>
              <FormControl>
                <Input
                  placeholder={`Venue name in ${SUPPORTED_LANGUAGES.find((l) => l.code === activeLanguage)?.name}`}
                  value={currentTranslation.venue || ""}
                  onChange={(e) => updateTranslation(activeLanguage, "venue", e.target.value)}
                />
              </FormControl>
              <FormDescription>The name of the venue in the local language.</FormDescription>
            </div>

            {/* Address Translation */}
            <div>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Address in ${SUPPORTED_LANGUAGES.find((l) => l.code === activeLanguage)?.name}`}
                  rows={2}
                  value={currentTranslation.address || ""}
                  onChange={(e) => updateTranslation(activeLanguage, "address", e.target.value)}
                />
              </FormControl>
              <FormDescription>
                Full address including any location details in the local language.
              </FormDescription>
            </div>
          </div>
        </div>

        {/* Translation Preview */}
        <div className="border-t pt-4">
          <h4 className="mb-3 font-medium">Translation Status</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {SUPPORTED_LANGUAGES.map((language) => {
              const translation = getTranslationForLanguage(language.code);
              const { completed, total } = getTranslationCompleteness(language.code);
              const isComplete = completed === total;

              return (
                <div key={language.code} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{language.flag}</span>
                      <span className="font-medium">{language.name}</span>
                    </div>
                    <Badge variant={isComplete ? "secondary" : "outline"}>
                      {completed}/{total} required
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>
                      <strong>Title:</strong> {translation.title || "Not provided"}
                    </div>
                    {translation.shortDescription && (
                      <div>
                        <strong>Short Description:</strong>{" "}
                        {translation.shortDescription.substring(0, 50)}
                        {translation.shortDescription.length > 50 ? "..." : ""}
                      </div>
                    )}
                    {translation.venue && (
                      <div>
                        <strong>Venue:</strong> {translation.venue}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation Messages */}
        <div className="space-y-2">
          {SUPPORTED_LANGUAGES.map((language) => {
            const isComplete = isLanguageComplete(language.code);
            if (isComplete) return null;

            return (
              <div
                key={language.code}
                className="rounded-lg border border-yellow-200 bg-yellow-50 p-3"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      {language.flag} {language.name} Translation Incomplete
                    </h3>
                    <div className="mt-1 text-sm text-yellow-700">
                      <p>
                        Please provide at least the event title in {language.name} to complete this
                        translation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
