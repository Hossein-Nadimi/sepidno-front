import type { NextConfig } from "next";

/**
 * Resolve the API origin for the /uploads/* rewrite proxy.
 * Same logic as src/lib/api.ts resolveBaseUrl().
 */
function resolveApiOrigin(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/i, "").replace(/\/$/, "");
  }
  // Production without env var → same-origin (reverse proxy)
  if (process.env.NODE_ENV === "production") {
    return ""; // empty = same origin
  }
  // Dev fallback
  return "http://localhost:5000";
}

const API_ORIGIN = resolveApiOrigin();

const nextConfig: NextConfig = {
  // allowedDevOrigins: ["192.168.1.170"],
  // Proxy /uploads/* requests to the backend server so images load same-origin.
  async rewrites() {
    if (!API_ORIGIN) return []; // same-origin in production
    return [
      {
        source: "/uploads/:path*",
        destination: `${API_ORIGIN}/uploads/:path*`,
      },
    ];
  },
  // Set correct headers for service worker and manifest
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
        ],
      },
    ];
  },
};

export default nextConfig;
