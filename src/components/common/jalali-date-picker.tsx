"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import moment from "moment-jalaali";
import { ChevronLeft, ChevronRight, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, toPersianDigits } from "@/lib/utils";
import { calendarService } from "@/services";

moment.loadPersian({ dialect: "persian-modern", usePersianDigits: false });

/**
 * JalaliDatePicker — shared calendar component for **order scheduling**
 * (delivery dates, expense dates, etc.).
 *
 * Features:
 * - Shows per-day order counts via the orders calendar API
 * - Highlights "full" days in red when the day hits its maxDailyOrders cap
 * - Quick "امروز" (Today) jump button in the footer
 * - Optional minDate for forward-only scheduling
 * - Click on the header title to open a 12-year grid + 12-month grid for fast
 *   year/month jumping (useful when scheduling deliveries far in the future)
 *
 * For birthdays / historical dates, use the dedicated `<BirthdayPicker />`
 * component instead — it has no order-related UI, no "today" button, and no
 * API calls.
 */

interface JalaliDatePickerProps {
  value: string; // format: 1403/05/15
  onChange: (value: string) => void;
  minDate?: string; // format: 1403/05/15
  /** Called when the user clicks outside the calendar (or selects a date). */
  onClose?: () => void;
  /**
   * When true (default), the picker queries the orders calendar API and shows
   * the order count for each day (and highlights days at/above maxDailyOrders
   * in red).
   */
  showOrderCounts?: boolean;
}

const WEEK_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

// Range of years selectable in the year-picker grid.
const MIN_YEAR = 1300;
const MAX_YEAR_FALLBACK = 1410;

