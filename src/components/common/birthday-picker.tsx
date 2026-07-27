"use client";

import { useState, useMemo, useEffect } from "react";
import moment from "moment-jalaali";
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn, toPersianDigits } from "@/lib/utils";
import { getIranianHolidays, type IranianHoliday } from "@/lib/iranian-holidays";

moment.loadPersian({ dialect: "persian-modern", usePersianDigits: false });

/**
 * BirthdayPicker — a dedicated Jalali date picker for historical dates
 * (birthdays, customer DOB, etc.).
 *
 * Why a Dialog (not an inline dropdown like JalaliDatePicker)?
 * - Visually distinct from the order-scheduling calendar so users immediately
 *   recognize it as a different component.
 * - On mobile, an inline calendar can get clipped by parent containers
 *   (overflow:hidden, transforms, etc.) — a modal avoids all clipping issues.
 * - Gives plenty of room for the year/month quick-jump grid, which is
 *   essential for birthdays (user may need to navigate back decades).
 *
 * This component has ZERO coupling to the orders calendar API:
 * - No useQuery, no calendarService, no order counts, no "full day" badges
 * - No "today" jump button (today is rarely someone's birthday)
 * - Has a "پاک کردن" (clear) button instead, which is far more useful here.
 *
 * Future dates are disabled — birthdays can't be in the future.
 */

const WEEK_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

const MIN_YEAR = 1300;

interface BirthdayPickerProps {
  /** Controls whether the dialog is open. */
  open: boolean;
  /** Called when user closes the dialog (X button, Escape, backdrop click). */
  onOpenChange: (open: boolean) => void;
  /** Current value in Jalali format: 1403/05/15. Empty string = no date. */
  value: string;
  /** Called when user picks or clears a date. */
  onChange: (value: string) => void;
}

type View = "days" | "months" | "years";

