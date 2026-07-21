/**
 * Platform detection utilities for PWA install prompt.
 */

export type Platform = "android" | "ios" | "desktop";

/**
 * Detects the user's platform based on the user agent.
 */
export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";

  const ua = navigator.userAgent.toLowerCase();

  // iPhone/iPad detection (including iPadOS 13+ which reports as Mac)
  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) return "ios";

  // Android detection
  if (/android/.test(ua)) return "android";

  return "desktop";
}

/**
 * Checks if the app is already installed (running in standalone mode).
 */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;

  // iOS Safari
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) {
    return true;
  }

  // Android Chrome / Desktop PWA
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }

  return false;
}

/**
 * Checks if the platform supports beforeinstallprompt event.
 * (Android Chrome and Edge support it; iOS Safari does not.)
 */
export function supportsBeforeInstallPrompt(): boolean {
  return detectPlatform() === "android" || detectPlatform() === "desktop";
}
