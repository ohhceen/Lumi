import { describe, expect, it } from "vitest";
import { formatDigitsGrouped, formatIDR, formatIDRCompact, parseIDRInput } from "@/lib/format";
import {
  currentYearMonth, dayRange, daysInMonth, elapsedDaysInMonth, isValidDateString, monthRange,
  parseYearMonth, shiftMonth, todayInTimezone,
} from "@/lib/dates";
import { filtersToDateRange, pageCount } from "@/lib/filters";

describe("IDR formatting", () => {
  it("formats without decimals using dots", () => {
    expect(formatIDR(1_000_000)).toBe("Rp1.000.000");
    expect(formatIDR(0)).toBe("Rp0");
    expect(formatIDR(999)).toBe("Rp999");
    expect(formatIDR(-2_500)).toBe("-Rp2.500");
    expect(formatIDR(1_234_567_890)).toBe("Rp1.234.567.890");
  });
  it("parses user input", () => {
    expect(parseIDRInput("Rp 1.500.000")).toBe(1_500_000);
    expect(parseIDRInput("")).toBeNaN();
    expect(formatDigitsGrouped("0012500")).toBe("12.500");
  });
  it("compact", () => {
    expect(formatIDRCompact(1_500_000)).toBe("1,5jt");
    expect(formatIDRCompact(250_000)).toBe("250rb");
  });
});

describe("dates & timezone", () => {
  // 2026-10-31 16:30 UTC = 2026-11-01 00:30 in Asia/Makassar (UTC+8)
  const instant = new Date("2026-10-31T16:30:00Z");
  it("today depends on timezone", () => {
    expect(todayInTimezone("Asia/Makassar", instant)).toBe("2026-11-01");
    expect(todayInTimezone("Asia/Jakarta", instant)).toBe("2026-10-31");
    expect(todayInTimezone("UTC", instant)).toBe("2026-10-31");
    expect(currentYearMonth("Asia/Makassar", instant)).toEqual({ year: 2026, month: 11 });
  });
  it("invalid timezone falls back to Asia/Makassar", () => {
    expect(todayInTimezone("Not/AZone", instant)).toBe("2026-11-01");
  });
  it("month ranges are half-open and handle year end", () => {
    expect(monthRange({ year: 2026, month: 10 })).toEqual({ start: "2026-10-01", end: "2026-11-01" });
    expect(monthRange({ year: 2026, month: 12 })).toEqual({ start: "2026-12-01", end: "2027-01-01" });
    expect(dayRange("2026-10-31")).toEqual({ start: "2026-10-31", end: "2026-11-01" });
    expect(dayRange("2028-02-28")).toEqual({ start: "2028-02-28", end: "2028-02-29" });
  });
  it("validates dates", () => {
    expect(isValidDateString("2026-02-29")).toBe(false);
    expect(isValidDateString("2028-02-29")).toBe(true);
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("08/11/2026")).toBe(false);
  });
  it("misc helpers", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(parseYearMonth("2026-13", { year: 1, month: 1 })).toEqual({ year: 1, month: 1 });
    expect(parseYearMonth("2026-03", { year: 1, month: 1 })).toEqual({ year: 2026, month: 3 });
    expect(elapsedDaysInMonth({ year: 2026, month: 11 }, "2026-11-08")).toBe(8);
    expect(elapsedDaysInMonth({ year: 2026, month: 10 }, "2026-11-08")).toBe(31);
  });
  it("filters -> date range (date wins over month)", () => {
    expect(filtersToDateRange({ month: "2026-10" })).toEqual({ start: "2026-10-01", end: "2026-11-01" });
    expect(filtersToDateRange({ month: "2026-10", date: "2026-11-05" })).toEqual({ start: "2026-11-05", end: "2026-11-06" });
    expect(filtersToDateRange({})).toEqual({ start: null, end: null });
    expect(pageCount(0)).toBe(1);
    expect(pageCount(31, 15)).toBe(3);
  });
});
