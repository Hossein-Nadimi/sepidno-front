"use client";

import { useEffect, useState, useCallback } from "react";
import { detectPlatform, isStandalone, type Platform } from "./platform";

const DISMISS_KEY = "sepidno-pwa-install-dismissed";
const DISMISS_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

export interface PWAInstallState {
  /** Whether the install prompt can be shown to the user */
  canPrompt: boolean;
  /** The user's detected platform */
  platform: Platform;
  /** Whether the app is already installed */
  installed: boolean;
  /** Permanently dismiss (30 days) */
  dismissPermanently: () => void;
}

export function usePWAInstall(): PWAInstallState {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);
    setInstalled(isStandalone());

    // Check localStorage for previous dismissal
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt, 10);
        if (elapsed < DISMISS_DURATION) {
          setDismissed(true);
        } else {
          localStorage.removeItem(DISMISS_KEY);
        }
      }
    } catch {}

    // Listen for appinstalled event (if browser fires it)
    const handleAppInstalled = () => {
      setInstalled(true);
      console.log("[PWA] App installed successfully");
    };
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => window.removeEventListener("appinstalled", handleAppInstalled);
  }, []);

  const dismissPermanently = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setDismissed(true);
  }, []);

  const isMobile = platform === "android" || platform === "ios";
  const canPrompt = isMobile && !installed && !dismissed;

  return {
    canPrompt,
    platform,
    installed,
    dismissPermanently,
  };
}
