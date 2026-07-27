/**
 * Iranian official public holidays.
 *
 * Data source: `iranian-holidays-data.json` — a curated list of all Iranian
 * public holidays from 1405 to 1410, exported from the official Iranian
 * calendar (time.ir). Each entry is keyed by Jalali year, then by "M/D".
 *
 * Friday (weekly holiday) is also marked — detected via moment-jalaali.
 *
 * For years outside the 1405-1410 range, only Fridays are returned.
 */

import holidaysData from "./iranian-holidays-data.json";
import type { IranianHoliday } from "./iranian-holidays-types";

export type { IranianHoliday };

interface MomentAdapter {
  day: () => number;
  isValid: () => boolean;
}

/**
 * Factory function that parses a Jalali date string ("1405/05/13") to a
 * moment-jalaali instance. Used to detect Fridays.
 */
export type MomentFactory = (jalaliStr: string) => MomentAdapter | null;

// Cast the imported JSON to a typed record.
// Structure: { "1405": { "1/1": "نوروز", ... }, "1406": { ... }, ... }
const HOLIDAYS_BY_YEAR = holidaysData as Record<string, Record<string, string>>;

/**
 * Returns all Iranian public holidays for the given Jalali year.
 *
 * Combines:
 *  - Official holidays from the data file (1405-1410 only)
 *  - All Fridays (weekly holiday, detected via moment-jalaali)
 *
 * Returns a Map keyed by "M/D" (e.g. "5/2" for 2nd of مرداد) for O(1)
 * lookup by the calendar component.
 *
 * @param jalaliYear The Jalali year (e.g. 1405)
 * @param momentFactory Factory that parses a Jalali date string to a
 *   moment-jalaali instance. MUST use `moment(str, "jYYYY/jMM/jDD", true)`.
 */
export function getIranianHolidays(
  jalaliYear: number,
  momentFactory: MomentFactory,
): Map<string, IranianHoliday> {
  const map = new Map<string, IranianHoliday>();
  const key = (m: number, d: number) => `${m}/${d}`;

  // 1. Add official holidays from the data file (if available for this year)
  const yearKey = String(jalaliYear);
  const yearHolidays = HOLIDAYS_BY_YEAR[yearKey];
  if (yearHolidays) {
    for (const [k, name] of Object.entries(yearHolidays)) {
      const [m, d] = k.split("/").map(Number);
      map.set(key(m, d), {
        month: m,
        day: d,
        name,
        category: "national",
      });
    }
  }

  // 2. Add all Fridays (weekly holiday in Iran)
  // moment.day() returns 0=Sunday, 6=Saturday. Friday = 5.
  for (let jm = 1; jm <= 12; jm++) {
    const maxDays = jm <= 6 ? 31 : jm <= 11 ? 30 : 29;
    for (let jd = 1; jd <= maxDays; jd++) {
      const m = momentFactory(
        `${jalaliYear}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`,
      );
      if (!m || !m.isValid()) continue;
      if (m.day() !== 5) continue; // Friday
      const k = key(jm, jd);
      // Don't overwrite an official holiday with "جمعه" — keep both info
      // but prefer the official holiday name.
      if (!map.has(k)) {
        map.set(k, {
          month: jm,
          day: jd,
          name: "جمعه",
          category: "friday",
        });
      }
    }
  }

  return map;
}

/**
 * Lookup a single Jalali date in the holiday map.
 * Returns the holiday object or undefined.
 */
export function lookupHoliday(
  holidays: Map<string, IranianHoliday>,
  jalaliMonth: number,
  jalaliDay: number,
): IranianHoliday | undefined {
  return holidays.get(`${jalaliMonth}/${jalaliDay}`);
}
