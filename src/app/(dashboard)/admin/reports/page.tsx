"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Building2, Users, ShoppingBag, Wallet, MessageSquare, Gift,
  CreditCard, TrendingUp, AlertTriangle, Crown, Package, BookOpen,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { adminReportService } from "@/services";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, formatToman, toPersianDigits } from "@/lib/utils";

export default function AdminReportsPage() {
  const { data: overview } = useQuery({
    queryKey: ["admin-report-overview"],
    queryFn: () => adminReportService.overview({ preset: "thisMonth" }),
  });
  const { data: laundryRevenue } = useQuery({
    queryKey: ["admin-report-laundry-revenue"],
    queryFn: () => adminReportService.laundryRevenue({ preset: "thisMonth" }),
  });
  const { data: laundryOrders } = useQuery({
    queryKey: ["admin-report-laundry-orders"],
    queryFn: () => adminReportService.laundryOrders({ preset: "thisMonth" }),
  });
  const { data: subscriptions } = useQuery({
    queryKey: ["admin-report-subscriptions"],
    queryFn: () => adminReportService.subscriptions(),
  });
  const { data: catalogCounts } = useQuery({
    queryKey: ["admin-report-catalogs"],
    queryFn: () => adminReportService.catalogs(),
  });
  const { data: inventoryStats } = useQuery({
    queryKey: ["admin-report-inventory"],
    queryFn: () => adminReportService.inventory(),
  });

  const ov = overview as {
    totalBusinesses?: number; activeBusinesses?: number; pendingBusinesses?: number; suspendedBusinesses?: number;
    newBusinessesThisMonth?: number; totalUsers?: number; totalCustomers?: number; totalOrders?: number; todayOrders?: number;
    totalRevenue?: number; todayRevenue?: number; monthlyRevenue?: number;
    totalSmsSent?: number; totalSmsFailed?: number;
    totalCashbackIssued?: number; totalCashbackUsed?: number;
    activeSubscriptions?: number; expiringSubscriptions?: number;
    totalSubscriptionRevenue?: number; totalSmsPackageRevenue?: number; totalSmsPackagesSold?: number;
  } | undefined;

  const rev = laundryRevenue as {
    totalRevenue?: number; totalOrders?: number; averageOrderValue?: number;
    daily?: Array<{ date: string; jalaliDate: string; revenue: number; count: number }>;
    byBusiness?: Array<{ businessId: string; businessName: string; revenue: number; orders: number }>;
  } | undefined;

  const ord = laundryOrders as {
    totalOrders?: number; delayedOrders?: number;
    byStatus?: Array<{ statusId: string; statusTitle: string; count: number; revenue: number }>;
  } | undefined;

  const subs = subscriptions as {
    plans?: Array<{ planId: string; planName: string; activeCount: number; totalRevenue: number }>;
    recentPurchases?: Array<{ businessName: string; planName: string; startDate: string; expireDate: string; status: string }>;
    smsPackagesSold?: Array<{ packageTitle: string; count: number; revenue: number }>;
  } | undefined;

  const cats = catalogCounts as {
    garmentTypes?: number; serviceTypes?: number; fabricTypes?: number; colors?: number;
    inventoryItemTypes?: number; orderStatuses?: number; smsTemplates?: number; receiptTemplates?: number;
  } | undefined;

  const inv = inventoryStats as { totalItems?: number; lowStockItems?: number; totalStockValue?: number } | undefined;

  const chartData = (rev?.daily || []).map((r) => ({ name: r.jalaliDate, revenue: r.revenue, orders: r.count }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="گزارشات سامانه"
        description="نمای کلی عملکرد کل پلتفرم سپیدنو"
      />

      {/* System KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="کل بیزینس‌ها" value={formatNumber(ov?.totalBusinesses ?? 0)} icon={<Building2 className="size-5" />}
          description={`${formatNumber(ov?.activeBusinesses ?? 0)} فعال · ${formatNumber(ov?.pendingBusinesses ?? 0)} در انتظار`} />
        <StatCard title="بیزینس‌های جدید این ماه" value={formatNumber(ov?.newBusinessesThisMonth ?? 0)} icon={<TrendingUp className="size-5" />} />
        <StatCard title="کل کاربران" value={formatNumber(ov?.totalUsers ?? 0)} icon={<Users className="size-5" />} />
        <StatCard title="کل مشتریان" value={formatNumber(ov?.totalCustomers ?? 0)} icon={<Users className="size-5" />} />
        <StatCard title="درآمد کل پلتفرم" value={formatToman(ov?.totalRevenue ?? 0)} icon={<Wallet className="size-5" />} />
        <StatCard title="درآمد ماه" value={formatToman(ov?.monthlyRevenue ?? 0)} icon={<Wallet className="size-5" />} />
        <StatCard title="درآمد اشتراک‌ها" value={formatToman(ov?.totalSubscriptionRevenue ?? 0)} icon={<CreditCard className="size-5" />} />
        <StatCard title="درآمد بسته‌های پیامک" value={formatToman(ov?.totalSmsPackageRevenue ?? 0)} icon={<Package className="size-5" />} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>روند درآمد خشکشویی‌ها</CardTitle>
            <CardDescription>درآمد کل پلتفرم در ماه جاری</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">داده‌ای موجود نیست</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#adminRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>وضعیت سفارشات خشکشویی‌ها</CardTitle>
            <CardDescription>توزیع سفارشات بر اساس وضعیت</CardDescription>
          </CardHeader>
          <CardContent>
            {!ord?.byStatus?.length ? (
              <p className="py-10 text-center text-sm text-muted-foreground">داده‌ای موجود نیست</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ord.byStatus.map((s) => ({ name: s.statusTitle, count: s.count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [toPersianDigits(Number(v)), "سفارش"]}
                  />
                  <Bar dataKey="count" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SMS + Cashback stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="پیامک‌های ارسال شده" value={formatNumber(ov?.totalSmsSent ?? 0)} icon={<MessageSquare className="size-5" />}
          description={`${formatNumber(ov?.totalSmsFailed ?? 0)} ناموفق`} />
        <StatCard title="بسته‌های فروخته شده" value={formatNumber(ov?.totalSmsPackagesSold ?? 0)} icon={<Package className="size-5" />} />
        <StatCard title="کش‌بک صادر شده" value={formatToman(ov?.totalCashbackIssued ?? 0)} icon={<Gift className="size-5" />} />
        <StatCard title="اشتراک در حال انقضا" value={formatNumber(ov?.expiringSubscriptions ?? 0)} icon={<AlertTriangle className="size-5" />}
          className="border-amber-200 bg-amber-50 dark:bg-amber-950/20" />
      </div>

      {/* Top businesses by revenue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="size-5" />برترین خشکشویی‌ها بر اساس درآمد</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!rev?.byBusiness?.length ? (
            <p className="py-10 text-center text-sm text-muted-foreground">داده‌ای موجود نیست</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رتبه</TableHead>
                  <TableHead>نام بیزینس</TableHead>
                  <TableHead className="text-center">تعداد سفارش</TableHead>
                  <TableHead className="text-center">درآمد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rev.byBusiness.map((b, i) => (
                  <TableRow key={b.businessId}>
                    <TableCell><span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{toPersianDigits(i + 1)}</span></TableCell>
                    <TableCell className="font-medium">{b.businessName}</TableCell>
                    <TableCell className="text-center">{toPersianDigits(b.orders)}</TableCell>
                    <TableCell className="text-center font-medium">{formatToman(b.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Subscription plans breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Crown className="size-5" />گزارش اشتراک‌ها</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!subs?.plans?.length ? (
            <p className="py-10 text-center text-sm text-muted-foreground">داده‌ای موجود نیست</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>پلن</TableHead>
                  <TableHead className="text-center">تعداد فعال</TableHead>
                  <TableHead className="text-center">درآمد ماهانه</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.plans.map((p) => (
                  <TableRow key={p.planId}>
                    <TableCell className="font-medium">{p.planName}</TableCell>
                    <TableCell className="text-center">{toPersianDigits(p.activeCount)}</TableCell>
                    <TableCell className="text-center font-medium">{formatToman(p.totalRevenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Catalog counts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="size-5" />آمار کاتالوگ‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="انواع لباس" value={formatNumber(cats?.garmentTypes ?? 0)} icon={<BookOpen className="size-5" />} />
            <StatCard title="انواع خدمت" value={formatNumber(cats?.serviceTypes ?? 0)} icon={<BookOpen className="size-5" />} />
            <StatCard title="انواع پارچه" value={formatNumber(cats?.fabricTypes ?? 0)} icon={<BookOpen className="size-5" />} />
            <StatCard title="رنگ‌ها" value={formatNumber(cats?.colors ?? 0)} icon={<BookOpen className="size-5" />} />
            <StatCard title="انواع اقلام انبار" value={formatNumber(cats?.inventoryItemTypes ?? 0)} icon={<BookOpen className="size-5" />} />
            <StatCard title="وضعیت‌های سفارش" value={formatNumber(cats?.orderStatuses ?? 0)} icon={<BookOpen className="size-5" />} />
            <StatCard title="قالب‌های پیامک" value={formatNumber(cats?.smsTemplates ?? 0)} icon={<BookOpen className="size-5" />} />
            <StatCard title="قالب‌های قبض" value={formatNumber(cats?.receiptTemplates ?? 0)} icon={<BookOpen className="size-5" />} />
          </div>
        </CardContent>
      </Card>

      {/* Inventory stats */}
      <Card>
        <CardHeader>
          <CardTitle>آمار انبار (کل پلتفرم)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="کل آیتم‌های انبار" value={formatNumber(inv?.totalItems ?? 0)} icon={<ShoppingBag className="size-5" />} />
            <StatCard title="آیتم‌های رو به اتمام" value={formatNumber(inv?.lowStockItems ?? 0)} icon={<AlertTriangle className="size-5" />}
              className="border-amber-200 bg-amber-50 dark:bg-amber-950/20" />
            <StatCard title="مجموع موجودی" value={formatNumber(inv?.totalStockValue ?? 0)} icon={<TrendingUp className="size-5" />} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
