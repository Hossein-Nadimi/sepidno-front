"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Animated counter that smoothly counts up to the target value.
 * Uses requestAnimationFrame for smooth 60fps animation.
 *
 * @param value The target number to count up to
 * @param duration Animation duration in ms (default: 1000)
 * @param format Optional formatter function (e.g. for toman, separator, etc.)
 */
export function CountUp({
  value,
  duration = 1000,
  format,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const startTime = performance.now();

    // If value hasn't changed, don't animate
    if (start === end) {
      setDisplay(end);
      return;
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(end);
        prevValue.current = end;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{format ? format(display) : display}</>;
}
