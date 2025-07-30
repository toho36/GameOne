import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with clsx and tailwind-merge for better DX
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
