"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import moment from "moment-jalaali";
import {
  BarChart3,
  Users,
  ShoppingBag,
  Shirt,
  Sparkles,
  Boxes,
  MessageSquare,
  Gift,
  TrendingUp,
  Wallet,
  Calendar,
  PieChart as PieIcon,
} from "lucide-react";
import { reportService, expenseService, type YearlyOverview } from "@/services";
import { PageHeader } from "@/components/common/page-header";
import { PageHelp } from "@/components/common/page-help";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/common/stat-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumber, formatToman, toPersianDigits } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

moment.loadPersian({ dialect: "persian-modern", usePersianDigits: false });

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

// Distinct colors for per-item bar charts (services & garments).
// Each bar gets its own color so items are visually distinguishable.
const BAR_COLORS = [
  "#0d9488", // teal-600
  "#0891b2", // cyan-600
  "#7c3aed", // violet-600
  "#db2777", // pink-600
  "#ea580c", // orange-600
  "#16a34a", // green-600
  "#ca8a04", // yellow-600
  "#dc2626", // red-600
  "#4f46e5", // indigo-600
  "#0284c7", // sky-600
];

// Build a list of recent Jalali years (current year and 4 prior years)
function getJalaliYearOptions(): string[] {
  const currentJalaliYear = Number(moment().format("jYYYY"));
  const options: string[] = [];
  for (let i = 0; i < 5; i++) {
    options.push(String(currentJalaliYear - i));
  }
  return options;
}

type ViewMode = "monthly" | "yearly";

