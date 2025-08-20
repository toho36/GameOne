"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save, X } from "lucide-react";

import type { EventFormActionsProps } from "@/types/components/event-creation-form.types";

export function EventFormActions({
  onSubmit,
  onCancel,
  onSaveDraft,
  isSubmitting,
  isValid,
  mode,
  submitLabel,
  cancelLabel,
  saveDraftLabel,
}: EventFormActionsProps) {
  const defaultSubmitLabel = mode === "create" ? "Create Event" : "Update Event";
  const defaultCancelLabel = "Cancel";
  const defaultSaveDraftLabel = "Save as Draft";

  return (
    <Card>
      <CardContent className="pt-6" role="group" aria-label="Form actions">
        {/* Mobile: Submit button first, secondary actions below */}
        <div className="flex flex-col gap-3 sm:hidden">
          {/* Submit Button */}
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting || !isValid}
            size="lg"
            className="w-full"
            aria-describedby={!isValid ? "form-validation-error" : undefined}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {submitLabel || defaultSubmitLabel}
          </Button>

          {/* Secondary Actions Row */}
          <div className="flex gap-3">
            {onSaveDraft && (
              <Button
                type="button"
                variant="secondary"
                onClick={onSaveDraft}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saveDraftLabel || defaultSaveDraftLabel}
              </Button>
            )}

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                {cancelLabel || defaultCancelLabel}
              </Button>
            )}
          </div>
        </div>

        {/* Desktop: Traditional layout */}
        <div className="hidden justify-end gap-3 sm:flex">
          {/* Cancel Button */}
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <X className="mr-2 h-4 w-4" />
              {cancelLabel || defaultCancelLabel}
            </Button>
          )}

          {/* Save Draft Button */}
          {onSaveDraft && (
            <Button type="button" variant="secondary" onClick={onSaveDraft} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saveDraftLabel || defaultSaveDraftLabel}
            </Button>
          )}

          {/* Submit Button */}
          <Button type="submit" onClick={onSubmit} disabled={isSubmitting || !isValid}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {submitLabel || defaultSubmitLabel}
          </Button>
        </div>

        {/* Validation Status */}
        {!isValid && (
          <div
            id="form-validation-error"
            className="mt-4 rounded-md border border-red-200 bg-red-50 p-3"
            role="alert"
            aria-live="polite"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  Please fix all validation errors before submitting the form.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submission Status */}
        {isSubmitting && (
          <div
            className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3"
            role="status"
            aria-live="polite"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  {mode === "create" ? "Creating your event..." : "Updating your event..."}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EventFormActions;
