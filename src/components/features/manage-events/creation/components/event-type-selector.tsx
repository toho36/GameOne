"use client";

import React from "react";
import { EventType } from "@prisma/client";

import { cn } from "@/lib/utils";
import { EVENT_TYPES } from "@/types/event";

import type { EventTypeSelectorProps } from "@/types/components/event-creation-form.types";

export function EventTypeSelector({
  value,
  onChange,
  error,
  disabled = false,
  showDescriptions = false,
  className,
  ...props
}: EventTypeSelectorProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Object.entries(EVENT_TYPES).map(([eventType, config]) => {
          const isSelected = value === eventType;

          return (
            <button
              key={eventType}
              type="button"
              onClick={() => onChange(eventType as EventType)}
              disabled={disabled}
              className={cn(
                "rounded-lg border p-4 text-left transition-all duration-200",
                "hover:border-primary hover:bg-accent",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isSelected && "border-primary bg-accent",
                error && "border-destructive"
              )}
            >
              <div className="space-y-1">
                <div className="text-sm font-medium">{config.label}</div>

                {showDescriptions && (
                  <div className="text-xs leading-relaxed text-muted-foreground">
                    {config.description}
                  </div>
                )}
              </div>

              {isSelected && (
                <div className="mt-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default EventTypeSelector;
