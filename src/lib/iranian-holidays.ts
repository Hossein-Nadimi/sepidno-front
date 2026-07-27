/**
 * Iranian weekly holiday — Friday.
 *
 * Friday is the only official weekly holiday in Iran. All other holidays
 * (solar and lunar) have been intentionally removed because:
 *  - The persian-holidays package contained incorrect entries
 *    (e.g. "راهپیمایی در پاسخ به وقایع عاشورای ۸۸" which is NOT a holiday)
 *  - Lunar Hijri conversion via Intl.DateTimeFormat has ±1 day drift
 *    compared to Iran's moon-sighting-based calendar
 *
 * Friday detection is 100% accurate because it comes directly from
 * moment-jalaali's weekday calculation.
 */

export interface IranianHoliday {
  /** Jalali month (1-12). */
  month: number;
  /** Jalali day (1-31). */
  day: number;
  /** Holiday name in Persian. */
  name: string;
  /** Category for coloring/iconography. */
  category: "friday";
}

interface MomentAdapter {
  day: () => number;
  isValid: () => boolean;
}

/**
 * Factory function that parses a Jalali date string ("1405/05/13") to a
 * moment-jalaali instance. Used to compute weekdays.
 */
export type MomentFactory = (jalaliStr: string) => MomentAdapter | null;

/**
 * Returns all Fridays in the given Jalali year as holidays.
 *
 * Friday is detected via moment-jalaali's `day()` method which returns
 * 5 for Friday (0=Sunday, 6=Saturday in Gregorian).
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

  // Scan all days of the Jalali year and find Fridays (moment.day() === 5)
  for (let jm = 1; jm <= 12; jm++) {
    const maxDays = jm <= 6 ? 31 : jm <= 11 ? 30 : 29;
    for (let jd = 1; jd <= maxDays; jd++) {
      const m = momentFactory(
        `${jalaliYear}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`,
      );
      if (!m || !m.isValid()) continue;
      if (m.day() !== 5) continue; // Friday
      map.set(key(jm, jd), {
        month: jm,
        day: jd,
        name: "جمعه",
        category: "friday",
      });
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
