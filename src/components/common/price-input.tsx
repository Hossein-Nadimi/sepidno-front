"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { toPersianDigits } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Price input with thousand separators.
 * - Shows formatted number with separators (e.g. 1,490,000) while typing
 * - Returns raw number to parent via onChange
 * - Works correctly in Firefox (which doesn't support inputmode separators)
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
      setDisplay(value.toLocaleString("en-US"));
    }
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Remove all non-digit characters
    const raw = e.target.value.replace(/[^\d]/g, "");
    const num = raw === "" ? 0 : parseInt(raw, 10);
    if (num < min) return;
    setDisplay(raw === "" ? "" : num.toLocaleString("en-US"));
    onChange(num);
  }

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="numeric"
        dir="ltr"
        value={display}
        onChange={handleChange}
        placeholder={placeholder || "0"}
        className={cn("text-left", className)}
      />
      {display && (
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {toPersianDigits(value.toLocaleString("fa-IR"))}
        </span>
      )}
    </div>
  );
}
