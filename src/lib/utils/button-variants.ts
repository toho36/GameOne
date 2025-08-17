import { cn } from "@/lib/utils";

export interface ButtonVariantOptions {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string | undefined;
}

/**
 * Generates consistent button classes for various button components
 * This utility prevents code duplication and ensures consistent styling
 */
export function getButtonClasses({
  variant = "default",
  size = "md",
  className,
}: ButtonVariantOptions = {}) {
  return cn(
    // Base button styles
    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",

    // Variant styles
    {
      "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90": variant === "default",
      "border border-input hover:bg-accent hover:text-accent-foreground": variant === "outline",
      "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
    },

    // Size styles
    {
      "h-8 px-3 text-xs": size === "sm",
      "h-10 px-4 py-2": size === "md",
      "h-12 px-6 py-3 text-base": size === "lg",
    },

    className
  );
}

/**
 * Gets loading button classes with disabled styling
 */
export function getLoadingButtonClasses({
  variant = "default",
  size = "md",
  className,
}: ButtonVariantOptions = {}) {
  return cn(getButtonClasses({ variant, size }), "cursor-not-allowed opacity-60", className);
}

/**
 * Container classes for button groups
 */
export function getButtonContainerClasses(layout: "horizontal" | "vertical" = "horizontal") {
  return cn("flex gap-3", {
    "flex-row": layout === "horizontal",
    "flex-col": layout === "vertical",
  });
}
