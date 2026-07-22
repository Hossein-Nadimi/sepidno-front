"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import moment from "moment-jalaali";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, toPersianDigits } from "@/lib/utils";
import { calendarService } from "@/services";

moment.loadPersian({ dialect: "persian-modern", usePersianDigits: false });

interface JalaliDatePickerProps {
  value: string; // format: 1403/05/15
  onChange: (value: string) => void;
  minDate?: string; // format: 1403/05/15
  /** Called when the user clicks outside the calendar (or selects a date). */
  onClose?: () => void;
  /**
   * When true, the picker queries the orders calendar API and shows the order
   * count for each day (and highlights days at/above maxDailyOrders in red).
   * Default: true.
   */
  showOrderCounts?: boolean;
}

const WEEK_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

export function JalaliDatePicker({
  value,
  onChange,
  minDate,
  onClose,
  showOrderCounts = true,
}: JalaliDatePickerProps) {
  const parsed = value ? moment(value, "jYYYY/jMM/jDD", true) : moment();
  const [viewYear, setViewYear] = useState(parsed.jYear());
  const [viewMonth, setViewMonth] = useState(parsed.jMonth()); // 0-11

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
    enabled: showOrderCounts,
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
    // Use mousedown so we catch the click before any other handler
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

  return (
    <div
      ref={containerRef}
      className="mx-auto w-full rounded-lg border bg-popover p-3 shadow-lg sm:p-4"
      style={{ maxWidth: "400px" }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon" className="size-9" onClick={prevMonth}>
          <ChevronRight className="size-5" />
        </Button>
        <span className="text-base font-bold">
          {MONTH_NAMES[viewMonth]} {toPersianDigits(viewYear)}
        </span>
        <Button type="button" variant="ghost" size="icon" className="size-9" onClick={nextMonth}>
          <ChevronLeft className="size-5" />
        </Button>
      </div>

      {/* Week days */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEK_DAYS.map((d, i) => (
          <div key={i} className="py-1.5 text-center text-xs font-bold text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (!d) return <div key={i} className="h-16" />;
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
                "relative flex h-16 flex-col items-center justify-start gap-0.5 rounded-md pt-2 text-base font-semibold transition-colors",
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
                    "absolute bottom-1 left-0 right-0 text-[10px] leading-none font-bold",
                    isSelected(d.day) ? "text-primary-foreground" : "text-muted-foreground",
                    d.isFull && !isSelected(d.day) && "text-red-600 dark:text-red-400",
                  )}
                >
                  {toPersianDigits(d.orderCount)}
                  {maxDaily > 0 && `/${toPersianDigits(maxDaily)}`}
                </span>
              )}
              {d.isFull && !d.disabled && (
                <AlertCircle className="absolute right-1 top-1 size-3 text-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const today = moment();
            setViewYear(today.jYear());
            setViewMonth(today.jMonth());
            onChange(today.format("jYYYY/jMM/jDD"));
          }}
        >
          امروز
        </Button>
        {value && (
          <span className="text-sm text-muted-foreground">انتخاب: {value}</span>
        )}
      </div>

      {showOrderCounts && maxDaily > 0 && (
        <div className="mt-2 flex items-center gap-1.5 border-t pt-2 text-xs text-muted-foreground">
          <span className="inline-block size-2.5 rounded bg-red-100 dark:bg-red-950/40" />
          روزهای پر (به حداکثر رسیده)
        </div>
      )}
    </div>
  );
}
