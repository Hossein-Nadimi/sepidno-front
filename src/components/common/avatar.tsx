"use client";

import { cn } from "@/lib/utils";

const COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  "bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400",
  "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
];

/**
 * Generates a consistent color for a given string (e.g. customer name).
 * The same name always gets the same color.
 */
function getColorForString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface AvatarProps {
  /** The full name to extract initials from. */
  name: string;
  /** Avatar size in pixels (default: 36). */
  size?: number;
  className?: string;
}

export function Avatar({ name, size = 36, className }: AvatarProps) {
  const trimmed = (name || "").trim();
  const initials = trimmed
    ? trimmed
        .split(/\s+/)
        .map((w) => w.charAt(0))
        .slice(0, 2)
        .join("")
    : "؟";
  const color = getColorForString(trimmed || "default");

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        color,
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}
