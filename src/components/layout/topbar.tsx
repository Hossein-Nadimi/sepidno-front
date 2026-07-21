"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Moon, Sun, LogOut, ChevronLeft, ExternalLink } from "lucide-react";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { authService } from "@/services/auth.service";
import { settingsService } from "@/services";
import { toast } from "react-hot-toast";
import { navItems, adminNavItems } from "@/lib/nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Map English URL segments to Persian labels for breadcrumbs
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "داشبورد",
  orders: "سفارشات",
  customers: "مشتریان",
  "laundry-pricing": "قیمت‌گذاری",
  inventory: "انبار",
  movements: "حرکت‌ها",
  expenses: "هزینه‌ها",
  reports: "گزارشات",
  sms: "پیامک",
  subscription: "اشتراک",
  settings: "تنظیمات",
  "setup-business": "اطلاعات خشکشویی",
  tickets: "تیکت‌ها",
  admin: "مدیریت",
  businesses: "بیزینس‌ها",
  users: "کاربران",
  plans: "پلن‌ها",
  "sms-packages": "بسته‌های پیامک",
  catalogs: "کاتالوگ‌ها",
  subscriptions: "اشتراک‌ها",
  edit: "ویرایش",
  new: "جدید",
};

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const logout = useAuthStore((s) => s.logout);

  // Fetch business settings to get ownerName
  const { data: businessSettings } = useQuery({
    queryKey: ["business-settings"],
    queryFn: () => settingsService.get().catch(() => null),
  });

  // Build breadcrumb
  const segments = pathname.split("/").filter(Boolean);
  const allNavItems = [...navItems, ...adminNavItems];
  const crumbs = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const navItem = allNavItems.find((n) => n.href === href);
    const title = navItem?.title || SEGMENT_LABELS[seg] || (seg.length === 24 ? "جزئیات" : seg);
    return { title, href };
  });

  // Display name: ownerName from settings, or user's name
  const displayName = businessSettings?.ownerName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.phoneNumber || "";

  async function handleLogout() {
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } catch {
      // ignore
    } finally {
      logout();
      toast.success("با موفقیت خارج شدید");
      router.replace("/login");
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="size-5" />
      </Button>

      {/* Breadcrumb */}
      <nav className="hidden items-center gap-1 text-sm sm:flex">
        <button onClick={() => router.push("/dashboard")} className="text-muted-foreground hover:text-foreground">
          خانه
        </button>
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1">
            <ChevronLeft className="size-4 text-muted-foreground" />
            <button
              onClick={() => router.push(c.href)}
              className={i === crumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}
            >
              {c.title}
            </button>
          </span>
        ))}
      </nav>

      <div className="mr-auto flex items-center gap-2">
        {/* View website */}
        <Button asChild variant="ghost" size="sm" title="مشاهده وب‌سایت">
          <Link href="/">
            <ExternalLink className="size-4 ml-1" />
            <span className="hidden sm:inline">وب‌سایت</span>
          </Link>
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="تغییر تم"
        >
          <Sun className="size-5 dark:hidden" />
          <Moon className="hidden size-5 dark:block" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                {displayName?.[0] || "U"}
              </div>
              <span className="hidden text-sm font-medium sm:block">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground" dir="ltr">
                {user?.phoneNumber}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="size-4 ml-2" />
              خروج از حساب
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
