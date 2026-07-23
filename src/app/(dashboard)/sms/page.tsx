"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { Package, MessageSquare, ShoppingCart, Loader2, CheckCircle2, Clock, CreditCard, Info } from "lucide-react";
import toast from "react-hot-toast";
import { smsService } from "@/services";
import api from "@/lib/api";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { TableLoading } from "@/components/common/loading";
import { PageHelp } from "@/components/common/page-help";
import { formatNumber, formatToman, toPersianDigits } from "@/lib/utils";
import { toJalali, toJalaliDateTime } from "@/lib/jalali";

export default function SmsPage() {
  const { data: packages, isLoading: pkgLoading } = useQuery({
    queryKey: ["sms-packages"],
    queryFn: () => smsService.packages.list({ pageSize: 50, active: true }),
  });

  const { data: businessPackages } = useQuery({
    queryKey: ["business-sms-packages"],
    queryFn: () => smsService.businessPackages.list({ pageSize: 50 }),
  });

  const { data: usageData } = useQuery({
    queryKey: ["sms-usage"],
    queryFn: () => smsService.usage.list({ pageSize: 20, sort: "-createdAt" }),
  });

  const { data: subStatus } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: () => api.get("/laundry/subscriptions/status").then((r) => r.data.data),
  });

  const purchaseMutation = useMutation({
    mutationFn: (pkgId: string) =>
      api.post("/laundry/sms/business-packages/payment/request", { smsPackageId: pkgId }).then((r) => r.data.data),
    onSuccess: (data: { redirectUrl: string }) => {
      window.location.href = data.redirectUrl;
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "خطا در ایجاد درخواست پرداخت");
    },
  });

  const activePackages = businessPackages?.items?.filter((p: { status: string }) => p.status === "active") || [];
  // Use remainingCredits/totalCredits (new field names) with fallback to old names
  const packageRemaining = activePackages.reduce((sum: number, p: { remainingCredits?: number; remainingSms?: number }) =>
    sum + (p.remainingCredits ?? p.remainingSms ?? 0), 0);
  const packageTotal = activePackages.reduce((sum: number, p: { totalCredits?: number; totalSms?: number }) =>
    sum + (p.totalCredits ?? p.totalSms ?? 0), 0);

  // Subscription SMS — use new field names with fallback
  const sub: { smsCredits?: number; smsCreditsUsed?: number; monthlySmsQuota?: number; monthlySmsUsed?: number } =
    subStatus?.subscription || {};
  const subCredits = sub.smsCredits ?? sub.monthlySmsQuota ?? 0;
  const subUsed = sub.smsCreditsUsed ?? sub.monthlySmsUsed ?? 0;
  const subRemaining = Math.max(0, subCredits - subUsed);

  const totalAvailable = subRemaining + packageRemaining;
  const sentCount = usageData?.items?.filter((u: { status: string }) => u.status === "sent").length || 0;
  const failedCount = usageData?.items?.filter((u: { status: string }) => u.status === "failed").length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="مدیریت پیامک"
        description="موجودی اعتبار پیامک، خرید بسته و تاریخچه ارسال"
        actions={
          <PageHelp
            title="راهنمای مدیریت پیامک"
            sections={[
              {
                title: "سیستم اعتبار پیامک",
                body: "هر پیامک بر اساس طول متن محاسبه می‌شود:\n• ۱ تا ۷۰ کاراکتر = ۱ اعتبار\n• ۷۱ تا ۱۳۴ کاراکتر = ۲ اعتبار\n• ۱۳۵ تا ۲۰۱ کاراکتر = ۳ اعتبار\nو به همین ترتیب هر ۶۴ کاراکتر اضافی، یک اعتبار دیگر مصرف می‌کند.",
              },
              {
                title: "منابع اعتبار",
                body: "اعتبار پیامک شما از دو منبع تامین می‌شود:\n۱. اعتبار هدیه پلن اشتراک (ماهانه)\n۲. بسته‌های پیامک خریداری شده\nهنگام ارسال، ابتدا اعتبار اشتراک مصرف می‌شود، سپس بسته خریداری شده.",
              },
              {
                title: "تجمع اعتبار",
                body: "اعتبار باقی‌مانده از اشتراک قبلی، هنگام تمدید اشتراک به اعتبار جدید اضافه می‌شود و از بین نمی‌رود.",
              },
              {
                title: "ارسال پیامک",
                body: "پیامک‌ها به‌طور خودکار هنگام ثبت سفارش، آماده تحویل، تحویل سفارش (کش‌بک) و تولد مشتری ارسال می‌شوند (اگر در تنظیمات فعال شده باشد).\nاگر اعتبار کافی نباشد، پیامک ارسال نمی‌شود ولی پنل شما بدون مشکل کار می‌کند.\nپیامک ورود و لاگین از اعتبار شما کسر نمی‌شود.",
              },
            ]}
          />
        }
      />

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <Info className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">هر پیامک بر اساس طول متن محاسبه می‌شود.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="مجموع اعتبار قابل استفاده"
          value={formatNumber(totalAvailable)}
          icon={<MessageSquare className="size-5" />}
          description={`اشتراک: ${formatNumber(subRemaining)} + بسته‌ها: ${formatNumber(packageRemaining)}`}
          className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20"
        />
        <StatCard
          title="اعتبار اشتراک"
          value={`${formatNumber(subRemaining)} / ${formatNumber(subCredits)}`}
          icon={<CreditCard className="size-5" />}
          description="باقی‌مانده (تجمعی)"
        />
        <StatCard
          title="بسته‌های خریداری شده"
          value={formatNumber(packageRemaining)}
          icon={<Package className="size-5" />}
          description={`از ${formatNumber(packageTotal)} اعتبار`}
        />
        <StatCard
          title="ارسال اخیر"
          value={`${formatNumber(sentCount)} موفق / ${formatNumber(failedCount)} ناموفق`}
          icon={failedCount > 0 ? <Clock className="size-5" /> : <CheckCircle2 className="size-5" />}
          className={failedCount > 0 ? "border-amber-200" : ""}
        />
      </div>

      {/* Available packages for purchase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">خرید بسته پیامک</CardTitle>
        </CardHeader>
        <CardContent>
          {pkgLoading ? (
            <TableLoading />
          ) : !packages?.items?.length ? (
            <EmptyState icon={Package} title="بسته‌ای برای خرید در دسترس نیست" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.items.map((pkg: { _id: string; title: string; description?: string; creditCount: number; price: number; expireDays: number }) => {
                const credits = pkg.creditCount ?? 0;
                return (
                  <Card key={pkg._id}>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <h3 className="font-bold">{pkg.title}</h3>
                        {pkg.description && <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>}
                        <p className="mt-3 text-3xl font-bold text-primary">{toPersianDigits(credits)}</p>
                        <p className="text-sm text-muted-foreground">اعتبار پیامک</p>
                        <p className="mt-2 text-lg font-medium">{formatToman(pkg.price)}</p>
                        {pkg.expireDays > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">اعتبار: {toPersianDigits(pkg.expireDays)} روز</p>
                        )}
                        <Button
                          className="mt-4 w-full"
                          onClick={() => purchaseMutation.mutate(pkg._id)}
                          disabled={purchaseMutation.isPending}
                        >
                          {purchaseMutation.isPending && purchaseMutation.variables === pkg._id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <>
                              <ShoppingCart className="size-4 ml-1" />
                              خرید
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchased packages history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">بسته‌های خریداری شده</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!businessPackages?.items?.length ? (
            <EmptyState title="هنوز بسته‌ای خریداری نشده است" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>بسته</TableHead>
                  <TableHead className="text-center">کل اعتبار</TableHead>
                  <TableHead className="text-center">باقی‌مانده</TableHead>
                  <TableHead>تاریخ خرید</TableHead>
                  <TableHead>تاریخ انقضا</TableHead>
                  <TableHead className="text-center">وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessPackages.items.map((pkg: { _id: string; smsPackage: { title?: string } | string; totalCredits?: number; totalSms?: number; remainingCredits?: number; remainingSms?: number; createdAt: string; expireDate: string; status: string }) => {
                  const smsPkg = typeof pkg.smsPackage === "object" ? pkg.smsPackage : null;
                  const total = pkg.totalCredits ?? pkg.totalSms ?? 0;
                  const remaining = pkg.remainingCredits ?? pkg.remainingSms ?? 0;
                  return (
                    <TableRow key={pkg._id}>
                      <TableCell label="بسته" className="font-medium">{smsPkg?.title || "—"}</TableCell>
                      <TableCell label="کل اعتبار" className="text-center">{toPersianDigits(total)}</TableCell>
                      <TableCell label="باقی‌مانده" className="text-center font-medium">{toPersianDigits(remaining)}</TableCell>
                      <TableCell label="تاریخ خرید" className="text-sm text-muted-foreground">{toJalali(pkg.createdAt)}</TableCell>
                      <TableCell label="تاریخ انقضا" className="text-sm text-muted-foreground">{toJalali(pkg.expireDate)}</TableCell>
                      <TableCell label="وضعیت" className="text-center">
                        <Badge variant={pkg.status === "active" ? "default" : "secondary"}>
                          {pkg.status === "active" ? "فعال" : pkg.status === "expired" ? "منقضی" : "مصرف شده"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* SMS usage history — with full message text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تاریخچه ارسال پیامک</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!usageData?.items?.length ? (
            <EmptyState title="هنوز پیامی ارسال نشده است" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شماره</TableHead>
                  <TableHead>متن پیام</TableHead>
                  <TableHead className="text-center">کاراکتر</TableHead>
                  <TableHead className="text-center">اعتبار</TableHead>
                  <TableHead className="text-center">منبع</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead className="text-center">وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageData.items.map((u: { _id: string; phone: string; messageText?: string; message?: string; characterCount?: number; creditCost?: number; partsCount?: number; source?: string; createdAt: string; status: string; event?: string }) => (
                  <TableRow key={u._id}>
                    <TableCell label="شماره" dir="ltr" className="text-sm">{u.phone}</TableCell>
                    <TableCell label="متن پیام" className="max-w-xs">
                      <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">
                        {u.messageText || u.message || "—"}
                      </p>
                    </TableCell>
                    <TableCell label="کاراکتر" className="text-center text-sm">{toPersianDigits(u.characterCount || 0)}</TableCell>
                    <TableCell label="اعتبار" className="text-center font-medium">{toPersianDigits(u.creditCost ?? u.partsCount ?? 0)}</TableCell>
                    <TableCell label="منبع" className="text-center text-xs text-muted-foreground">
                      {u.source === "subscription" ? "اشتراک" : u.source === "package" ? "بسته" : u.source === "admin" ? "سیستم" : "—"}
                    </TableCell>
                    <TableCell label="تاریخ" className="text-sm text-muted-foreground">{toJalaliDateTime(u.createdAt)}</TableCell>
                    <TableCell label="وضعیت" className="text-center">
                      <Badge variant={u.status === "sent" ? "default" : "destructive"}>
                        {u.status === "sent" ? "موفق" : "ناموفق"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
