"use client";

import {
  Building2,
  Users,
  ShoppingBag,
  Wallet,
  MessageSquare,
  Gift,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
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
import type { SuperAdminDashboardData } from "@/types";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, formatToman, toPersianDigits } from "@/lib/utils";
import { toJalaliDateTime } from "@/lib/jalali";

interface Props {
  data: SuperAdminDashboardData;
}

export function SuperAdminDashboard({ data }: Props) {
  const chartData = data.chart.rows.map((r) => ({
    name: r.jalaliKey,
    revenue: r.revenue,
    orders: r.orders,
  }));

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="کل بیزینس‌ها"
          value={formatNumber(data.totalBusinesses)}
          icon={<Building2 className="size-5" />}
          description={`${formatNumber(data.activeBusinesses)} فعال · ${formatNumber(data.pendingBusinesses)} در انتظار`}
        />
        <StatCard
          title="کل کاربران"
          value={formatNumber(data.totalUsers)}
          icon={<Users className="size-5" />}
        />
        <StatCard
          title="سفارشات امروز (کل)"
          value={formatNumber(data.todayOrders)}
          icon={<ShoppingBag className="size-5" />}
        />
        <StatCard
          title="درآمد امروز (کل)"
          value={formatToman(data.todayRevenue)}
          icon={<Wallet className="size-5" />}
        />
        <StatCard
          title="درآمد ماه (کل)"
          value={formatToman(data.monthlyRevenue)}
          icon={<TrendingUp className="size-5" />}
        />
        <StatCard
          title="کل درآمد پلتفرم"
          value={formatToman(data.totalRevenue)}
          icon={<Wallet className="size-5" />}
        />
        <StatCard
          title="کل مشتریان"
          value={formatNumber(data.totalCustomers)}
          icon={<Users className="size-5" />}
        />
        <StatCard
          title="کل سفارشات"
          value={formatNumber(data.totalOrders)}
          icon={<ShoppingBag className="size-5" />}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="پیامک‌های ارسال شده"
          value={formatNumber(data.totalSmsSent)}
          icon={<MessageSquare className="size-5" />}
          description={`${formatNumber(data.totalSmsFailed)} ناموفق`}
        />
        <StatCard
          title="کش‌بک صادر شده"
          value={formatToman(data.totalCashbackIssued)}
          icon={<Gift className="size-5" />}
        />
        <StatCard
          title="اشتراک‌های فعال"
          value={formatNumber(data.activeSubscriptions)}
          icon={<CreditCard className="size-5" />}
          description={`${formatNumber(data.expiringSubscriptions)} در حال انقضا`}
        />
        <StatCard
          title="بیزینس‌های معلق"
          value={formatNumber(data.suspendedBusinesses)}
          icon={<AlertTriangle className="size-5" />}
          className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>نمودار درآمد کل پلتفرم</CardTitle>
            <CardDescription>روند درآمد در بازه انتخابی</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="adminRevGradient" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#adminRevGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نمودار سفارشات کل</CardTitle>
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

      {/* Recent businesses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            آخرین بیزینس‌های ثبت شده
          </CardTitle>
          <CardDescription>۵ بیزینس اخیر در پلتفرم</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentBusinesses.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">هنوز بیزینسی ثبت نشده است</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام بیزینس</TableHead>
                  <TableHead>مالک</TableHead>
                  <TableHead>موبایل</TableHead>
                  <TableHead>تاریخ ثبت</TableHead>
                  <TableHead className="text-center">وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentBusinesses.map((b) => (
                  <TableRow key={b._id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.ownerName || "—"}</TableCell>
                    <TableCell dir="ltr" className="text-right">{b.ownerPhone || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.createdAt ? toJalaliDateTime(b.createdAt) : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          b.status === "active" ? "default" :
                          b.status === "pending" ? "secondary" :
                          b.status === "suspended" ? "destructive" :
                          "outline"
                        }
                      >
                        {b.status === "active" ? "فعال" :
                         b.status === "pending" ? "در انتظار" :
                         b.status === "suspended" ? "معلق" :
                         b.status === "inactive" ? "غیرفعال" :
                         b.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick info */}
      <Card>
        <CardHeader>
          <CardTitle>نمای کلی پلتفرم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">بیزینس‌های فعال</p>
                <p className="text-lg font-bold">{formatNumber(data.activeBusinesses)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/30">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">در انتظار تأیید</p>
                <p className="text-lg font-bold">{formatNumber(data.pendingBusinesses)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/30">
                <CreditCard className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">اشتراک در حال انقضا</p>
                <p className="text-lg font-bold">{formatNumber(data.expiringSubscriptions)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
