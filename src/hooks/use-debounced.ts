"use client";

import { useEffect, useState } from "react";

export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export function useDebouncedCallback<T extends (...args: never[]) => void>(callback: T, delay = 300) {
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    const id = setTimeout(() => callback(...args), delay);
    setTimer(id);
  };
}
