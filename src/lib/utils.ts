import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a date string (YYYY-MM-DD) as a local date, avoiding timezone issues.
 * JavaScript's new Date('2026-01-10') parses as midnight UTC, which can
 * rollback to the previous day in negative UTC offsets (e.g., Brazil UTC-3).
 * This function appends 'T12:00:00' to force midday, preventing rollback.
 */
export function parseLocalDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date(NaN); // Invalid date for null/undefined
  // If it's just a date (YYYY-MM-DD), add T12:00:00 to avoid timezone rollback
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T12:00:00');
  }
  // Otherwise, parse normally (it might already have time component)
  return new Date(dateStr);
}

