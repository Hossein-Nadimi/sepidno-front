"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { toPersianDigits, toEnglishDigits, cn } from "@/lib/utils";

/**
 * Price input with thousand separators.
 * Supports Persian (۰-۹), Arabic-Indic (٠-٩), and English (0-9) digits.
 *
 * Implementation notes:
 * - The displayed value is always formatted with Persian digits + comma
 *   separators (e.g. "۱,۲۳۴,۵۶۷").
 * - Internally we keep the value as an English-numeric string for parsing,
 *   and convert to Persian only at display time.
 * - We preserve cursor position when reformatting (best-effort) — this fixes
 *   the previous bug where typing a Persian digit mid-string would cause the
 *   cursor to jump to the end and the separator to "not appear".
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
  const inputRef = useRef<HTMLInputElement>(null);
  // Track cursor position so we can restore it after reformatting.
  const cursorPosRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === 0) {
      setDisplay("");
    } else {
      setDisplay(toPersianDigits(value.toLocaleString("en-US")));
    }
  }, [value]);

  // Restore cursor position after React re-renders.
  useEffect(() => {
    if (cursorPosRef.current !== null && inputRef.current) {
      const len = inputRef.current.value.length;
      const pos = Math.min(cursorPosRef.current, len);
      inputRef.current.setSelectionRange(pos, pos);
      cursorPosRef.current = null;
    }
  }, [display]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const rawValue = el.value;
    // Remember cursor position (in terms of the *new* raw input)
    const cursorAt = el.selectionStart ?? rawValue.length;

    // Convert ALL Persian/Arabic digits to English FIRST, then strip non-digits.
    // This is more reliable than trying to do it in one regex pass.
    const englishOnly = toEnglishDigits(rawValue);
    const digitsOnly = englishOnly.replace(/\D/g, "");

    const num = digitsOnly === "" ? 0 : parseInt(digitsOnly, 10);
    if (Number.isNaN(num)) return;
    if (num < min) return;

    // Format the new display value
    const newDisplay = digitsOnly === "" ? "" : toPersianDigits(num.toLocaleString("en-US"));

    // Calculate the new cursor position: count how many DIGITS are before
    // the cursor in the raw input, then find that position in the new display.
    // Count digits before cursor (Persian/Arabic/English all included)
    const beforeCursor = rawValue.slice(0, cursorAt);
    const digitsBeforeCursor = toEnglishDigits(beforeCursor).replace(/\D/g, "").length;

    // Now find the position in newDisplay where we've seen `digitsBeforeCursor` digits.
    let newPos = 0;
    let digitsSeen = 0;
    for (let i = 0; i < newDisplay.length; i++) {
      if (/\d/.test(toEnglishDigits(newDisplay[i]))) {
        if (digitsSeen === digitsBeforeCursor) {
          newPos = i;
          break;
        }
        digitsSeen++;
      }
      newPos = i + 1;
    }

    cursorPosRef.current = newPos;
    setDisplay(newDisplay);
    onChange(num);
  }

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      dir="rtl"
      value={display}
      onChange={handleChange}
      placeholder={placeholder || "۰"}
      autoComplete="off"
      className={cn("text-right font-medium", className)}
    />
  );
}
