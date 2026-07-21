"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on the client side.
 *
 * IMPORTANT: Only active in PRODUCTION builds.
 * In development, the SW causes infinite reload loops because:
 *  1. Next.js dev server (Turbopack) hot-reloads modules
 *  2. SW intercepts the hot-reload requests and serves stale cached responses
 *  3. This causes the page to reload, which triggers another SW update, etc.
 *
 * For PWA testing on mobile, use `npm run build && npm run start`.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        console.log("[PWA] Service Worker registered:", registration.scope);

        // If a new SW is waiting, force it to activate
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // Listen for new waiting SW
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      } catch (err) {
        console.warn("[PWA] SW registration failed:", err);
      }
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
