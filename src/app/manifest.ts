import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سپیدنو | سامانه مدیریت خشکشویی و لباسشویی",
    short_name: "سپیدنو",
    description: "سامانه مدیریت یکپارچه خشکشویی و لباسشویی برای کسب‌وکارهای ایرانی",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "fullscreen", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#0d9488",
    dir: "rtl",
    lang: "fa",
    categories: ["business", "productivity", "utilities"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "داشبورد",
        short_name: "داشبورد",
        url: "/dashboard",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "سفارشات",
        short_name: "سفارشات",
        url: "/orders",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "مشتریان",
        short_name: "مشتریان",
        url: "/customers",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
