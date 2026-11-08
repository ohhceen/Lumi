import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { YearMonth } from "./types";

export const DEFAULT_TIMEZONE = "Asia/Makassar";

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Jakarta", label: "WIB — Asia/Jakarta (UTC+7)" },
  { value: "Asia/Makassar", label: "WITA — Asia/Makassar (UTC+8)" },
  { value: "Asia/Jayapura", label: "WIT — Asia/Jayapura (UTC+9)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (UTC+8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (UTC+9)" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "UTC", label: "UTC" },
] as const;

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Calendar date (YYYY-MM-DD) of `now` as seen in timezone `tz`. */
export function todayInTimezone(tz: string, now: Date = new Date()): string {
  const safeTz = isValidTimezone(tz) ? tz : DEFAULT_TIMEZONE;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function currentYearMonth(tz: string, now: Date = new Date()): YearMonth {
  const [y, m] = todayInTimezone(tz, now).split("-").map(Number);
  return { year: y, month: m };
}

export function isValidDateString(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function toDateString(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const idx = year * 12 + (month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

/** Half-open range [start, end) covering the whole month. */
export function monthRange(ym: YearMonth): { start: string; end: string } {
  const next = shiftMonth(ym, 1);
  return { start: toDateString(ym.year, ym.month, 1), end: toDateString(next.year, next.month, 1) };
}

/** Half-open range [date, date+1). */
export function dayRange(date: string): { start: string; end: string } {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return {
    start: date,
    end: toDateString(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()),
  };
}

/** Parses "YYYY-MM" (from URL) with fallback. */
export function parseYearMonth(value: string | undefined | null, fallback: YearMonth): YearMonth {
  if (!value) return fallback;
  const m = /^(\d{4})-(\d{1,2})$/.exec(value);
  if (!m) return fallback;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return fallback;
  return { year, month };
}

export function yearMonthKey({ year, month }: YearMonth): string {
  return `${year}-${pad(month)}`;
}

export function formatMonthLabel({ year, month }: YearMonth): string {
  return format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: localeId });
}

export function formatShortMonth({ year, month }: YearMonth): string {
  return format(new Date(year, month - 1, 1), "MMM yy", { locale: localeId });
}

/** "2026-11-08" -> "8 Nov 2026" */
export function formatDateDisplay(date: string): string {
  return format(parseISO(date), "d MMM yyyy", { locale: localeId });
}

/** "2026-11-08" -> "Minggu, 8 November 2026" */
export function formatDateLong(date: string): string {
  return format(parseISO(date), "EEEE, d MMMM yyyy", { locale: localeId });
}

/** Number of days of the month that have "happened" relative to today. */
export function elapsedDaysInMonth(ym: YearMonth, today: string): number {
  const total = daysInMonth(ym.year, ym.month);
  const { start, end } = monthRange(ym);
  if (today < start) return 0;
  if (today >= end) return total;
  return Number(today.split("-")[2]);
}

/** Hour-of-day in timezone, for greetings. */
export function hourInTimezone(tz: string, now: Date = new Date()): number {
  const safeTz = isValidTimezone(tz) ? tz : DEFAULT_TIMEZONE;
  const h = new Intl.DateTimeFormat("en-US", { timeZone: safeTz, hour: "numeric", hourCycle: "h23" }).format(now);
  return Number(h) % 24;
}
