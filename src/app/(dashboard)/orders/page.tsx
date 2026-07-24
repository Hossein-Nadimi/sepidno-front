"use client";

import { useState, useMemo, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, ShoppingBag, Eye, Filter, Zap, Edit2, ChevronRight, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment-jalaali";
import { orderService, catalogService } from "@/services";
import type { Order, OrderStatus as OrderStatusType } from "@/types";
import { PageHeader } from "@/components/common/page-header";
import { PageHelp } from "@/components/common/page-help";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/common/search-input";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { TableLoading } from "@/components/common/loading";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounced } from "@/hooks/use-debounced";
import { Avatar } from "@/components/common/avatar";
import { formatToman, toPersianDigits, cn } from "@/lib/utils";
import { toJalali, jalaliStringToLongLabel, JALALI_MONTHS } from "@/lib/jalali";

moment.loadPersian({ dialect: "persian-modern", usePersianDigits: false });

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-4">در حال بارگذاری...</div>}>
      <OrdersPageInner />
    </Suspense>
  );
}

function OrdersPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // Read filter mode from URL: ?delayed=true or ?deliveryOn=1403/05/12
  const delayedMode = searchParams.get("delayed") === "true";
  const deliveryOnParam = searchParams.get("deliveryOn"); // jYYYY/jMM/jDD

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>(delayedMode ? "deliveryDate" : "-createdAt");
  const [quickDateFilter, setQuickDateFilter] = useState<string>("");
  const debouncedSearch = useDebounced(search, 400);

  const { data: statuses } = useQuery({
    queryKey: ["order-statuses"],
    queryFn: () => catalogService.orderStatuses.all(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["orders", { page, search: debouncedSearch, status, sortBy, delayedMode, deliveryOnParam, quickDateFilter }],
    queryFn: () =>
      orderService.list({
        page,
        pageSize: 20,
        sort: sortBy,
        search: debouncedSearch || undefined,
        status: status !== "all" ? status : undefined,
        delayed: delayedMode ? "true" : undefined,
        deliveryOn: deliveryOnParam || undefined,
        preset: quickDateFilter || undefined,
      } as Record<string, unknown>),
  });

  const orders = data?.items || [];
  const statusMap = new Map((statuses || []).map((s) => [s._id, s]));

  // Build dynamic page title based on filter mode
  const pageTitle = useMemo(() => {
    if (delayedMode) return "سفارشات تأخیر یافته";
    if (deliveryOnParam) {
      try {
        return `سفارشات روز ${jalaliStringToLongLabel(deliveryOnParam)}`;
      } catch {
        return "سفارشات";
      }
    }
    return "سفارشات";
  }, [delayedMode, deliveryOnParam]);

  const pageDescription = useMemo(() => {
    if (delayedMode) return "سفارشاتی که تاریخ تحویلشان گذشته ولی هنوز تحویل داده نشده‌اند";
    if (deliveryOnParam) return `سفارشاتی که تاریخ تحویل آن‌ها در این روز است`;
    return "مدیریت و پیگیری سفارشات";
  }, [delayedMode, deliveryOnParam]);

  // Day navigation (prev/next) when in deliveryOn mode
  function shiftDay(delta: number) {
    if (!deliveryOnParam) return;
    const m = moment(deliveryOnParam, "jYYYY/jMM/jDD", true);
    if (!m.isValid()) return;
    m.add(delta, "day");
    const next = m.format("jYYYY/jMM/jDD");
    router.push(`/orders?deliveryOn=${encodeURIComponent(next)}`);
    setPage(1);
  }

  // Shift month for the day navigation display
  const dayLabel = deliveryOnParam ? jalaliStringToLongLabel(deliveryOnParam) : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={
          <div className="flex gap-2">
            {delayedMode || deliveryOnParam ? (
              <Button variant="outline" onClick={() => router.push("/orders")}>
                <ShoppingBag className="size-4 ml-1" />
                همه سفارشات
              </Button>
            ) : null}
            {!delayedMode && !deliveryOnParam ? (
              <>
                <PageHelp
                  title="راهنمای سفارشات"
                  sections={[
                    { title: "لیست سفارشات", body: "در این صفحه تمام سفارشات خشکشویی شما نمایش داده می‌شود. می‌توانید با شماره سفارش یا موبایل مشتری جستجو کنید و بر اساس وضعیت فیلتر کنید." },
                    { title: "تغییر وضعیت", body: "برای هر سفارش می‌توانید مستقیماً از لیست، وضعیت را تغییر دهید (مثلاً از «پذیرش» به «در حال انجام» یا «آماده تحویل»)." },
                    { title: "سفارش فوری", body: "سفارشاتی که فوری علامت خورده‌اند با نشان زرد رنگ مشخص می‌شوند. مبلغ این سفارشات بر اساس ضریب فوری (در تنظیمات) محاسبه می‌شود." },
                    { title: "عملیات", body: "با کلیک روی آیکون چشم، جزئیات سفارش را ببینید. با کلیک روی آیکون مداد، سفارش را ویرایش کنید." },
                  ]}
                />
                <Button onClick={() => router.push("/orders/new")}>
                  <Plus className="size-4 ml-1" />
                  سفارش جدید
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      {/* Day navigation bar (only in deliveryOn mode) */}
      {deliveryOnParam && (
        <Card>
          <CardContent className="flex items-center justify-between p-3">
            <Button variant="outline" size="sm" onClick={() => shiftDay(-1)}>
              <ChevronRight className="size-4" />
              <span className="hidden sm:inline">روز قبل</span>
            </Button>
            <div className="text-center">
              <div className="text-sm font-bold sm:text-base">{dayLabel}</div>
              <div className="text-xs text-muted-foreground">{toPersianDigits(orders.length)} سفارش</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => shiftDay(1)}>
              <span className="hidden sm:inline">روز بعد</span>
              <ChevronLeft className="size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filter bar — hidden in delayed/deliveryOn modes to keep things clean */}
      {!delayedMode && !deliveryOnParam && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-3 sm:p-4">
            {/* Quick date filters + sort in one row */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "همه", value: "" },
                { label: "امروز", value: "today" },
                { label: "این هفته", value: "thisWeek" },
                { label: "این ماه", value: "thisMonth" },
              ].map((q) => (
                <Button
                  key={q.value}
                  variant={quickDateFilter === q.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setQuickDateFilter(q.value); setPage(1); }}
                >
                  {q.label}
                </Button>
              ))}
              <div className="flex-1" />
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="مرتب‌سازی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-createdAt">جدیدترین</SelectItem>
                  <SelectItem value="createdAt">قدیمی‌ترین</SelectItem>
                  <SelectItem value="-deliveryDate">نزدیک‌ترین تحویل</SelectItem>
                  <SelectItem value="deliveryDate">دورترین تحویل</SelectItem>
                  <SelectItem value="-finalPrice">بیشترین مبلغ</SelectItem>
                  <SelectItem value="finalPrice">کمترین مبلغ</SelectItem>
                  <SelectItem value="-urgent">فوری اول</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <SearchInput
                value={search}
                onChange={(v) => { setSearch(v); setPage(1); }}
                placeholder="جستجو با شماره سفارش یا موبایل"
                className="w-full sm:flex-1"
              />
              <div className="flex items-center gap-2">
                <Filter className="size-4 shrink-0 text-muted-foreground" />
                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="همه وضعیت‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    {statuses?.map((s) => (
                      <SelectItem key={s._id} value={s._id}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><TableLoading /></div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title={delayedMode ? "سفارش تأخیری وجود ندارد" : deliveryOnParam ? "سفارشی برای این روز ثبت نشده است" : "سفارشی یافت نشد"}
              description={delayedMode ? "همه سفارشات به‌موقع تحویل داده شده‌اند" : undefined}
              action={
                !delayedMode && !deliveryOnParam ? (
                  <Button onClick={() => router.push("/orders/new")}>
                    <Plus className="size-4 ml-1" />
                    سفارش جدید
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>شماره سفارش</TableHead>
                    <TableHead>مشتری</TableHead>
                    <TableHead>تاریخ تحویل</TableHead>
                    <TableHead className="text-center">آیتم‌ها</TableHead>
                    <TableHead className="text-center">مبلغ</TableHead>
                    <TableHead className="text-center">وضعیت</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o: Order) => {
                    const customer = typeof o.customer === "object" ? o.customer : null;
                    const statusObj = statusMap.get(typeof o.status === "string" ? o.status : (o.status as { _id: string })._id) as OrderStatusType | undefined;
                    const currentStatusId = typeof o.status === "object" ? (o.status as { _id: string })._id : o.status;
                    const isDelayed = delayedMode || (o.deliveryDate && new Date(o.deliveryDate) < new Date() && !statusObj?.isCompleted && !statusObj?.isCancelled);
                    return (
                      <TableRow key={o._id} className={o.urgent ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}>
                        <TableCell label="شماره سفارش">
                          <div className="flex items-center gap-2">
                            {o.urgent && (
                              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                <Zap className="size-3" />
                                فوری
                              </span>
                            )}
                            <span className="font-medium" dir="ltr">{o.orderNumber}</span>
                            {isDelayed && (
                              <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400" title="تاریخ تحویل گذشته است">
                                تأخیر
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell label="مشتری">
                          {customer ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={`${customer.firstName} ${customer.lastName}`} size={32} />
                              <span className="truncate">{customer.firstName} {customer.lastName}</span>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell label="تاریخ تحویل" className="text-sm text-muted-foreground">
                          <div>{toJalali(o.deliveryDate)}</div>
                          {(() => {
                            if (!o.deliveryDate || statusObj?.isCompleted || statusObj?.isCancelled) return null;
                            const now = new Date();
                            now.setHours(0, 0, 0, 0);
                            const delivery = new Date(o.deliveryDate);
                            delivery.setHours(0, 0, 0, 0);
                            const diffMs = delivery.getTime() - now.getTime();
                            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
                            if (diffDays === 0) return <span className="text-xs font-medium text-blue-600 dark:text-blue-400">امروز</span>;
                            if (diffDays === 1) return <span className="text-xs font-medium text-blue-600 dark:text-blue-400">۱ روز تا تحویل</span>;
                            if (diffDays > 1 && diffDays <= 3) return <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{toPersianDigits(diffDays)} روز تا تحویل</span>;
                            if (diffDays < 0) return <span className="text-xs font-medium text-red-600 dark:text-red-400">{toPersianDigits(Math.abs(diffDays))} روز تأخیر</span>;
                            return null;
                          })()}
                        </TableCell>
                        <TableCell label="آیتم‌ها" className="text-center">{toPersianDigits(o.items.length)}</TableCell>
                        <TableCell label="مبلغ" className="text-center font-medium">{formatToman(o.finalPrice)}</TableCell>
                        <TableCell label="وضعیت" className="text-center">
                          <Select
                            value={currentStatusId}
                            onValueChange={(v) => {
                              orderService.update(o._id, { status: v }).then(() => {
                                toast.success("وضعیت سفارش تغییر کرد");
                                queryClient.invalidateQueries({ queryKey: ["orders"] });
                                queryClient.invalidateQueries({ queryKey: ["orders-calendar"] });
                                queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                              });
                            }}
                          >
                            <SelectTrigger className={cn(
                              "h-8 w-32 mx-auto border-2 font-medium",
                              statusObj?.isCompleted
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                                : statusObj?.isCancelled
                                  ? "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400"
                                  : statusObj?.title === "آماده تحویل" || statusObj?.slug === "ready"
                                    ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-400"
                                    : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
                            )}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses?.map((s) => (
                                <SelectItem key={s._id} value={s._id}>{s.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell label="عملیات">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950/20" onClick={() => router.push(`/orders/${o._id}`)}>
                              <Eye className="size-3.5 ml-1" />
                              مشاهده
                            </Button>
                            <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/20" onClick={() => router.push(`/orders/${o._id}/edit`)}>
                              <Edit2 className="size-3.5 ml-1" />
                              ویرایش
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {data?.meta && (
                <Pagination
                  page={data.meta.page}
                  pageSize={data.meta.pageSize}
                  total={data.meta.total}
                  totalPages={data.meta.totalPages}
                  hasNext={data.meta.hasNext}
                  hasPrev={data.meta.hasPrev}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
