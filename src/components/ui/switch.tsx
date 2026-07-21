"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Simple, reliable toggle Switch — NO radix-ui dependency.
 *
 * Behavior (always LTR regardless of app dir):
 *   - Unchecked (off):  thumb on LEFT,  track gray
 *   - Checked   (on):   thumb on RIGHT, track green (primary)
 *
 * The thumb slides left↔right with a CSS transition.
 * This is a plain <button> with a <span> inside — guaranteed to render.
 */
function Switch({
  checked = false,
  onCheckedChange,
  disabled,
  className,
  size = "default",
  id,
  ...props
}: {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  size?: "sm" | "default"
  id?: string
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "onClick">) {
  const isSm = size === "sm"
  // Track dimensions
  const trackW = isSm ? "w-9" : "w-11"
  const trackH = isSm ? "h-5" : "h-6"
  // Thumb dimensions (smaller than track for padding)
  const thumbW = isSm ? "w-4" : "w-5"
  const thumbH = isSm ? "h-4" : "h-5"
  // Slide distance (track width - thumb width - 2*padding)
  const slideX = isSm ? "translate-x-4" : "translate-x-5"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      dir="ltr"
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        trackW,
        trackH,
        checked ? "bg-primary" : "bg-input",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none inline-block transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200",
          thumbW,
          thumbH,
          checked ? slideX : "translate-x-0"
        )}
      />
    </button>
  )
}

export { Switch }
