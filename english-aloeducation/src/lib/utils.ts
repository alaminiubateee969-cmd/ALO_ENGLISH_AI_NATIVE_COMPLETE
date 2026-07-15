import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence.
 * Combines `clsx` (conditional classes) and `tailwind-merge`
 * (resolves conflicting Tailwind utilities).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a human-readable unique code with a configurable prefix.
 * Format: `PREFIX-YYYYMMDD-XXXXXX` (random alphanumeric suffix).
 *
 * @example generateCode("LEAD") → "LEAD-20250115-A1B2C3"
 */
export function generateCode(prefix: string, length = 6): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear().toString();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `${prefix.toUpperCase()}-${yyyy}${mm}${dd}-${suffix}`;
}

/**
 * Format a numeric amount as a currency string.
 *
 * @param amount - The amount (number, string, or Decimal-like).
 * @param currency - ISO 4217 currency code, defaults to "BDT".
 */
export function formatCurrency(
  amount: number | string | { toString(): string },
  currency: string = "BDT",
): string {
  const numeric = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(numeric)) return `${currency} 0.00`;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch {
    return `${currency} ${numeric.toFixed(2)}`;
  }
}

/**
 * Format a date string / Date object into a localized date string.
 *
 * @param date - Date or ISO date string.
 * @param opts - Intl.DateTimeFormatOptions override.
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
): string {
  if (date === null || date === undefined) return "—";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", opts).format(d);
}

/**
 * Format a date string / Date object into a localized date+time string.
 */
export function formatDateTime(
  date: Date | string | number | null | undefined,
): string {
  return formatDate(date, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Convert a Prisma Decimal (or any object with a `toString()`)
 * into a plain JavaScript number, safely returning 0 on failure.
 */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const n = Number(String(value));
  return Number.isNaN(n) ? 0 : n;
}
