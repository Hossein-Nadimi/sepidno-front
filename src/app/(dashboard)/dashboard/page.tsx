"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { DashboardData } from "@/types";
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  PackageCheck,
  AlertTriangle,
  Wallet,
  CalendarDays,
  CalendarRange,
  MessageSquare,
  TrendingUp,
  Award,
  Shirt,
  ChevronLeft,
  Zap,
  ShoppingCart as ShoppingCartIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import moment from "moment-jalaali";
import { dashboardService, calendarService } from "@/services";
import { useAuthStore } from "@/store/auth";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { CountUp } from "@/components/common/count-up";
import { CardLoading } from "@/components/common/loading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { formatNumber, formatToman, toPersianDigits } from "@/lib/utils";
import { jalaliStringToLongLabel } from "@/lib/jalali";
import { SuperAdminDashboard } from "@/features/dashboard/super-admin-dashboard";

moment.loadPersian({ dialect: "persian-modern", usePersianDigits: false });

export default function DashboardPage() {
  const [chart, setChart] = useState<"daily" | "weekly" | "monthly">("daily");
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "super_admin";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard", chart],
    queryFn: () => dashboardService.get({ chart }),
  });

  // Fetch current month's calendar data for the dashboard widget
  const currentMonth = moment().format("jYYYY/jMM");
  const { data: calendarData } = useQuery({
    queryKey: ["orders-calendar", currentMonth],
    queryFn: () => calendarService.getMonth(currentMonth),
    enabled: !isSuperAdmin,
  });

  // Build the next 7 days from the calendar data
  const upcomingDays = (() => {
    if (!calendarData?.days) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return calendarData.days
      .filter((d) => {
        const dayDate = new Date(d.gregorianDate);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate >= today;
      })
      .slice(0, 7);
  })();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="داشبورد" description="نمای کلی کسب‌وکار شما" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardLoading key={i} />
          ))}
        </div>
        <CardLoading className="h-96" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="داشبورد" />
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            خطا در بارگذاری اطلاعات داشبورد. لطفاً دوباره تلاش کنید.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Type guard: super admin dashboard
  const isSuperAdminData = (d: typeof data): d is import("@/types").SuperAdminDashboardData =>
    "mode" in d && d.mode === "super_admin";

  // Super admin dashboard (no business selected)
  if (isSuperAdminData(data)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="داشبورد سوپر ادمین"
          description="نمای کلی کل پلتفرم — برای مشاهده داشبورد یک بیزینس، از طریق هدر x-business-id انتخاب کنید"
          actions={
            <Tabs value={chart} onValueChange={(v) => setChart(v as typeof chart)}>
              <TabsList>
                <TabsTrigger value="daily">روزانه</TabsTrigger>
                <TabsTrigger value="weekly">هفتگی</TabsTrigger>
                <TabsTrigger value="monthly">ماهانه</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        />
        <SuperAdminDashboard data={data} />
      </div>
    );
  }

  // Business dashboard (normal) — data is narrowed to DashboardData here
  const businessData = data as DashboardData;
  const chartData = businessData.chart.rows.map((r) => ({
    name: r.jalaliKey,
    revenue: r.revenue,
    orders: r.orders,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="داشبورد"
        description="نمای کلی کسب‌وکار شما در یک نگاه"
        actions={
          <Tabs value={chart} onValueChange={(v) => setChart(v as typeof chart)}>
            <TabsList>
              <TabsTrigger value="daily">روزانه</TabsTrigger>
              <TabsTrigger value="weekly">هفتگی</TabsTrigger>
              <TabsTrigger value="monthly">ماهانه</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="سفارشات امروز"
          value={formatNumber(data.todayOrders)}
          icon={<ShoppingCart className="size-5" />}
          variant="blue"
        />
        <StatCard
          title="در حال انجام"
          value={formatNumber(data.inProgress)}
          icon={<Clock className="size-5" />}
          variant="purple"
        />
        <StatCard
          title="آماده تحویل"
          value={formatNumber(data.readyForDelivery)}
          icon={<PackageCheck className="size-5" />}
          variant="emerald"
        />
        <StatCard
          title="تحویل شده"
          value={formatNumber(data.completed)}
          icon={<CheckCircle2 className="size-5" />}
          variant="emerald"
        />
        <StatCard
          title="سفارشات تأخیر یافته"
          value={formatNumber(data.delayed)}
          icon={<AlertTriangle className="size-5" />}
          variant="red"
          href="/orders?delayed=true"
        />
        <StatCard
          title="درآمد امروز"
          value={formatToman(data.todayRevenue)}
          icon={<Wallet className="size-5" />}
          variant="emerald"
        />
        <StatCard
          title="درآمد هفته"
          value={formatToman(data.weeklyRevenue)}
          icon={<CalendarRange className="size-5" />}
          variant="blue"
        />
        <StatCard
          title="درآمد ماه"
          value={formatToman(data.monthlyRevenue)}
          icon={<CalendarDays className="size-5" />}
          variant="blue"
        />
      </div>

      {/* Orders calendar widget — 7 upcoming days.
          Placed RIGHT after the KPI grid so the laundry can see upcoming
          capacity before scrolling down to charts. */}
      {upcomingDays.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" />
                تقویم سفارشات — ۷ روز آینده
              </CardTitle>
              <CardDescription className="mt-1">نمای ظرفیت روزهای پیش‌رو</CardDescription>
            </div>
            <Link
              href="/orders-calendar"
              className="flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
            >
              مشاهده تقویم کامل
              <ChevronLeft className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
              {upcomingDays.map((day) => {
                const maxDaily = calendarData?.summary.maxDailyOrders ?? 0;
                const longLabel = jalaliStringToLongLabel(day.jalaliDate);
                return (
                  <Link
                    key={day.jalaliDate}
                    href="/orders-calendar"
                    className={[
                      "flex flex-col gap-1.5 rounded-lg border p-3 transition hover:scale-[1.01] hover:shadow-md",
                      day.isToday
                        ? "border-emerald-500 ring-1 ring-emerald-500/30"
                        : "border-border",
                      day.isFull
                        ? "bg-red-50 dark:bg-red-950/20"
                        : day.orderCount > 0
                          ? "bg-emerald-50 dark:bg-emerald-950/20"
                          : "bg-card",
                    ].join(" ")}
                  >
                    {/* Row 1: weekday + day + month name (full) */}
                    <div className="flex items-center gap-1.5 text-sm font-bold">
                      {day.isFull && <AlertTriangle className="size-3.5 text-red-500" />}
                      <span className={day.isFull ? "text-red-700 dark:text-red-400" : ""}>{longLabel}</span>
                    </div>

                    {/* Row 2: order count / max daily */}
                    <div className="flex items-center gap-1.5 text-sm">
                      <ShoppingCartIcon className="size-3.5 text-muted-foreground" />
                      <span className="font-semibold">{toPersianDigits(day.orderCount)} سفارش</span>
                      {maxDaily > 0 && (
                        <span className="text-muted-foreground">
                          / {toPersianDigits(maxDaily)}
                        </span>
                      )}
                      {day.urgentCount > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                          <Zap className="size-3" />
                          {toPersianDigits(day.urgentCount)}
                        </span>
                      )}
                    </div>

                    {/* Row 3: revenue (bigger font) */}
                    {day.orderCount > 0 ? (
                      <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        {formatToman(day.totalRevenue)}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">بدون سفارش</div>
                    )}
                  </Link>
                );
              })}
            </div>
            {(calendarData?.summary.maxDailyOrders ?? 0) > 0 && (
              <div className="mt-3 text-xs text-muted-foreground">
                حداکثر ظرفیت روزانه: {toPersianDigits(calendarData!.summary.maxDailyOrders)} سفارش —
                روزهای پر با رنگ قرمز نشان داده می‌شوند.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>نمودار درآمد</CardTitle>
              <CardDescription>روند درآمد در بازه انتخابی</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => toPersianDigits(value.toLocaleString("en-US"))}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value) => [formatToman(Number(value)), "درآمد"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={3}
                  fill="url(#revGradient)"
                  dot={{ fill: "var(--chart-1)", r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نمودار سفارشات</CardTitle>
            <CardDescription>تعداد سفارشات در بازه انتخابی</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="ordGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value) => [toPersianDigits(Number(value)), "سفارش"]}
                />
                <Bar dataKey="orders" fill="url(#ordGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom section: SMS + Top stats + Expenses + New customers — all in a balanced grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* SMS usage with progress bar */}
        {(() => {
          const subRemaining = data.remainingMonthlySms ?? 0;
          const subTotal = (data as { monthlySmsQuota?: number }).monthlySmsQuota ?? 0;
          const subUsed = Math.max(0, subTotal - subRemaining);
          const subPercent = subTotal > 0 ? Math.round((subUsed / subTotal) * 100) : 0;
          const purchasedRemaining = data.remainingPurchasedSms ?? 0;
          const totalRemaining = subRemaining + purchasedRemaining;

          return (
            <Card className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">سهمیه پیامک</p>
                    <p className="text-2xl font-bold">
                      {typeof totalRemaining === "number" ? <CountUp value={totalRemaining} /> : totalRemaining}
                      <span className="text-sm font-normal text-muted-foreground"> باقی‌مانده</span>
                    </p>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                    <MessageSquare className="size-5" />
                  </div>
                </div>

                {/* Subscription quota progress bar */}
                {subTotal > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">اشتراک ماهانه</span>
                      <span className="font-medium">
                        {toPersianDigits(subRemaining)} از {toPersianDigits(subTotal)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          subPercent > 80 ? "bg-red-500" : subPercent > 50 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(subPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Purchased packages badge */}
                {purchasedRemaining > 0 && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-blue-200/50 bg-blue-50/50 px-3 py-2 text-xs dark:border-blue-900/30 dark:bg-blue-950/10">
                    <span className="text-muted-foreground">بسته‌های خریداری شده</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {toPersianDigits(purchasedRemaining)} پیامک
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Top service */}
        <StatCard
          title="محبوب‌ترین خدمت"
          value={data.topService?.title || "—"}
          icon={<TrendingUp className="size-5" />}
          description={data.topService ? `${formatNumber(data.topService.count)} سفارش` : undefined}
          variant="purple"
        />

        {/* Top garment */}
        <StatCard
          title="پرتکرارترین لباس"
          value={data.topGarment?.title || "—"}
          icon={<Shirt className="size-5" />}
          description={data.topGarment ? `${formatNumber(data.topGarment.count)} سفارش` : undefined}
          variant="blue"
        />

        {/* New customers */}
        <StatCard
          title="مشتریان جدید امروز"
          value={formatNumber(businessData.newCustomers)}
          icon={<Award className="size-5" />}
          variant="emerald"
        />
      </div>

      {/* Expenses + Low stock — side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        {typeof businessData.monthlyExpenses === "number" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="size-5 text-primary" />
                هزینه‌های این ماه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{formatToman(businessData.monthlyExpenses)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                سود خالص: {formatToman(Math.max(0, businessData.monthlyRevenue - businessData.monthlyExpenses))}
              </p>
            </CardContent>
          </Card>
        )}

        {businessData.lowStockItems && businessData.lowStockItems.length > 0 && (
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="size-5" />
                هشدار موجودی انبار
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {businessData.lowStockItems.map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded border p-2">
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-sm text-amber-600">
                    {toPersianDigits(item.currentQuantity)} {item.unit} (حداقل: {toPersianDigits(item.minimumQuantity)})
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
