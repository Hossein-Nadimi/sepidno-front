"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { toPersianDigits, cn } from "@/lib/utils";

/**
 * Price input with thousand separators.
 *
 * - Digits are entered RTL (right-to-left) so they appear from the right
 *   side of the field — natural for Persian users.
 * - The formatted value itself is the input value (no separate overlay),
 *   so there is no overlap between what the user types and the formatted display.
 * - Returns the raw number to the parent via onChange.
 */
export function PriceInput({
  value,
  onChange,
  placeholder,
  className,
  min = 0,
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  min?: number;
}) {
  const [display, setDisplay] = useState("");

  // Sync display from external value changes
  useEffect(() => {
    if (value === 0) {
      setDisplay("");
    } else {
      // Show Persian digits with thousands separator
      setDisplay(toPersianDigits(value.toLocaleString("en-US")));
    }
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Strip anything that isn't a Persian or English digit
    const raw = e.target.value.replace(/[^\d۰-۹]/g, "");
    // Convert Persian digits to English for parsing
    const normalized = raw.replace(/[۰-۹]/g, (d) =>
      String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)),
    );
    const num = normalized === "" ? 0 : parseInt(normalized, 10);
    if (num < min) return;
    setDisplay(normalized === "" ? "" : toPersianDigits(num.toLocaleString("en-US")));
    onChange(num);
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      dir="rtl"
      value={display}
      onChange={handleChange}
      placeholder={placeholder || "۰"}
      className={cn("text-right font-medium", className)}
    />
  );
}
