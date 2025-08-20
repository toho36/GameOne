"use client";

import React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { DateTimePickerProps } from "@/types/components/event-creation-form.types";

export function DateTimePicker({
  value,
  onChange,
  error,
  disabled = false,
  minDate,
  maxDate,
  placeholder = "Select date and time",
  showTime = false,
  className,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [timeValue, setTimeValue] = React.useState("");

  // Update time value when value changes
  React.useEffect(() => {
    if (value && showTime) {
      setTimeValue(format(value, "HH:mm"));
    }
  }, [value, showTime]);

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }

    let newDate = date;

    // If we have a time value and showTime is enabled, combine date and time
    if (showTime && timeValue) {
      const [hours, minutes] = timeValue.split(":").map(Number);
      newDate = new Date(date);
      newDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    }

    onChange(newDate);
    setIsOpen(false);
  };

  // Handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);

    if (value && newTime) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDate = new Date(value);
      newDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);
      onChange(newDate);
    }
  };

  // Format display value
  const formatDisplayValue = () => {
    if (!value) return "";

    if (showTime) {
      return format(value, "PPp"); // "Jan 1, 2023 at 12:00 PM"
    }

    return format(value, "PP"); // "Jan 1, 2023"
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-destructive"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? formatDisplayValue() : placeholder}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (disabled) return true;
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            initialFocus
          />

          {showTime && (
            <div className="border-t p-3">
              <label className="mb-2 block text-sm font-medium">Time</label>
              <Input
                type="time"
                value={timeValue}
                onChange={handleTimeChange}
                disabled={disabled}
                className="w-full"
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DateTimePicker;
