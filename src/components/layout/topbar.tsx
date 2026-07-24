"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Moon, Sun, LogOut, ChevronLeft, ExternalLink, Bell, AlertTriangle, PackageCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { authService } from "@/services/auth.service";
import { settingsService, dashboardService } from "@/services";
import { toast } from "react-hot-toast";
import { navItems, adminNavItems } from "@/lib/nav";

// Simple Persian digit converter (avoids importing from utils which is heavy)
function toPersianDigitsSimple(n: number): string {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}
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

  // Fetch dashboard data for notifications (delayed + ready orders)
  const isSuperAdmin = user?.role === "super_admin";
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard-notifications"],
    queryFn: () => dashboardService.get(),
    refetchInterval: 60_000, // refresh every 60s
    enabled: !isSuperAdmin,
  });

  const delayedCount = (dashboardData as { delayed?: number })?.delayed ?? 0;
  const readyCount = (dashboardData as { readyForDelivery?: number })?.readyForDelivery ?? 0;
  const totalNotifications = delayedCount + readyCount;

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

        {/* Notifications bell */}
        {!isSuperAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" title="اعلان‌ها">
                <Bell className="size-5" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {totalNotifications > 9 ? "۹+" : toPersianDigitsSimple(totalNotifications)}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>اعلان‌ها</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {totalNotifications === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  اعلا‌نی وجود ندارد
                </div>
              ) : (
                <>
                  {delayedCount > 0 && (
                    <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/orders?delayed=true")}>
                      <div className="flex w-full items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                          <AlertTriangle className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">سفارشات تأخیر یافته</p>
                          <p className="text-xs text-muted-foreground">{toPersianDigitsSimple(delayedCount)} سفارش</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {readyCount > 0 && (
                    <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/orders")}>
                      <div className="flex w-full items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                          <PackageCheck className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">آماده تحویل</p>
                          <p className="text-xs text-muted-foreground">{toPersianDigitsSimple(readyCount)} سفارش</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

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