export function BirthdayPicker({
  open,
  onOpenChange,
  value,
  onChange,
}: BirthdayPickerProps) {
  const todayMoment = moment();
  const parsed = value ? moment(value, "jYYYY/jMM/jDD", true) : todayMoment;

  const [view, setView] = useState<View>("days");
  const [viewYear, setViewYear] = useState(parsed.jYear());
  const [viewMonth, setViewMonth] = useState(parsed.jMonth()); // 0-11
  const [yearPageStart, setYearPageStart] = useState(() => {
    const y = parsed.jYear();
    return Math.floor((y - MIN_YEAR) / 12) * 12 + MIN_YEAR;
  });

  // Reset to "days" view + sync to value each time dialog opens.
  // This setState-in-effect is intentional — we need to reset the picker's
  // internal view state to the current value when the dialog opens, otherwise
  // reopening it after navigating elsewhere would show stale view state.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      const p = value ? moment(value, "jYYYY/jMM/jDD", true) : moment();
      setViewYear(p.jYear());
      setViewMonth(p.jMonth());
      setYearPageStart(Math.floor((p.jYear() - MIN_YEAR) / 12) * 12 + MIN_YEAR);
      setView("days");
    }
  }, [open, value]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const selectedMoment = value ? moment(value, "jYYYY/jMM/jDD", true) : null;

  const daysInMonth = moment.jDaysInMonth(viewYear, viewMonth);
  const firstDay = moment(`${viewYear}/${viewMonth + 1}/1`, "jYYYY/jMM/jDD");
  // moment.day() returns 0=Sunday, 6=Saturday (Gregorian week).
  // Our WEEK_DAYS array is in Iranian week order: 0=شنبه(Sat), 1=یکشنبه(Sun), ..., 6=جمعه(Fri).
  // Convert Gregorian day-of-week → Iranian week position with (day()+1)%7.
  const firstWeekday = (firstDay.day() + 1) % 7;

  // Iranian weekly holiday — Friday only.
  // See jalali-date-picker.tsx for details.
  const holidays = useMemo(
    () =>
      getIranianHolidays(viewYear, (jalaliStr) => {
        const m = moment(jalaliStr, "jYYYY/jMM/jDD", true);
        return m.isValid() ? (m as never) : null;
      }),
    [viewYear],
  );

  const days = useMemo(() => {
    const arr: Array<{
      day: number;
      isFuture: boolean;
      isToday: boolean;
      holiday?: IranianHoliday;
    } | null> = [];
    for (let i = 0; i < firstWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dayMoment = moment(
        `${viewYear}/${viewMonth + 1}/${d}`,
        "jYYYY/jMM/jDD",
      );
      arr.push({
        day: d,
        isFuture: dayMoment.isAfter(todayMoment, "day"),
        isToday: dayMoment.isSame(todayMoment, "day"),
        holiday: holidays.get(`${viewMonth + 1}/${d}`),
      });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth, firstWeekday, daysInMonth, holidays]);

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 12; i++) arr.push(yearPageStart + i);
    return arr;
  }, [yearPageStart]);

  const currentYear = todayMoment.jYear();

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    // Block navigation into future months
    if (viewYear === currentYear && viewMonth >= todayMoment.jMonth()) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }
  function selectDay(day: number) {
    const selected = `${viewYear}/${String(viewMonth + 1).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
    onChange(selected);
    onOpenChange(false);
  }
  function isSelected(day: number) {
    if (!selectedMoment) return false;
    return (
      selectedMoment.jYear() === viewYear &&
      selectedMoment.jMonth() === viewMonth &&
      selectedMoment.jDate() === day
    );
  }
  function pickYear(y: number) {
    setViewYear(y);
    // If new year+month would land in the future, clamp month
    if (y === currentYear && viewMonth > todayMoment.jMonth()) {
      setViewMonth(todayMoment.jMonth());
    }
    setView("months");
  }
  function pickMonth(idx: number) {
    setViewMonth(idx);
    setView("days");
  }
  function prevYearPage() {
    setYearPageStart((s) => Math.max(MIN_YEAR, s - 12));
  }
  function nextYearPage() {
    setYearPageStart((s) => Math.min(currentYear - 11, s + 12));
  }
  function handleClear() {
    onChange("");
    onOpenChange(false);
  }

  function isMonthDisabled(idx: number) {
    if (viewYear === currentYear && idx > todayMoment.jMonth()) return true;
    return false;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="pb-2 pt-4 px-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CalendarIcon className="size-4 text-primary" />
            انتخاب تاریخ تولد
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2">
          {/* Header — clicking the title switches view */}
          <div className="mb-3 flex items-center justify-between gap-1">
            {view === "days" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                onClick={prevMonth}
                aria-label="ماه قبل"
              >
                <ChevronRight className="size-5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                onClick={prevYearPage}
                disabled={yearPageStart <= MIN_YEAR}
                aria-label="صفحه قبل"
              >
                <ChevronRight className="size-5" />
              </Button>
            )}

            <div className="flex flex-1 items-center justify-center gap-1">
              {view === "days" && (
                <>
                  <button
                    type="button"
                    onClick={() => setView("months")}
                    className="rounded-md px-2 py-1.5 text-sm font-bold transition-colors hover:bg-accent sm:text-base"
                  >
                    {MONTH_NAMES[viewMonth]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("years")}
                    className="rounded-md px-2 py-1.5 text-sm font-bold transition-colors hover:bg-accent sm:text-base"
                  >
                    {toPersianDigits(viewYear)}
                  </button>
                </>
              )}
              {view === "months" && (
                <button
                  type="button"
                  onClick={() => setView("days")}
                  className="rounded-md px-2 py-1.5 text-sm font-bold transition-colors hover:bg-accent sm:text-base"
                >
                  انتخاب ماه — {toPersianDigits(viewYear)}
                </button>
              )}
              {view === "years" && (
                <button
                  type="button"
                  onClick={() => setView("days")}
                  className="rounded-md px-2 py-1.5 text-sm font-bold transition-colors hover:bg-accent sm:text-base"
                >
                  {toPersianDigits(yearPageStart)} — {toPersianDigits(yearPageStart + 11)}
                </button>
              )}
            </div>

            {view === "days" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                onClick={nextMonth}
                disabled={viewYear >= currentYear && viewMonth >= todayMoment.jMonth()}
                aria-label="ماه بعد"
              >
                <ChevronLeft className="size-5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                onClick={nextYearPage}
                disabled={yearPageStart + 12 > currentYear}
                aria-label="صفحه بعد"
              >
                <ChevronLeft className="size-5" />
              </Button>
            )}
          </div>

          {/* Body */}
          {view === "days" && (
            <>
              <div className="mb-1 grid grid-cols-7 gap-0.5 sm:gap-1">
                {WEEK_DAYS.map((d, i) => (
                  <div
                    key={i}
                    className="py-1.5 text-center text-xs font-bold text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {days.map((d, i) => {
                  if (!d) return <div key={i} className="h-11 sm:h-12" />;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={d.isFuture}
                      onClick={() => selectDay(d.day)}
                      title={d.holiday?.name}
                      className={cn(
                        "relative flex h-11 items-center justify-center rounded-md text-sm font-semibold transition-colors sm:h-12 sm:text-base",
                        d.isFuture && "cursor-not-allowed text-muted-foreground/30",
                        !d.isFuture && "hover:bg-accent",
                        isSelected(d.day) && "bg-primary text-primary-foreground hover:bg-primary",
                        !isSelected(d.day) && d.isToday && !d.isFuture && "ring-1 ring-primary",
                        // Holiday — red day number (unless selected)
                        !isSelected(d.day) && d.holiday && !d.isFuture && "text-red-600 dark:text-red-400",
                      )}
                    >
                      {toPersianDigits(d.day)}
                      {d.holiday && !isSelected(d.day) && !d.isFuture && (
                        <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {view === "months" && (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {MONTH_NAMES.map((m, idx) => {
                const disabled = isMonthDisabled(idx);
                const isSelectedMonth =
                  selectedMoment?.jYear() === viewYear &&
                  selectedMoment?.jMonth() === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={disabled}
                    onClick={() => pickMonth(idx)}
                    className={cn(
                      "h-14 rounded-md text-sm font-semibold transition-colors sm:h-16",
                      disabled && "cursor-not-allowed text-muted-foreground/30",
                      !disabled && "hover:bg-accent",
                      isSelectedMonth && "bg-primary text-primary-foreground hover:bg-primary",
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {view === "years" && (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {years.map((y) => {
                const isFuture = y > currentYear;
                const isSelectedYear = selectedMoment?.jYear() === y;
                const isCurrentYear = currentYear === y;
                return (
                  <button
                    key={y}
                    type="button"
                    disabled={isFuture}
                    onClick={() => pickYear(y)}
                    className={cn(
                      "h-14 rounded-md text-base font-bold transition-colors sm:h-16",
                      isFuture && "cursor-not-allowed text-muted-foreground/30",
                      !isFuture && "hover:bg-accent",
                      isSelectedYear && "bg-primary text-primary-foreground hover:bg-primary",
                      !isSelectedYear && isCurrentYear && !isFuture && "ring-1 ring-primary",
                    )}
                  >
                    {toPersianDigits(y)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 border-t px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!value}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5 ml-1" />
            پاک کردن
          </Button>
          {value ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
              <CalendarIcon className="size-3.5" />
              {value}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">تاریخ انتخاب نشده</span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-3.5 ml-1" />
            بستن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
