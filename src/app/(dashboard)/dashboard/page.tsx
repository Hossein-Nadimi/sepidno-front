"use client";

import { useQuery } from "@tanstack/react-query";
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
import { dashboardService } from "@/services";
import { useAuthStore } from "@/store/auth";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { CardLoading } from "@/components/common/loading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { formatNumber, formatToman, toPersianDigits } from "@/lib/utils";
import { SuperAdminDashboard } from "@/features/dashboard/super-admin-dashboard";

export default function DashboardPage() {
  const [chart, setChart] = useState<"daily" | "weekly" | "monthly">("daily");
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "super_admin";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard", chart],
    queryFn: () => dashboardService.get({ chart }),
  });

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
        />
        <StatCard
          title="در حال انجام"
          value={formatNumber(data.inProgress)}
          icon={<Clock className="size-5" />}
        />
        <StatCard
          title="آماده تحویل"
          value={formatNumber(data.readyForDelivery)}
          icon={<PackageCheck className="size-5" />}
        />
        <StatCard
          title="تحویل شده"
          value={formatNumber(data.completed)}
          icon={<CheckCircle2 className="size-5" />}
        />
        <StatCard
          title="سفارشات تأخیر یافته"
          value={formatNumber(data.delayed)}
          icon={<AlertTriangle className="size-5" />}
          className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"
        />
        <StatCard
          title="درآمد امروز"
          value={formatToman(data.todayRevenue)}
          icon={<Wallet className="size-5" />}
        />
        <StatCard
          title="درآمد هفته"
          value={formatToman(data.weeklyRevenue)}
          icon={<CalendarRange className="size-5" />}
        />
        <StatCard
          title="درآمد ماه"
          value={formatToman(data.monthlyRevenue)}
          icon={<CalendarDays className="size-5" />}
        />
      </div>

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
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [formatToman(Number(value)), "درآمد"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#revGradient)"
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
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [toPersianDigits(Number(value)), "سفارش"]}
                />
                <Bar dataKey="orders" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: SMS + Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="پیامک باقی‌مانده (اشتراک)"
          value={formatNumber(data.remainingMonthlySms)}
          icon={<MessageSquare className="size-5" />}
          description="سهمیه ماهانه اشتراک"
        />
        <StatCard
          title="پیامک باقی‌مانده (خریداری)"
          value={formatNumber(data.remainingPurchasedSms)}
          icon={<MessageSquare className="size-5" />}
          description="بسته‌های خریداری شده"
        />
        <StatCard
          title="محبوب‌ترین خدمت"
          value={data.topService?.title || "—"}
          icon={<TrendingUp className="size-5" />}
          description={data.topService ? `${formatNumber(data.topService.count)} سفارش` : undefined}
        />
        <StatCard
          title="پرتکرارترین لباس"
          value={data.topGarment?.title || "—"}
          icon={<Shirt className="size-5" />}
          description={data.topGarment ? `${formatNumber(data.topGarment.count)} سفارش` : undefined}
        />
      </div>

      {/* Expenses + Low stock */}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="size-5 text-primary" />
            مشتریان جدید امروز
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatNumber(businessData.newCustomers)}</p>
          <p className="mt-1 text-sm text-muted-foreground">مشتری جدید در امروز ثبت شده است</p>
        </CardContent>
      </Card>
    </div>
  );
}
