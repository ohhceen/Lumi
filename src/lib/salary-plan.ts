/**
 * Rencana Gaji: split a salary the user types in into three pos
 * (Kebutuhan / Keinginan / Tabungan) before it is received. Each pos can
 * optionally hold a breakdown of what it will pay for. Pure maths only;
 * it never reads or changes transactions.
 */

export const BUCKETS = ["needs", "wants", "savings"] as const;
export type Bucket = (typeof BUCKETS)[number];

export const BUCKET_LABELS: Record<Bucket, string> = {
  needs: "Kebutuhan",
  wants: "Keinginan",
  savings: "Tabungan",
};

export const BUCKET_HINTS: Record<Bucket, string> = {
  needs: "Wajib dibayar: sewa, makan, transport, tagihan",
  wants: "Boleh ditunda: hiburan, nongkrong, hobi",
  savings: "Untuk masa depan: dana darurat, investasi",
};

export type Allocations = Record<Bucket, number>;

export interface PlanItem {
  name: string;
  amount: number;
  bucket: Bucket;
}

export interface BucketDetail {
  /** Sum of the optional breakdown items. */
  itemsTotal: number;
  /** allocation − itemsTotal (negative when the breakdown is bigger than the pos). */
  itemsLeft: number;
  itemsCount: number;
}

export interface PlanSummary {
  allocations: Allocations;
  /** Whole percent of the salary per pos (0 when salary is 0). */
  percents: Record<Bucket, number>;
  allocated: number;
  /** salary − allocated; negative when the pos add up to more than the salary. */
  left: number;
  /** Whole percent of the salary not given to any pos (0 when over). */
  leftPercent: number;
  status: "empty" | "over" | "exact" | "under";
  /** e.g. "50 / 30 / 20" — Kebutuhan / Keinginan / Tabungan */
  pattern: string;
  details: Record<Bucket, BucketDetail>;
}

export const percentOf = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** Rupiah for a whole percent of the salary, rounded down so the pos never add up to more than 100%. */
export function amountForPercent(salary: number, percent: number): number {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return Math.floor((salary * p) / 100);
}

export function itemTotals(items: readonly PlanItem[]): Allocations {
  const t: Allocations = { needs: 0, wants: 0, savings: 0 };
  for (const it of items) t[it.bucket] += it.amount;
  return t;
}

export function summarizePlan(salary: number, allocations: Allocations, items: readonly PlanItem[] = []): PlanSummary {
  const allocated = allocations.needs + allocations.wants + allocations.savings;
  const left = salary - allocated;
  const percents = { needs: percentOf(allocations.needs, salary), wants: percentOf(allocations.wants, salary), savings: percentOf(allocations.savings, salary) };
  const status: PlanSummary["status"] = salary <= 0 ? "empty" : left < 0 ? "over" : left === 0 ? "exact" : "under";
  const totals = itemTotals(items);
  const details = Object.fromEntries(
    BUCKETS.map((b) => [b, { itemsTotal: totals[b], itemsLeft: allocations[b] - totals[b], itemsCount: items.filter((i) => i.bucket === b).length }]),
  ) as Record<Bucket, BucketDetail>;
  return {
    allocations: { ...allocations },
    percents,
    allocated,
    left,
    leftPercent: left > 0 ? percentOf(left, salary) : 0,
    status,
    pattern: `${percents.needs} / ${percents.wants} / ${percents.savings}`,
    details,
  };
}

/** Donut segments as fractions (0–1) of max(salary, allocated), so an over-allocated plan still draws a full ring. */
export function donutShares(salary: number, summary: PlanSummary): Record<Bucket | "left", number> {
  const base = Math.max(salary, summary.allocated);
  if (base <= 0) return { needs: 0, wants: 0, savings: 0, left: 0 };
  return {
    needs: summary.allocations.needs / base,
    wants: summary.allocations.wants / base,
    savings: summary.allocations.savings / base,
    left: Math.max(0, summary.left) / base,
  };
}
