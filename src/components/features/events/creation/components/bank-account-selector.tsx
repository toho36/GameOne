"use client";

import React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { BankAccountSelectorProps } from "@/types/components/event-creation-form.types";

export function BankAccountSelector({
  value,
  onChange,
  options,
  error,
  disabled = false,
  placeholder = "Select a bank account",
  isLoading = false,
  className,
}: BankAccountSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedAccount = options.find((account) => account.id === value);

  return (
    <div className={cn("space-y-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !selectedAccount && "text-muted-foreground",
              error && "border-destructive"
            )}
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading accounts...
              </>
            ) : selectedAccount ? (
              <div className="flex flex-col items-start">
                <span className="font-medium">{selectedAccount.name}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedAccount.bankName} • {selectedAccount.accountNumber}
                </span>
              </div>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search bank accounts..." />
            <CommandEmpty>{isLoading ? "Loading..." : "No bank accounts found."}</CommandEmpty>

            <CommandGroup>
              {options.map((account) => (
                <CommandItem
                  key={account.id}
                  onSelect={() => {
                    onChange(account.id === value ? undefined : account.id);
                    setOpen(false);
                  }}
                  className="flex flex-col items-start"
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{account.name}</span>
                        {account.isDefault && (
                          <span className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {account.bankName} • {account.accountNumber}
                      </span>
                    </div>

                    <Check
                      className={cn(
                        "ml-2 h-4 w-4 shrink-0",
                        value === account.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {!isLoading && options.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No bank accounts available. Please add a bank account first.
        </p>
      )}
    </div>
  );
}

export default BankAccountSelector;
