import moment from "moment-jalaali";
import { toPersianDigits } from "@/lib/utils";

moment.loadPersian({ dialect: "persian-modern", usePersianDigits: false });

const DEFAULT_FORMAT = "jYYYY/jMM/jDD";
const DEFAULT_DATETIME_FORMAT = "jYYYY/jMM/jDD - HH:mm";

/** Format a Date / ISO string to a Jalali date string (e.g. 1403/05/12). */
export function toJalali(date: Date | string | number | null | undefined, format = DEFAULT_FORMAT): string {
  if (!date) return "—";
  const m = moment(date);
  if (!m.isValid()) return "—";
  return m.format(format);
}

/** Format a Date / ISO string to a Jalali date-time string. */
export function toJalaliDateTime(date: Date | string | number | null | undefined): string {
  return toJalali(date, DEFAULT_DATETIME_FORMAT);
}

/** Convert a Jalali date string (1403/05/12) to a Gregorian Date. */
export function fromJalali(jalali: string): Date {
  const m = moment(jalali, "jYYYY/jMM/jDD", true);
  if (!m.isValid()) {
    throw new Error(`Invalid Jalali date: ${jalali}`);
  }
  return m.toDate();
}

/** Returns true when the input is a valid Jalali date (1403/05/12). */
export function isValidJalali(jalali: string): boolean {
  return moment(jalali, "jYYYY/jMM/jDD", true).isValid();
}

/** Current Jalali date as 1403/05/12. */
export function todayJalali(): string {
  return moment().format(DEFAULT_FORMAT);
}

/** Format relative time in Persian (e.g. "۳ ساعت پیش"). */
export function fromNow(date: Date | string | number | null | undefined): string {
  if (!date) return "—";
  const m = moment(date);
  if (!m.isValid()) return "—";
  return m.fromNow();
}

/** Persian weekday names (Iranian week: Saturday=0 ... Friday=6). */
export const JALALI_WEEKDAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];

/** Persian month names. */
export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

/**
 * Format a date as "چهارشنبه ۳۱ تیر" — Persian weekday + day + month name.
 * Useful for the calendar widgets where we want a friendly, human-readable label.
 */
export function toJalaliLongLabel(date: Date | string | number | null | undefined): string {
  if (!date) return "—";
  const m = moment(date);
  if (!m.isValid()) return "—";
  // moment-jalaali: day-of-week 0 = Saturday in Iranian calendar
  // moment.day(): Sunday=0, Monday=1, ..., Saturday=6
  const iranianDow = (m.day() + 1) % 7;
  const day = m.jDate();
  const month = m.jMonth();
  return `${JALALI_WEEKDAYS[iranianDow]} ${toPersianDigits(day)} ${JALALI_MONTHS[month]}`;
}

/** Format a Jalali date string (jYYYY/jMM/jDD) as "چهارشنبه ۳۱ تیر". */
export function jalaliStringToLongLabel(jalaliDate: string): string {
  const m = moment(jalaliDate, "jYYYY/jMM/jDD", true);
  if (!m.isValid()) return jalaliDate;
  const iranianDow = (m.day() + 1) % 7;
  const day = m.jDate();
  const month = m.jMonth();
  return `${JALALI_WEEKDAYS[iranianDow]} ${toPersianDigits(day)} ${JALALI_MONTHS[month]}`;
}
