"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Zap,
  TrendingUp,
  AlertCircle,
  X,
  ShoppingCart,
} from "lucide-react";
import moment from "moment-jalaali";
import { calendarService, type CalendarDayInfo } from "@/services";
import { PageHeader } from "@/components/common/page-header";
import { PageHelp } from "@/components/common/page-help";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toPersianDigits, formatToman } from "@/lib/utils";
import { jalaliStringToLongLabel, JALALI_WEEKDAYS, JALALI_MONTHS } from "@/lib/jalali";

moment.loadPersian({ dialect: "persian-modern", usePersianDigits: false });

function splitJalaliMonth(jalaliMonth: string): { jy: number; jm: number } {
  const parts = jalaliMonth.split("/");
  return { jy: parseInt(parts[0], 10), jm: parseInt(parts[1], 10) };
}

function formatMonthTitle(jalaliMonth: string): string {
  const { jy, jm } = splitJalaliMonth(jalaliMonth);
  return `${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
}

function shiftMonth(jalaliMonth: string, delta: number): string {
  const { jy, jm } = splitJalaliMonth(jalaliMonth);
  const m = moment(`${jy}/${String(jm).padStart(2, "0")}/01`, "jYYYY/jMM/jDD", true);
  m.add(delta, "jMonth");
  return m.format("jYYYY/jMM");
}

export default function OrdersCalendarPage() {
  const router = useRouter();
  const currentMonth = useMemo(() => moment().format("jYYYY/jMM"), []);
  const [month, setMonth] = useState<string>(currentMonth);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // Pagination for the day detail modal — show 10 orders per page
  const ORDERS_PER_PAGE = 10;
  const [dayPage, setDayPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["orders-calendar", month],
    queryFn: () => calendarService.getMonth(month),
    enabled: !!month,
  });

  const { data: dayDetail, isLoading: dayLoading } = useQuery({
    queryKey: ["orders-calendar-day", selectedDay],
    queryFn: () => calendarService.getDay(selectedDay!),
    enabled: !!selectedDay,
  });

  // Reset page when a new day is selected
  const prevSelectedDayRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedDay !== prevSelectedDayRef.current) {
      setDayPage(1);
      prevSelectedDayRef.current = selectedDay;
    }
  }, [selectedDay]);

  // Compute paginated orders for the modal
  const dayOrders = dayDetail?.orders ?? [];
  const dayTotalPages = Math.max(1, Math.ceil(dayOrders.length / ORDERS_PER_PAGE));
  const safeDayPage = Math.min(dayPage, dayTotalPages);
  const paginatedDayOrders = dayOrders.slice(
    (safeDayPage - 1) * ORDERS_PER_PAGE,
    safeDayPage * ORDERS_PER_PAGE,
  );

  // Build the calendar grid.
  // Backend returns 42 days (6 weeks starting from Saturday). We mark days
  // that don't belong to the requested Jalali month as "outside" so the UI
  // can render them as empty/disabled cells instead of clickable day buttons.
  const grid: (CalendarDayInfo & { isOutsideMonth: boolean })[] = [];
  if (data?.days) {
    const requestedMonthStr = month; // e.g. "1403/04"
    for (let i = 0; i < data.days.length; i++) {
      const day = data.days[i];
      // jalaliDate format: jYYYY/jMM/jDD — compare first 7 chars to month
      const dayMonth = day.jalaliDate.substring(0, 7); // "jYYYY/jMM"
      grid.push({ ...day, isOutsideMonth: dayMonth !== requestedMonthStr });
    }
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="تقویم سفارشات"
        description="نمای ماهانه از سفارشات بر اساس تاریخ تحویل"
        actions={
          <PageHelp
            title="راهنمای تقویم سفارشات"
            sections={[
              { title: "نمای کلی", body: "این صفحه تمام سفارشات شما را به صورت ماهانه بر اساس تاریخ تحویل (روزی که مشتری باید سفارش خود را تحویل بگیرد) نمایش می‌دهد. هر خانه نشان‌دهنده یک روز است و تعداد سفارشات آن روز را نشان می‌دهد." },
              { title: "رنگ‌بندی خانه‌ها", body: "خانه‌های با رنگ سبز روشن یعنی سفارشات آن روز در محدوده مجاز است. خانه‌های قرمز یعنی ظرفیت آن روز به حداکثر رسیده (حداکثر روزانه در تنظیمات تعریف شده)." },
              { title: "حداکثر روزانه", body: "می‌توانید در صفحه تنظیمات، حداکثر تعداد سفارش روزانه را تعیین کنید. این فقط یک هشدار بصری است و ثبت سفارش برای روزهایی که ظرفیتشان تکمیل شده مسدود نمی‌شود." },
              { title: "مشاهده جزئیات روز", body: "با کلیک روی هر خانه، یک پنجره باز می‌شود و لیست سفارشات آن روز را نشان می‌دهد. می‌توانید روی هر سفارش کلیک کنید تا به صفحه جزئیات آن بروید." },
              { title: "سفارشات فوری", body: "تعداد سفارشات فوری هر روز با آیکون زرد رنگ (Zap) کنار تعداد نمایش داده می‌شود." },
            ]}
          />
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">کل سفارشات ماه</div>
            <div className="mt-1 text-2xl font-bold">{toPersianDigits(summary?.totalOrders ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">درآمد ماه</div>
            <div className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatToman(summary?.totalRevenue ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">میانگین روزانه</div>
            <div className="mt-1 text-2xl font-bold">
              {toPersianDigits(summary?.avgOrdersPerDay ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5 text-red-500" />
              روزهای پر
            </div>
            <div className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
              {toPersianDigits(summary?.fullDays ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, -1))} className="shrink-0">
              <ChevronRight className="size-4" />
              <span className="hidden sm:inline">ماه قبل</span>
            </Button>
            <h2 className="text-center text-base font-bold sm:text-xl">{formatMonthTitle(month)}</h2>
            <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, 1))} className="shrink-0">
              <span className="hidden sm:inline">ماه بعد</span>
              <ChevronLeft className="size-4" />
            </Button>
          </div>

          {/* Optional: show limits badges */}
          {(summary?.maxDailyOrders ?? 0) > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                حداکثر روزانه: {toPersianDigits(summary!.maxDailyOrders)}
              </Badge>
            </div>
          )}

          {/* Weekday header — short labels on mobile, full names on sm+ */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-2 mb-2">
            {JALALI_WEEKDAYS.map((name) => (
              <div
                key={name}
                className="rounded-md bg-muted/60 py-1.5 text-center text-[10px] font-bold text-muted-foreground sm:py-2 sm:text-sm"
              >
                {/* On very small screens show only the first letter */}
                <span className="sm:hidden">{name.charAt(0)}</span>
                <span className="hidden sm:inline">{name}</span>
              </div>
            ))}
          </div>

          {/* Days grid */}
          {isLoading ? (
            <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
              {Array.from({ length: 42 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square min-h-14 rounded-md sm:min-h-24" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
              {grid.map((day, idx) => {
                // Days from the previous/next month are shown as empty, non-clickable cells
                if (day.isOutsideMonth) {
                  return (
                    <div
                      key={idx}
                      className="aspect-square min-h-14 rounded-md border border-dashed border-border/50 bg-muted/20 sm:min-h-24"
                    />
                  );
                }
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(day.jalaliDate)}
                    className={[
                      "relative aspect-square min-h-14 rounded-md border p-1 text-right transition hover:scale-[1.02] hover:shadow-md sm:min-h-24 sm:p-2",
                      day.isToday
                        ? "border-emerald-500 ring-1 ring-emerald-500/30"
                        : "border-border",
                      day.isPast ? "opacity-60" : "",
                      day.isFull
                        ? "bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30"
                        : day.orderCount > 0
                          ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30"
                          : "bg-card hover:bg-muted/50",
                      selectedDay === day.jalaliDate ? "ring-2 ring-emerald-500" : "",
                    ].join(" ")}
                  >
                    <div className="flex h-full flex-col">
                      <span className="text-xs font-bold sm:text-base">
                        {toPersianDigits(parseInt(day.jalaliDate.split("/")[2], 10))}
                      </span>
                      {day.orderCount > 0 && (
                        <div className="mt-auto space-y-0.5">
                          <div className="flex items-center gap-0.5 text-[10px] font-semibold sm:gap-1 sm:text-sm">
                            <CalendarDays className="hidden size-3 sm:inline" />
                            <span>{toPersianDigits(day.orderCount)}</span>
                            {day.urgentCount > 0 && (
                              <span className="flex items-center text-amber-600 dark:text-amber-400">
                                <Zap className="size-2.5 sm:size-3" />
                                <span className="hidden sm:inline">{toPersianDigits(day.urgentCount)}</span>
                              </span>
                            )}
                          </div>
                          {day.totalRevenue > 0 && (
                            <div className="hidden text-[11px] text-muted-foreground truncate sm:block">
                              {formatToman(day.totalRevenue)}
                            </div>
                          )}
                        </div>
                      )}
                      {day.isFull && (
                        <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1">
                          <AlertCircle className="size-2.5 text-red-500 sm:size-4" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded bg-emerald-100 dark:bg-emerald-950/40" />
              سفارشات در محدوده مجاز
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded bg-red-100 dark:bg-red-950/40" />
              ظرفیت تکمیل شده
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded ring-1 ring-emerald-500" />
              امروز
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day detail — Modal */}
      <Dialog open={!!selectedDay} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CalendarDays className="size-5 text-primary" />
              {selectedDay ? jalaliStringToLongLabel(selectedDay) : ""}
            </DialogTitle>
            {dayDetail && (
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <Badge variant="outline" className="text-sm">
                  <ShoppingCart className="ml-1 size-3.5" />
                  {toPersianDigits(dayDetail.orderCount)} سفارش
                </Badge>
                <Badge variant="outline" className="text-sm text-emerald-700 dark:text-emerald-400">
                  {formatToman(dayDetail.totalRevenue)}
                </Badge>
                {dayDetail.urgentCount > 0 && (
                  <Badge variant="outline" className="text-sm text-amber-700 dark:text-amber-400">
                    <Zap className="ml-1 size-3.5" />
                    {toPersianDigits(dayDetail.urgentCount)} فوری
                  </Badge>
                )}
                {dayDetail.isFull && (
                  <Badge variant="outline" className="text-sm text-red-700 dark:text-red-400">
                    <AlertCircle className="ml-1 size-3.5" />
                    ظرفیت تکمیل شده
                  </Badge>
                )}
              </div>
            )}
          </DialogHeader>

          <div className="py-2">
            {dayLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-md" />
                ))}
              </div>
            ) : dayDetail && dayDetail.orders.length > 0 ? (
              <>
                <div className="space-y-2">
                  {paginatedDayOrders.map((o) => (
                    <div
                      key={o._id}
                      onClick={() => router.push(`/orders/${o._id}`)}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition hover:bg-muted/50 sm:p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold sm:text-base" dir="ltr">{o.orderNumber}</span>
                            {o.urgent && (
                              <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                <Zap className="size-2.5" />
                                فوری
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium sm:text-base">{o.customerName}</div>
                          <div className="text-xs text-muted-foreground sm:text-sm" dir="ltr">{o.customerMobile}</div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-left">
                        <Badge variant="outline" className="text-xs sm:text-sm">{o.statusTitle}</Badge>
                        <div className="text-sm font-bold sm:text-base">{formatToman(o.finalPrice)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {dayTotalPages > 1 && (
                  <div className="mt-4 flex flex-col items-center gap-2 border-t pt-3 sm:flex-row sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={safeDayPage <= 1}
                      onClick={() => setDayPage(safeDayPage - 1)}
                      className="w-full sm:w-auto"
                    >
                      <ChevronRight className="size-4" />
                      قبلی
                    </Button>
                    <span className="text-center text-xs text-muted-foreground sm:text-sm sm:order-none">
                      صفحه {toPersianDigits(safeDayPage)} از {toPersianDigits(dayTotalPages)} —
                      مجموع {toPersianDigits(dayOrders.length)} سفارش
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={safeDayPage >= dayTotalPages}
                      onClick={() => setDayPage(safeDayPage + 1)}
                      className="w-full sm:w-auto"
                    >
                      بعدی
                      <ChevronLeft className="size-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-dashed py-10 text-center">
                <p className="text-sm text-muted-foreground sm:text-base">
                  سفارشی برای این روز ثبت نشده است.
                </p>
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/orders/new">ثبت سفارش جدید</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
