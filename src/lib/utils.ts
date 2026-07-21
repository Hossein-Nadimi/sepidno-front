import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Convert English digits in a string to Persian digits. */
export function toPersianDigits(input: string | number | null | undefined): string {
  if (input == null) return "";
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/** Convert Persian/Arabic digits in a string to English digits. */
export function toEnglishDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Format a number as Persian currency (Toman). */
export function formatToman(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "۰ تومان";
  return toPersianDigits(Math.round(value).toLocaleString("en-US")) + " تومان";
}

/** Format a number with thousand separators in Persian. */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "۰";
  return toPersianDigits(Math.round(value).toLocaleString("en-US"));
}

/** Truncate text with ellipsis. */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "…";
}

/** Build query string from an object, skipping empty values. */
export function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Resolve an upload/image URL stored in the API to a URL that the browser
 * can load without cross-origin issues.
 *
 * Strategy:
 *  - Absolute URLs pointing to the API server's /uploads/ path are converted
 *    to RELATIVE paths (/uploads/...) so they load through the Next.js dev
 *    server's rewrite proxy (configured in next.config.ts). This avoids
 *    cross-origin image loading problems entirely.
 *  - Other absolute URLs (http://other-host/...) are returned as-is.
 *  - Relative paths (/uploads/...) are returned as-is (already proxied).
 *  - Data URLs are returned as-is.
 *
 * Example:
 *   "http://localhost:5000/uploads/logo-123.jpg" → "/uploads/logo-123.jpg"
 *   "/uploads/logo-123.jpg"                      → "/uploads/logo-123.jpg"
 *   "https://cdn.example.com/img.png"             → unchanged
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  // Data URL — return as-is
  if (trimmed.startsWith("data:")) return trimmed;
  // Protocol-relative URL — return as-is
  if (trimmed.startsWith("//")) return trimmed;
  // Absolute URL — check if it points to the API server's /uploads/ path
  if (/^https?:\/\//i.test(trimmed)) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const apiOrigin = apiBase.replace(/\/api\/?$/i, "").replace(/\/$/, "");
    // If the URL starts with the API origin, strip the origin to make it relative
    if (trimmed.startsWith(apiOrigin + "/")) {
      return trimmed.slice(apiOrigin.length); // e.g. "/uploads/logo-123.jpg"
    }
    // Also check common localhost variants
    if (/^https?:\/\/localhost:5000\//i.test(trimmed)) {
      try {
        const u = new URL(trimmed);
        return u.pathname + u.search;
      } catch {
        return trimmed;
      }
    }
    // Other absolute URL — return as-is (e.g. external CDN)
    return trimmed;
  }
  // Relative path — return as-is (will be proxied by Next.js rewrites)
  return trimmed;
}
