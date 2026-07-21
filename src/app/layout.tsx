import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/providers";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sepidno.ir"),
  title: {
    default: "سپیدنو | سامانه مدیریت خشکشویی و لباسشویی",
    template: "%s | سپیدنو",
  },
  description:
    "سامانه مدیریت یکپارچه خشکشویی برای کسب‌وکارهای ایرانی. مدیریت سفارشات، مشتریان، قیمت‌گذاری، انبار، گزارش‌گیری و پیامک.",
  keywords: [
    "خشکشویی",
    "لباسشویی",
    "مدیریت خشکشویی",
    "نرم‌افزار خشکشویی",
    "سامانه خشکشویی",
    "سپیدنو",
  ],
  authors: [{ name: "سپیدنو" }],
  manifest: "/manifest.webmanifest",
  applicationName: "سپیدنو",
  appleWebApp: {
    capable: true,
    title: "سپیدنو",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-256.png", sizes: "256x256", type: "image/png" },
      { url: "/icon-384.png", sizes: "384x384", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon-32.png"],
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "https://sepidno.ir",
    siteName: "سپیدنو",
    title: "سپیدنو | سامانه مدیریت خشکشویی و لباسشویی",
    description: "سامانه مدیریت یکپارچه خشکشویی برای کسب‌وکارهای ایرانی",
  },
  twitter: {
    card: "summary_large_image",
    title: "سپیدنو | سامانه مدیریت خشکشویی",
    description: "سامانه مدیریت یکپارچه خشکشویی برای کسب‌وکارهای ایرانی",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://sepidno.ir" },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "سپیدنو",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "IRR" },
              description: "سامانه مدیریت یکپارچه خشکشویی و لباسشویی",
            }),
          }}
        />
        {/* Apple touch icon (extra, for older iOS) */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Apple splash screen compatibility */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="سپیدنو" />
      </head>
      <body className={`${vazirmatn.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