export default function ReportsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [jalaliYear, setJalaliYear] = useState<string>(moment().format("jYYYY"));
  const yearOptions = getJalaliYearOptions();

  const { data: revenue } = useQuery({ queryKey: ["report-revenue"], queryFn: () => reportService.revenue({ preset: "thisMonth" }), enabled: viewMode === "monthly" });
  const { data: expenseStats } = useQuery({ queryKey: ["report-expenses-stats"], queryFn: () => expenseService.stats({ preset: "thisMonth" }), enabled: viewMode === "monthly" });
  const { data: orders } = useQuery({ queryKey: ["report-orders"], queryFn: () => reportService.orders({ preset: "thisMonth" }), enabled: viewMode === "monthly" });
  const { data: customers } = useQuery({ queryKey: ["report-customers"], queryFn: () => reportService.customers({ preset: "thisMonth" }), enabled: viewMode === "monthly" });
  const { data: services } = useQuery({ queryKey: ["report-services"], queryFn: () => reportService.services({ preset: "thisMonth" }), enabled: viewMode === "monthly" });
  const { data: garments } = useQuery({ queryKey: ["report-garments"], queryFn: () => reportService.garments({ preset: "thisMonth" }), enabled: viewMode === "monthly" });
  const { data: inventory } = useQuery({ queryKey: ["report-inventory"], queryFn: () => reportService.inventory(), enabled: viewMode === "monthly" });
  const { data: cashback } = useQuery({ queryKey: ["report-cashback"], queryFn: () => reportService.cashback({ preset: "thisMonth" }), enabled: viewMode === "monthly" });
  const { data: sms } = useQuery({ queryKey: ["report-sms"], queryFn: () => reportService.sms({ preset: "thisMonth" }), enabled: viewMode === "monthly" });
  const { data: yearly } = useQuery<YearlyOverview>({
    queryKey: ["report-yearly", jalaliYear],
    queryFn: () => reportService.yearly(jalaliYear),
    enabled: viewMode === "yearly",
  });

  const revenueData = (revenue as { daily?: Array<{ date: string; jalaliDate: string; revenue: number; count: number }> })?.daily?.map((r) => ({ name: r.jalaliDate, revenue: r.revenue })) || [];
  const expenseDailyData = (expenseStats as { daily?: Array<{ date: string; jalaliDate: string; total: number; count: number }> } | undefined)?.daily?.map((d) => ({ name: d.jalaliDate, total: d.total })) || [];
  const servicesData = (services as { mostUsed?: Array<{ title: string; count: number; revenue: number }> })?.mostUsed?.slice(0, 8) || [];
  const garmentsData = (garments as { mostFrequent?: Array<{ title: string; count: number }> })?.mostFrequent?.slice(0, 8) || [];
  const cashbackStats = cashback as { generated?: number; used?: number; expired?: number } | undefined;
  const smsStats = sms as { sent?: number; failed?: number; remainingMonthly?: number; remainingPackages?: number } | undefined;
  const orderStats = orders as { total?: number; delayed?: number; byStatus?: Array<{ statusId: string; count: number; revenue: number }> } | undefined;
  const customerStats = customers as { newCustomers?: number; repeatCustomers?: number; topCustomers?: Array<{ firstName: string; lastName: string; totalSpending: number }> } | undefined;

  const cashbackPie = [
    { name: "تولید شده", value: cashbackStats?.generated ?? 0 },
    { name: "استفاده شده", value: cashbackStats?.used ?? 0 },
    { name: "منقضی شده", value: cashbackStats?.expired ?? 0 },
  ].filter((d) => d.value > 0);

  // Yearly monthly chart data
  const monthlyData = (yearly?.months || []).map((m) => ({
    name: m.name,
    درآمد: m.revenue,
    هزینه: m.expenses ?? 0,
    سفارشات: m.count,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="گزارشات"
        description={viewMode === "yearly" ? "تحلیل سالانه عملکرد کسب‌وکار" : "نمای کلی عملکرد کسب‌وکار در ماه جاری"}
        actions={
          <div className="flex gap-2">
            <PageHelp
              title="راهنمای گزارشات"
              sections={[
                { title: "گزارش ماهانه", body: "نمای کلی عملکرد خشکشویی در ماه جاری شامل: درآمد، تعداد سفارشات، مشتریان جدید، سفارشات تأخیری و نمودار روزانه درآمد." },
                { title: "تحلیل سالانه", body: "با کلیک روی «تحلیل سالانه»، نمودار درآمد و سفارشات در ۱۲ ماه سال شمسی نمایش داده می‌شود. می‌توانید سال مورد نظر را انتخاب کنید." },
                { title: "خدمات و لباس‌ها", body: "پرطرفدارترین خدمات و لباس‌ها با نمودار میله‌ای رنگی نمایش داده می‌شوند." },
                { title: "گزارش کش‌بک", body: "میزان کش‌بک تولید شده، استفاده شده و منقضی شده در نمودار دایره‌ای." },
                { title: "برترین مشتریان", body: "لیست مشتریانی که بیشترین خرید داشته‌اند." },
              ]}
            />
            <div className="inline-flex rounded-lg border bg-card p-1">
              <Button type="button" size="sm" variant={viewMode === "monthly" ? "default" : "ghost"} onClick={() => setViewMode("monthly")}>
                <Calendar className="size-4 ml-1" />
                ماه جاری
              </Button>
              <Button type="button" size="sm" variant={viewMode === "yearly" ? "default" : "ghost"} onClick={() => setViewMode("yearly")}>
                <BarChart3 className="size-4 ml-1" />
                تحلیل سالانه
              </Button>
            </div>
          </div>
        }
      />

      {/* ============================ YEARLY VIEW ============================ */}
      {viewMode === "yearly" && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="size-5" />
                    تحلیل سالانه
                  </CardTitle>
                  <CardDescription className="mt-1">
                    روند درآمد و سفارشات در ۱۲ ماه سال شمسی
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">سال:</span>
                  <Select value={jalaliYear} onValueChange={setJalaliYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((y) => (
                        <SelectItem key={y} value={y}>{toPersianDigits(y)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Yearly stats */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">درآمد کل سال</p>
                  <p className="mt-1 text-lg font-bold text-primary">{formatToman(yearly?.totalRevenue ?? 0)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">هزینه کل سال</p>
                  <p className="mt-1 text-lg font-bold text-red-600 dark:text-red-400">{formatToman(yearly?.totalExpenses ?? 0)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">سود کل سال</p>
                  {(() => {
                    const profit = yearly?.totalProfit ?? (yearly?.totalRevenue ?? 0);
                    return (
                      <p className={`mt-1 text-lg font-bold ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {formatToman(profit)}
                      </p>
                    );
                  })()}
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">تعداد سفارشات</p>
                  <p className="mt-1 text-lg font-bold">{toPersianDigits(yearly?.totalOrders ?? 0)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">مشتریان جدید</p>
                  <p className="mt-1 text-lg font-bold">{toPersianDigits(yearly?.newCustomers ?? 0)}</p>
                </div>
              </div>

              {/* Monthly chart - vertical bars with two series */}
              {monthlyData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">داده‌ای برای نمایش وجود ندارد</p>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={monthlyData} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id="monthlyRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={1} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => toPersianDigits(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v, name) => (name === "درآمد" || name === "هزینه") ? [formatToman(Number(v)), name as string] : [toPersianDigits(Number(v)), name as string]}
                    />
                    <Legend />
                    <Bar dataKey="درآمد" fill="url(#monthlyRevenue)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="هزینه" fill="var(--destructive)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="سفارشات" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Monthly breakdown table */}
              {yearly && yearly.months.some((m) => m.count > 0 || m.expenses) && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="p-2 text-right">ماه</th>
                        <th className="p-2 text-center">تعداد سفارش</th>
                        <th className="p-2 text-center">درآمد</th>
                        <th className="p-2 text-center">هزینه‌ها</th>
                        <th className="p-2 text-center">سود</th>
                        <th className="p-2 text-center">میانگین سفارش</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearly.months.map((m) => {
                        const expenses = m.expenses ?? 0;
                        const profit = m.profit ?? (m.revenue - expenses);
                        return (
                          <tr key={m.month} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="p-2 font-medium">{m.name}</td>
                            <td className="p-2 text-center">{toPersianDigits(m.count)}</td>
                            <td className="p-2 text-center text-emerald-600 dark:text-emerald-400">{formatToman(m.revenue)}</td>
                            <td className="p-2 text-center text-red-600 dark:text-red-400">{expenses > 0 ? formatToman(expenses) : "—"}</td>
                            <td className={`p-2 text-center font-medium ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{expenses > 0 ? formatToman(profit) : "—"}</td>
                            <td className="p-2 text-center text-muted-foreground">{m.count > 0 ? formatToman(Math.round(m.revenue / m.count)) : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {yearly && (
                      <tfoot>
                        <tr className="border-t-2 font-bold">
                          <td className="p-2">جمع کل</td>
                          <td className="p-2 text-center">{toPersianDigits(yearly.totalOrders)}</td>
                          <td className="p-2 text-center text-emerald-600 dark:text-emerald-400">{formatToman(yearly.totalRevenue)}</td>
                          <td className="p-2 text-center text-red-600 dark:text-red-400">{formatToman(yearly.totalExpenses ?? 0)}</td>
                          <td className={`p-2 text-center ${(yearly.totalProfit ?? yearly.totalRevenue) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{formatToman(yearly.totalProfit ?? yearly.totalRevenue)}</td>
                          <td className="p-2 text-center text-muted-foreground">—</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ============================ MONTHLY VIEW ============================ */}
      {viewMode === "monthly" && (
        <>
          {/* Top stats - current month */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="درآمد ماه" value={formatToman((revenue as { totalRevenue?: number })?.totalRevenue ?? 0)} icon={<Wallet className="size-5" />} />
            <StatCard title="سفارشات ماه" value={formatNumber(orderStats?.total ?? 0)} icon={<ShoppingBag className="size-5" />} />
            <StatCard title="مشتریان جدید" value={formatNumber(customerStats?.newCustomers ?? 0)} icon={<Users className="size-5" />} />
            <StatCard title="سفارشات تأخیر یافته" value={formatNumber(orderStats?.delayed ?? 0)} icon={<TrendingUp className="size-5" />} />
          </div>

          {/* Revenue chart - current month daily */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="size-5" />روند درآمد روزانه (ماه جاری)</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">داده‌ای برای نمایش وجود ندارد</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="r" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [formatToman(Number(v)), "درآمد"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#r)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Expense chart - current month daily */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wallet className="size-5" />روند هزینه روزانه (ماه جاری)</CardTitle>
            </CardHeader>
            <CardContent>
              {expenseDailyData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">داده‌ای برای نمایش وجود ندارد</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={expenseDailyData}>
                    <defs>
                      <linearGradient id="e" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [formatToman(Number(v)), "هزینه"]}
                    />
                    <Area type="monotone" dataKey="total" stroke="var(--destructive)" strokeWidth={2} fill="url(#e)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Services — VERTICAL bar chart with distinct colors per bar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-5" />
                  پرطرفدارترین خدمات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {servicesData.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">داده‌ای موجود نیست</p>
                ) : (
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={servicesData} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="title"
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => toPersianDigits(v)} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                        formatter={(v) => [toPersianDigits(Number(v)), "تعداد"]}
                        cursor={{ fill: "var(--muted)", opacity: 0.2 }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {servicesData.map((_, i) => (
                          <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Garments — VERTICAL bar chart with distinct colors per bar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shirt className="size-5" />
                  پرطرفدارترین لباس‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                {garmentsData.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">داده‌ای موجود نیست</p>
                ) : (
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={garmentsData} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="title"
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => toPersianDigits(v)} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                        formatter={(v) => [toPersianDigits(Number(v)), "تعداد"]}
                        cursor={{ fill: "var(--muted)", opacity: 0.2 }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {garmentsData.map((_, i) => (
                          <Cell key={i} fill={BAR_COLORS[(i + 3) % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Cashback pie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieIcon className="size-5" />
                  گزارش کش‌بک
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cashbackPie.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">داده‌ای موجود نیست</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={cashbackPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {cashbackPie.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top customers */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="size-5" />برترین مشتریان</CardTitle></CardHeader>
              <CardContent>
                {!customerStats?.topCustomers?.length ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">داده‌ای موجود نیست</p>
                ) : (
                  <div className="space-y-2">
                    {customerStats.topCustomers.slice(0, 5).map((c, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{toPersianDigits(i + 1)}</span>
                          <span className="text-sm font-medium">{c.firstName} {c.lastName}</span>
                        </div>
                        <span className="text-sm font-bold">{formatToman(c.totalSpending)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* SMS report */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="size-5" />گزارش پیامک</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4">
                <StatCard title="ارسال شده" value={formatNumber(smsStats?.sent ?? 0)} icon={<MessageSquare className="size-5" />} />
                <StatCard title="ناموفق" value={formatNumber(smsStats?.failed ?? 0)} icon={<MessageSquare className="size-5" />} />
                <StatCard title="باقی‌مانده اشتراک" value={formatNumber(smsStats?.remainingMonthly ?? 0)} icon={<MessageSquare className="size-5" />} />
                <StatCard title="باقی‌مانده بسته" value={formatNumber(smsStats?.remainingPackages ?? 0)} icon={<MessageSquare className="size-5" />} />
              </div>
            </CardContent>
          </Card>

          {/* Inventory report */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Boxes className="size-5" />گزارش انبار</CardTitle></CardHeader>
            <CardContent>
              <CardDescription>اقلام رو به اتمام</CardDescription>
              <div className="mt-3 space-y-2">
                {(inventory as { lowStock?: Array<{ title: string; currentQuantity: number; minimumQuantity: number }> })?.lowStock?.length ? (
                  (inventory as { lowStock: Array<{ title: string; currentQuantity: number; minimumQuantity: number }> }).lowStock.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded border p-3">
                      <span className="text-sm">{item.title}</span>
                      <span className="text-sm text-destructive">{toPersianDigits(item.currentQuantity)} / {toPersianDigits(item.minimumQuantity)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">همه اقلام در موجودی کافی هستند</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
