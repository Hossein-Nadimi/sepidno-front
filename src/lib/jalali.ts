import moment from "moment-jalaali";

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
