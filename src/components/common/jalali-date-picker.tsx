"use client";

import { useState, useMemo } from "react";
import moment from "moment-jalaali";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils";

moment.loadPersian({ dialect: "persian-modern", usePersianDigits: false });

interface JalaliDatePickerProps {
  value: string; // format: 1403/05/15
  onChange: (value: string) => void;
  minDate?: string; // format: 1403/05/15
}

const WEEK_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

export function JalaliDatePicker({ value, onChange, minDate }: JalaliDatePickerProps) {
  const parsed = value ? moment(value, "jYYYY/jMM/jDD", true) : moment();
  const [viewYear, setViewYear] = useState(parsed.jYear());
  const [viewMonth, setViewMonth] = useState(parsed.jMonth()); // 0-11

  const selectedMoment = value ? moment(value, "jYYYY/jMM/jDD", true) : null;
  const minMoment = minDate ? moment(minDate, "jYYYY/jMM/jDD", true) : null;

  const daysInMonth = moment.jDaysInMonth(viewYear, viewMonth);

  // First day of the Jalali month — figure out what weekday it falls on.
  // moment's day() returns 0=Saturday in Persian locale... actually it's locale-dependent.
  // Let's compute manually: get the first day's weekday.
  const firstDay = moment(`${viewYear}/${viewMonth + 1}/1`, "jYYYY/jMM/jDD");
  // In moment-jalaali with Persian locale, day() returns 0=Saturday, 1=Sunday, ... 6=Friday
  // But our WEEK_DAYS starts with "ش" (Saturday) so this aligns.
  const firstWeekday = firstDay.day();

  const days = useMemo(() => {
    const arr: Array<{ day: number; disabled: boolean; isToday: boolean } | null> = [];
    for (let i = 0; i < firstWeekday; i++) arr.push(null);
    const today = moment();
    for (let d = 1; d <= daysInMonth; d++) {
      const dayMoment = moment(`${viewYear}/${viewMonth + 1}/${d}`, "jYYYY/jMM/jDD");
      const disabled = minMoment ? dayMoment.isBefore(minMoment, "day") : false;
      const isToday = dayMoment.isSame(today, "day");
      arr.push({ day: d, disabled, isToday });
    }
    return arr;
  }, [viewYear, viewMonth, firstWeekday, daysInMonth, minMoment]);

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
    <div className="rounded-lg border bg-popover p-3 shadow-md" style={{ width: "320px" }}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={prevMonth}>
          <ChevronRight className="size-4" />
        </Button>
        <span className="text-sm font-medium">
          {MONTH_NAMES[viewMonth]} {toPersianDigits(viewYear)}
        </span>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={nextMonth}>
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      {/* Week days */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEK_DAYS.map((d, i) => (
          <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          return (
            <button
              key={i}
              type="button"
              disabled={d.disabled}
              onClick={() => selectDay(d.day)}
              className={cn(
                "flex h-9 items-center justify-center rounded-md text-sm transition-colors",
                d.disabled && "cursor-not-allowed text-muted-foreground/40",
                !d.disabled && "hover:bg-accent",
                isSelected(d.day) && "bg-primary text-primary-foreground hover:bg-primary",
                !isSelected(d.day) && d.isToday && "ring-1 ring-primary",
              )}
            >
              {toPersianDigits(d.day)}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 flex justify-between border-t pt-2">
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
          <span className="text-xs text-muted-foreground py-1">
            انتخاب: {value}
          </span>
        )}
      </div>
    </div>
  );
}
