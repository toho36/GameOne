"use client";

import React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

import type { FormFieldProps } from "@/components/features/events/creation/event-creation-form.types";

export function FormField({
  label,
  required = false,
  error,
  description,
  children,
  className,
  ...props
}: FormFieldProps) {
  const fieldId = React.useId();

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <Label
        htmlFor={fieldId}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          required && 'after:ml-0.5 after:text-destructive after:content-["*"]'
        )}
      >
        {label}
      </Label>

      <div className="space-y-1">
        <div id={fieldId}>{children}</div>

        {description && <p className="text-xs text-muted-foreground">{description}</p>}

        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default FormField;
