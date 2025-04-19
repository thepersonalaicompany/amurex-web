import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const errorKeywords = ["error", "failed", "invalid", "unauthorized", "not found", "not confirmed"];