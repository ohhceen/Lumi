import { dayRange, monthRange } from "./dates";
import type { TransactionFilters } from "./validation";

export const PAGE_SIZE = 15;

/**
 * Converts history filters into a half-open date range [start, end).
 * A specific date wins over a month.
 */
export function filtersToDateRange(f: Pick<TransactionFilters, "date" | "month">): { start: string | null; end: string | null } {
  if (f.date) return dayRange(f.date);
  if (f.month) {
    const [year, month] = f.month.split("-").map(Number);
    return monthRange({ year, month });
  }
  return { start: null, end: null };
}

export function pageCount(total: number, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
