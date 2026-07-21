"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Moon, Sun, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "خانه" },
  { href: "/features", label: "امکانات" },
  { href: "/pricing", label: "قیمت‌گذاری" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس" },
  { href: "/faq", label: "سوالات متداول" },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  // Use a mounted flag to prevent hydration mismatch with auth state
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Read auth state directly from localStorage AFTER mount
    // This prevents SSR/client hydration mismatch
    try {
      const raw = localStorage.getItem("sepidno-auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        setLoggedIn(!!parsed?.state?.isAuthenticated);
      }
    } catch {}
  }, []);

  // Always render the same content on server and first client render
  // Only show auth-dependent UI after mount
  const showAuth = mounted;
  const isAuthenticated = showAuth ? loggedIn : false;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="سپیدنو" width={36} height={36} priority />
          <span className="text-lg font-bold">سپیدنو</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hidden md:flex"
          >
            <Sun className="size-5 dark:hidden" />
            <Moon className="hidden size-5 dark:block" />
          </Button>
          {showAuth && isAuthenticated ? (
            <Button asChild className="hidden md:inline-flex">
              <Link href="/dashboard">
                <LayoutDashboard className="size-4 ml-1" />
                پنل مدیریت
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" className="hidden md:inline-flex">
                <Link href="/login">ورود</Link>
              </Button>
              <Button asChild className="hidden md:inline-flex">
                <Link href="/login">شروع رایگان</Link>
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-background md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  pathname === link.href
                    ? "bg-secondary"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {showAuth && isAuthenticated ? (
                <Button asChild className="flex-1">
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    <LayoutDashboard className="size-4 ml-1" />
                    پنل مدیریت
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/login" onClick={() => setOpen(false)}>ورود</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href="/login" onClick={() => setOpen(false)}>شروع رایگان</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
