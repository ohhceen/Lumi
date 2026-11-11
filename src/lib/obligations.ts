import { daysInMonth, shiftMonth, toDateString } from "./dates";
import type { YearMonth } from "./types";

/**
 * Bills (tagihan bulanan) & installments (cicilan): pure date / status /
 * progress logic. Record-keeping only: nothing here moves money.
 */

export type DueStatus = "lunas" | "terlambat" | "segera" | "belum";

/** Days ahead that count as "jatuh tempo segera". */
export const SOON_DAYS = 7;

/** Due date of a monthly obligation in a month; day 31 in a 30-day month → the 30th. */
export function dueDateIn(dueDay: number, ym: YearMonth): string {
  return toDateString(ym.year, ym.month, Math.min(dueDay, daysInMonth(ym.year, ym.month)));
}

/** Whole days from `from` to `to` (YYYY-MM-DD, calendar dates). */
export function daysBetween(from: string, to: string): number {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

export function dueStatus(dueDate: string, paid: boolean, today: string): DueStatus {
  if (paid) return "lunas";
  const d = daysBetween(today, dueDate);
  if (d < 0) return "terlambat";
  if (d <= SOON_DAYS) return "segera";
  return "belum";
}

// ---------------------------------------------------------------- bills

export interface BillLike {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  active: boolean;
}

export interface BillPaymentLike {
  bill_id: string;
  year: number;
  month: number;
  amount: number;
  transaction_id: string | null;
}

export interface BillRow<B extends BillLike = BillLike, P extends BillPaymentLike = BillPaymentLike> {
  bill: B;
  dueDate: string;
  status: DueStatus;
  payment: P | null;
  daysLeft: number;
}

/** Bills of a month with their status, most urgent first. */
export function billsForMonth<B extends BillLike, P extends BillPaymentLike>(bills: readonly B[], payments: readonly P[], ym: YearMonth, today: string): BillRow<B, P>[] {
  const paid = new Map(payments.filter((p) => p.year === ym.year && p.month === ym.month).map((p) => [p.bill_id, p]));
  const order: Record<DueStatus, number> = { terlambat: 0, segera: 1, belum: 2, lunas: 3 };
  return bills
    .filter((b) => b.active || paid.has(b.id))
    .map((bill) => {
      const dueDate = dueDateIn(bill.due_day, ym);
      const payment = paid.get(bill.id) ?? null;
      return { bill, dueDate, payment, status: dueStatus(dueDate, Boolean(payment), today), daysLeft: daysBetween(today, dueDate) };
    })
    .sort((a, b) => order[a.status] - order[b.status] || a.dueDate.localeCompare(b.dueDate) || a.bill.name.localeCompare(b.bill.name));
}

export interface BillsSummary {
  total: number; // sum of expected amounts (paid rows use the paid amount)
  paid: number;
  unpaid: number;
  paidCount: number;
  count: number;
}

export function summarizeBills(rows: readonly BillRow[]): BillsSummary {
  let total = 0;
  let paid = 0;
  let paidCount = 0;
  for (const r of rows) {
    const amount = r.payment ? r.payment.amount : r.bill.amount;
    total += amount;
    if (r.payment) {
      paid += amount;
      paidCount += 1;
    }
  }
  return { total, paid, unpaid: total - paid, paidCount, count: rows.length };
}

// ---------------------------------------------------------------- installments

export interface InstallmentLike {
  id: string;
  name: string;
  monthly_amount: number;
  tenor: number;
  start_month: string; // YYYY-MM-01
  due_day: number;
  paid_before: number;
}

export interface InstallmentPaymentLike {
  amount: number;
  paid_on: string;
}

export interface InstallmentProgress {
  total: number; // monthly × tenor
  paidCount: number; // paid_before + recorded payments
  paidAmount: number; // paid_before × monthly + recorded amounts
  remaining: number; // never below 0
  percentage: number; // by number of payments, 0–100
  done: boolean;
  nextNumber: number | null; // 1-based number of the next payment
  nextDueDate: string | null;
  status: DueStatus;
  lastMonth: YearMonth; // month of the final payment
}

export function startYearMonth(startMonth: string): YearMonth {
  return { year: Number(startMonth.slice(0, 4)), month: Number(startMonth.slice(5, 7)) };
}

export function installmentProgress(inst: InstallmentLike, payments: readonly InstallmentPaymentLike[], today: string): InstallmentProgress {
  const total = inst.monthly_amount * inst.tenor;
  const paidCount = Math.min(inst.tenor, inst.paid_before + payments.length);
  const paidAmount = inst.paid_before * inst.monthly_amount + payments.reduce((s, p) => s + p.amount, 0);
  const done = paidCount >= inst.tenor;
  const start = startYearMonth(inst.start_month);
  const nextNumber = done ? null : paidCount + 1;
  const nextDueDate = nextNumber ? dueDateIn(inst.due_day, shiftMonth(start, nextNumber - 1)) : null;
  return {
    total,
    paidCount,
    paidAmount,
    remaining: Math.max(0, total - paidAmount),
    percentage: (paidCount / inst.tenor) * 100,
    done,
    nextNumber,
    nextDueDate,
    status: done || !nextDueDate ? "lunas" : dueStatus(nextDueDate, false, today),
    lastMonth: shiftMonth(start, inst.tenor - 1),
  };
}

// ---------------------------------------------------------------- dashboard

export interface UpcomingItem {
  kind: "bill" | "installment";
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: Extract<DueStatus, "terlambat" | "segera">;
  daysLeft: number;
  label?: string; // e.g. "Cicilan ke-5 dari 12"
}

/** Unpaid bills this month and next installments that are overdue or due within SOON_DAYS. */
export function upcomingObligations(
  billRows: readonly BillRow[],
  installments: readonly { inst: InstallmentLike; progress: InstallmentProgress }[],
  today: string,
): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  for (const r of billRows) {
    if (r.status === "terlambat" || r.status === "segera") {
      items.push({ kind: "bill", id: r.bill.id, name: r.bill.name, amount: r.bill.amount, dueDate: r.dueDate, status: r.status, daysLeft: r.daysLeft });
    }
  }
  for (const { inst, progress } of installments) {
    if ((progress.status === "terlambat" || progress.status === "segera") && progress.nextDueDate) {
      items.push({
        kind: "installment",
        id: inst.id,
        name: inst.name,
        amount: inst.monthly_amount,
        dueDate: progress.nextDueDate,
        status: progress.status,
        daysLeft: daysBetween(today, progress.nextDueDate),
        label: `Cicilan ke-${progress.nextNumber} dari ${inst.tenor}`,
      });
    }
  }
  return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name));
}