export function JalaliDatePicker({
  value,
  onChange,
  minDate,
  onClose,
  showOrderCounts = true,
}: JalaliDatePickerProps) {
  const todayMoment = moment();

  const parsed = value ? moment(value, "jYYYY/jMM/jDD", true) : todayMoment;
  const [viewYear, setViewYear] = useState(parsed.jYear());
  const [viewMonth, setViewMonth] = useState(parsed.jMonth()); // 0-11
  // "days" shows the day grid; "years" shows a 4×3 year grid for fast jumping
  const [pickerMode, setPickerMode] = useState<"days" | "years">("days");
  // First year rendered in the year grid (rounded down to a multiple of 12)
  const [yearPageStart, setYearPageStart] = useState(() => {
    const y = parsed.jYear();
    return Math.floor((y - MIN_YEAR) / 12) * 12 + MIN_YEAR;
  });

  const selectedMoment = value ? moment(value, "jYYYY/jMM/jDD", true) : null;
  const minMoment = minDate ? moment(minDate, "jYYYY/jMM/jDD", true) : null;

  const daysInMonth = moment.jDaysInMonth(viewYear, viewMonth);
  const firstDay = moment(`${viewYear}/${viewMonth + 1}/1`, "jYYYY/jMM/jDD");
  const firstWeekday = firstDay.day();

  // Fetch calendar data for the visible month to show order counts per day
  const jalaliMonth = `${viewYear}/${String(viewMonth + 1).padStart(2, "0")}`;
  const { data: calendarData } = useQuery({
    queryKey: ["orders-calendar", jalaliMonth],
    queryFn: () => calendarService.getMonth(jalaliMonth),
    enabled: showOrderCounts && pickerMode === "days",
  });

  // Build a map of jalaliDate → day info for quick lookup
  const dayMap = useMemo(() => {
    const map = new Map<
      string,
      { orderCount: number; isFull: boolean; urgentCount: number }
    >();
    if (calendarData?.days) {
      for (const d of calendarData.days) {
        map.set(d.jalaliDate, {
          orderCount: d.orderCount,
          isFull: d.isFull,
          urgentCount: d.urgentCount,
        });
      }
    }
    return map;
  }, [calendarData]);

  const maxDaily = calendarData?.summary.maxDailyOrders ?? 0;

  const days = useMemo(() => {
    const arr: Array<{
      day: number;
      disabled: boolean;
      isToday: boolean;
      jalaliDate: string;
      orderCount: number;
      isFull: boolean;
      urgentCount: number;
    } | null> = [];
    for (let i = 0; i < firstWeekday; i++) arr.push(null);
    const today = moment();
    for (let d = 1; d <= daysInMonth; d++) {
      const dayMoment = moment(`${viewYear}/${viewMonth + 1}/${d}`, "jYYYY/jMM/jDD");
      const disabled = minMoment ? dayMoment.isBefore(minMoment, "day") : false;
      const isToday = dayMoment.isSame(today, "day");
      const jalaliDate = dayMoment.format("jYYYY/jMM/jDD");
      const info = dayMap.get(jalaliDate);
      arr.push({
        day: d,
        disabled,
        isToday,
        jalaliDate,
        orderCount: info?.orderCount ?? 0,
        isFull: info?.isFull ?? false,
        urgentCount: info?.urgentCount ?? 0,
      });
    }
    return arr;
  }, [viewYear, viewMonth, firstWeekday, daysInMonth, minMoment, dayMap]);

  // 4×3 grid of years for the year-picker mode (12 years per page)
  const yearGrid = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 12; i++) arr.push(yearPageStart + i);
    return arr;
  }, [yearPageStart]);

  const maxYearForGrid = Math.max(todayMoment.jYear(), MAX_YEAR_FALLBACK);
  const minYearForGrid = minMoment ? minMoment.jYear() : MIN_YEAR;

  // Close on outside click
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!onClose) return;
    const handleClose = onClose;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose!();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!onClose) return;
    const handleClose = onClose;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose!();
    }
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function selectDay(day: number) {
    const selected = `${viewYear}/${String(viewMonth + 1).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
    onChange(selected);
  }

  function isSelected(day: number) {
    if (!selectedMoment) return false;
    return (
      selectedMoment.jYear() === viewYear &&
      selectedMoment.jMonth() === viewMonth &&
      selectedMoment.jDate() === day
    );
  }

  function jumpToToday() {
    const t = moment();
    setViewYear(t.jYear());
    setViewMonth(t.jMonth());
    setYearPageStart(Math.floor((t.jYear() - MIN_YEAR) / 12) * 12 + MIN_YEAR);
    onChange(t.format("jYYYY/jMM/jDD"));
  }

  // Click the title to toggle year-grid mode (so users can jump decades back
  // for birthdays, etc.). Clicking a year switches back to day mode for that
  // year; the month grid remains as-is.
  function toggleYearPicker() {
    setPickerMode((m) => {
      if (m === "days") {
        setYearPageStart(Math.floor((viewYear - MIN_YEAR) / 12) * 12 + MIN_YEAR);
        return "years";
      }
      return "days";
    });
  }

  function pickYear(y: number) {
    setViewYear(y);
    setPickerMode("days");
  }

  function prevYearPage() {
    setYearPageStart((s) => Math.max(MIN_YEAR, s - 12));
  }
  function nextYearPage() {
    setYearPageStart((s) => s + 12);
  }

  function isMonthDisabled(monthIdx: number) {
    // Disabled if entire month is before minMoment's month
    const lastDay = moment.jDaysInMonth(viewYear, monthIdx);
    const lastOfMonth = moment(`${viewYear}/${monthIdx + 1}/${lastDay}`, "jYYYY/jMM/jDD");
    if (minMoment && lastOfMonth.isBefore(minMoment, "day")) return true;
    return false;
  }

  return (
    <div
      ref={containerRef}
      className="w-full min-w-[260px] max-w-[400px] rounded-lg border bg-popover p-2.5 shadow-lg sm:p-3.5"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-1 sm:mb-4">
        {pickerMode === "days" ? (
          <Button type="button" variant="ghost" size="icon" className="size-8 sm:size-9" onClick={prevMonth}>
            <ChevronRight className="size-4 sm:size-5" />
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="icon" className="size-8 sm:size-9" onClick={prevYearPage}>
            <ChevronRight className="size-4 sm:size-5" />
          </Button>
        )}
        <button
          type="button"
          onClick={toggleYearPicker}
          className="flex items-center gap-1 rounded px-2 py-1 text-sm font-bold transition-colors hover:bg-accent sm:text-base"
        >
          {pickerMode === "days" ? (
            <>
              <span>{MONTH_NAMES[viewMonth]}</span>
              <span>{toPersianDigits(viewYear)}</span>
              <ChevronDown className="size-3.5 opacity-60" />
            </>
          ) : (
            <>
              <span>
                {toPersianDigits(yearPageStart)} - {toPersianDigits(yearPageStart + 11)}
              </span>
              <ChevronDown className="size-3.5 opacity-60" />
            </>
          )}
        </button>
        {pickerMode === "days" ? (
          <Button type="button" variant="ghost" size="icon" className="size-8 sm:size-9" onClick={nextMonth}>
            <ChevronLeft className="size-4 sm:size-5" />
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="icon" className="size-8 sm:size-9" onClick={nextYearPage}>
            <ChevronLeft className="size-4 sm:size-5" />
          </Button>
        )}
      </div>

      {pickerMode === "days" ? (
        <>
          {/* Week days */}
          <div className="mb-1 grid grid-cols-7 gap-0.5 sm:gap-1">
            {WEEK_DAYS.map((d, i) => (
              <div
                key={i}
                className="py-1 text-center text-[10px] font-bold text-muted-foreground sm:text-xs sm:py-1.5"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {days.map((d, i) => {
              if (!d) return <div key={i} className="h-9 sm:h-16" />;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={d.disabled}
                  onClick={() => selectDay(d.day)}
                  title={
                    showOrderCounts && d.orderCount > 0
                      ? `${toPersianDigits(d.orderCount)} سفارش${maxDaily > 0 ? ` / ${toPersianDigits(maxDaily)}` : ""}`
                      : undefined
                  }
                  className={cn(
                    "relative flex h-9 flex-col items-center justify-start gap-0.5 rounded-md pt-1 text-sm font-semibold transition-colors sm:h-16 sm:pt-2 sm:text-base",
                    d.disabled && "cursor-not-allowed text-muted-foreground/40",
                    !d.disabled && "hover:bg-accent",
                    isSelected(d.day) && "bg-primary text-primary-foreground hover:bg-primary",
                    !isSelected(d.day) && d.isToday && "ring-1 ring-primary",
                    !isSelected(d.day) && d.isFull && !d.disabled && "bg-red-50 dark:bg-red-950/30",
                  )}
                >
                  <span>{toPersianDigits(d.day)}</span>
                  {showOrderCounts && d.orderCount > 0 && !d.disabled && (
                    <span
                      className={cn(
                        "absolute bottom-0.5 left-0 right-0 text-[8px] leading-none font-bold sm:bottom-1 sm:text-[10px]",
                        isSelected(d.day) ? "text-primary-foreground" : "text-muted-foreground",
                        d.isFull && !isSelected(d.day) && "text-red-600 dark:text-red-400",
                      )}
                    >
                      {toPersianDigits(d.orderCount)}
                      {maxDaily > 0 && `/${toPersianDigits(maxDaily)}`}
                    </span>
                  )}
                  {d.isFull && !d.disabled && (
                    <AlertCircle className="absolute right-0.5 top-0.5 size-2.5 text-red-500 sm:right-1 sm:top-1 sm:size-3" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Year grid: 4 cols × 3 rows = 12 years per page */}
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
            {yearGrid.map((y) => {
              const disabled = y < minYearForGrid || y > maxYearForGrid;
              const isSelectedYear = selectedMoment?.jYear() === y;
              const isCurrentYear = todayMoment.jYear() === y;
              return (
                <button
                  key={y}
                  type="button"
                  disabled={disabled}
                  onClick={() => pickYear(y)}
                  className={cn(
                    "h-12 rounded-md text-sm font-bold transition-colors sm:h-16 sm:text-base",
                    disabled && "cursor-not-allowed text-muted-foreground/40",
                    !disabled && "hover:bg-accent",
                    isSelectedYear && "bg-primary text-primary-foreground hover:bg-primary",
                    !isSelectedYear && isCurrentYear && !disabled && "ring-1 ring-primary",
                  )}
                >
                  {toPersianDigits(y)}
                </button>
              );
            })}
          </div>

          {/* Month quick-grid (12 months for current viewYear) */}
          <div className="mt-3 border-t pt-3">
            <div className="mb-2 text-center text-xs font-bold text-muted-foreground">
              انتخاب ماه — {toPersianDigits(viewYear)}
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
              {MONTH_NAMES.map((m, idx) => {
                const disabled = isMonthDisabled(idx);
                const isSelectedMonth =
                  selectedMoment?.jYear() === viewYear && selectedMoment?.jMonth() === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setViewMonth(idx);
                      setPickerMode("days");
                    }}
                    className={cn(
                      "h-9 rounded-md text-xs font-semibold transition-colors sm:h-10 sm:text-sm",
                      disabled && "cursor-not-allowed text-muted-foreground/40",
                      !disabled && "hover:bg-accent",
                      isSelectedMonth && "bg-primary text-primary-foreground hover:bg-primary",
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
        <Button type="button" variant="ghost" size="sm" onClick={jumpToToday}>
          امروز
        </Button>
        {value && (
          <span className="text-xs text-muted-foreground sm:text-sm">انتخاب: {value}</span>
        )}
      </div>

      {showOrderCounts && maxDaily > 0 && pickerMode === "days" && (
        <div className="mt-2 flex items-center gap-1.5 border-t pt-2 text-xs text-muted-foreground">
          <span className="inline-block size-2.5 rounded bg-red-100 dark:bg-red-950/40" />
          روزهای پر (به حداکثر رسیده)
        </div>
      )}
    </div>
  );
}
