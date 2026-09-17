import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts in favor of the last one. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a numeric amount as USD currency for display. */
export function formatCurrency(
  value: number,
  opts: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  }).format(value);
}

/** Format a number with grouping separators. */
export function formatNumber(
  value: number,
  opts: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat("en-US", opts).format(value);
}

/** Format a percentage (expects a 0–100 scale by default). */
export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}
