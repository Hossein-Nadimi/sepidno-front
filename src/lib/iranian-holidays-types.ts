/**
 * Iranian holiday types — shared between the holidays module and callers.
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
