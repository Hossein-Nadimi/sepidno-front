"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { usePWAInstall } from "./usePWAInstall";
import { AndroidInstall } from "./AndroidInstall";
import { IOSInstallGuide } from "./IOSInstallGuide";

/**
 * PWA Install Prompt — shows a bottom sheet with platform-specific
 * installation instructions.
 *
 * Show conditions (all must be true):
 * - The page has been open for at least 5 seconds (don't interrupt immediately)
 * - The user is on a mobile device (Android or iOS)
 * - The app is NOT already installed
 * - The user has NOT dismissed it within the last 30 days
 *
 * Platform-specific behavior:
 * - Android: Uses `beforeinstallprompt` event to trigger the native install dialog
 * - iOS: Shows a visual guide with step-by-step instructions (no native prompt)
 */
export function InstallPrompt() {
  const { canPrompt, platform, dismissPermanently } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!canPrompt || !mounted) return;
    setVisible(true);
  }, [canPrompt, mounted]);

  if (!mounted || !canPrompt) return null;
  if (!visible) return null;

  const handleClose = () => setVisible(false);
  const handleGotIt = () => setVisible(false);
  const handleLater = () => setVisible(false);
  const handleDontShowAgain = () => {
    dismissPermanently();
    setVisible(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="نصب اپلیکیشن"
        className="fixed inset-x-0 bottom-0 z-[101] mx-auto max-w-md animate-in slide-in-from-bottom duration-300"
      >
        <div className="rounded-t-3xl border-t bg-background p-6 pb-8 shadow-2xl">
          {/* Drag handle */}
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute left-4 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="بستن"
          >
            <X className="size-4" />
          </button>

          {/* Platform-specific content — both show manual instructions */}
          {platform === "android" ? (
            <AndroidInstall
              onGotIt={handleGotIt}
              onLater={handleLater}
              onDontShowAgain={handleDontShowAgain}
            />
          ) : platform === "ios" ? (
            <IOSInstallGuide
              onGotIt={handleGotIt}
              onLater={handleLater}
              onDontShowAgain={handleDontShowAgain}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
