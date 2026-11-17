/**
 * Rencana Gaji: a what-if split of a salary the user types in, before it is
 * received. Pure maths only; it never reads or changes transactions.
 */

export const BUCKETS = ["needs", "wants", "savings"] as const;
export type Bucket = (typeof BUCKETS)[number];

export const BUCKET_LABELS: Record<Bucket, string> = {
  needs: "Kebutuhan",
  wants: "Keinginan",
  savings: "Tabungan",
};

export interface PlanItem {
  name: string;
  amount: number;
  bucket: Bucket;
}

export interface PlanSummary {
  totals: Record<Bucket, number>;
  /** Whole percent of the salary per bucket (0 when salary is 0). */
  percents: Record<Bucket, number>;
  spent: number;
  /** salary − spent; negative when the plan is bigger than the salary. */
  left: number;
  /** Whole percent of the salary still unplanned (0 when over). */
  leftPercent: number;
  status: "empty" | "over" | "exact" | "under";
  /** e.g. "52 / 15 / 20" — Kebutuhan / Keinginan / Tabungan */
  pattern: string;
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

export function summarizePlan(salary: number, items: readonly PlanItem[]): PlanSummary {
  const totals: Record<Bucket, number> = { needs: 0, wants: 0, savings: 0 };
  for (const it of items) totals[it.bucket] += it.amount;
  const spent = totals.needs + totals.wants + totals.savings;
  const left = salary - spent;
  const percents = { needs: pct(totals.needs, salary), wants: pct(totals.wants, salary), savings: pct(totals.savings, salary) };
  const status: PlanSummary["status"] = salary <= 0 ? "empty" : left < 0 ? "over" : left === 0 ? "exact" : "under";
  return {
    totals,
    percents,
    spent,
    left,
    leftPercent: left > 0 ? pct(left, salary) : 0,
    status,
    pattern: `${percents.needs} / ${percents.wants} / ${percents.savings}`,
  };
}

/** Donut segments as fractions (0–1) of max(salary, spent), so an over-budget plan still draws a full ring. */
export function donutShares(salary: number, summary: PlanSummary): Record<Bucket | "left", number> {
  const base = Math.max(salary, summary.spent);
  if (base <= 0) return { needs: 0, wants: 0, savings: 0, left: 0 };
  return {
    needs: summary.totals.needs / base,
    wants: summary.totals.wants / base,
    savings: summary.totals.savings / base,
    left: Math.max(0, summary.left) / base,
  };
}
