import { daysInMonth, elapsedDaysInMonth, toDateString } from "../dates";
import type { Budget, Category, TransactionType, YearMonth } from "../types";

/** Minimal shape needed by the calculations. */
export interface TxLike {
  type: TransactionType;
  amount: number;
  category_id: string;
  transaction_date: string;
}

// ---------------------------------------------------------------- balance

export interface Totals {
  income: number;
  expense: number;
}

export function sumTotals(transactions: readonly TxLike[]): Totals {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense };
}

/** Current Balance = Initial Balance + Total Income − Total Expenses. */
export function computeBalance(initialBalance: number, totals: Totals): number {
  return initialBalance + totals.income - totals.expense;
}

export function balanceFromTransactions(initialBalance: number, transactions: readonly TxLike[]): number {
  return computeBalance(initialBalance, sumTotals(transactions));
}

// ---------------------------------------------------------------- budgets

export type BudgetStatus = "normal" | "warning" | "danger" | "exceeded";

/**
 * < 70%  normal, 70–89% approaching (warning), 90–99% almost exceeded
 * (danger), >= 100% exceeded.
 */
export function budgetStatus(percentage: number): BudgetStatus {
  if (percentage >= 100) return "exceeded";
  if (percentage >= 90) return "danger";
  if (percentage >= 70) return "warning";
  return "normal";
}

export interface BudgetUsage {
  limit: number;
  spent: number;
  remaining: number; // can be negative when exceeded
  percentage: number; // unrounded
  status: BudgetStatus;
}

/** Status from integer math (no float rounding at the 70/90/100% edges). */
export function budgetStatusFromAmounts(limit: number, spent: number): BudgetStatus {
  if (limit <= 0) return spent > 0 ? "exceeded" : "normal";
  if (spent * 100 >= limit * 100) return "exceeded";
  if (spent * 100 >= limit * 90) return "danger";
  if (spent * 100 >= limit * 70) return "warning";
  return "normal";
}

/**
 * Remaining Budget = Budget Limit − Actual Expenses
 * Budget Percentage = Actual Expenses / Budget Limit × 100
 */
export function computeBudgetUsage(limit: number, spent: number): BudgetUsage {
  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
  return { limit, spent, remaining: limit - spent, percentage, status: budgetStatusFromAmounts(limit, spent) };
}

/** Expense total per category within the given transactions (income ignored). */
export function expenseByCategory(transactions: readonly TxLike[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount);
  }
  return map;
}

function inMonth(date: string, ym: YearMonth): boolean {
  return date.startsWith(`${ym.year}-${String(ym.month).padStart(2, "0")}-`);
}

export interface BudgetProgress extends BudgetUsage {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
}

/**
 * Budget progress for a month. Only expense transactions dated inside the
 * month count; income never affects budget usage.
 */
export function buildBudgetProgress(
  budgets: readonly Budget[],
  transactions: readonly TxLike[],
  categories: readonly Category[],
  ym: YearMonth,
): BudgetProgress[] {
  const monthTx = transactions.filter((t) => inMonth(t.transaction_date, ym));
  const spentBy = expenseByCategory(monthTx);
  const catById = new Map(categories.map((c) => [c.id, c]));
  return budgets
    .filter((b) => b.year === ym.year && b.month === ym.month)
    .map((b) => {
      const cat = catById.get(b.category_id);
      return {
        budgetId: b.id,
        categoryId: b.category_id,
        categoryName: cat?.name ?? "Kategori terhapus",
        categoryIcon: cat?.icon ?? "circle",
        ...computeBudgetUsage(b.amount, spentBy.get(b.category_id) ?? 0),
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

export interface BudgetOverview {
  totalLimit: number;
  totalSpent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  count: number;
}

/** Remaining Monthly Budget = Σ limits − Σ spending in budgeted categories. */
export function summarizeBudgets(progress: readonly BudgetProgress[]): BudgetOverview {
  const totalLimit = progress.reduce((s, p) => s + p.limit, 0);
  const totalSpent = progress.reduce((s, p) => s + p.spent, 0);
  const usage = computeBudgetUsage(totalLimit, totalSpent);
  return { totalLimit, totalSpent, remaining: usage.remaining, percentage: usage.percentage, status: usage.status, count: progress.length };
}

// ---------------------------------------------------------------- reports

export interface DailyPoint {
  date: string;
  day: number;
  income: number;
  expense: number;
  net: number;
}

/** One point per calendar day of the month (zero-filled). */
export function dailySeries(transactions: readonly TxLike[], ym: YearMonth): DailyPoint[] {
  const total = daysInMonth(ym.year, ym.month);
  const points: DailyPoint[] = Array.from({ length: total }, (_, i) => ({
    date: toDateString(ym.year, ym.month, i + 1),
    day: i + 1,
    income: 0,
    expense: 0,
    net: 0,
  }));
  for (const t of transactions) {
    if (!inMonth(t.transaction_date, ym)) continue;
    const p = points[Number(t.transaction_date.slice(8, 10)) - 1];
    if (t.type === "income") p.income += t.amount;
    else p.expense += t.amount;
  }
  for (const p of points) p.net = p.income - p.expense;
  return points;
}

export interface DailyReport {
  date: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

export function dailyReport(transactions: readonly TxLike[], date: string): DailyReport {
  const dayTx = transactions.filter((t) => t.transaction_date === date);
  const { income, expense } = sumTotals(dayTx);
  return { date, income, expense, net: income - expense, count: dayTx.length };
}

export interface CategorySlice {
  categoryId: string;
  name: string;
  icon: string;
  amount: number;
  count: number;
  percentage: number;
}

export function categoryBreakdown(
  transactions: readonly TxLike[],
  categories: readonly Category[],
  type: TransactionType = "expense",
): CategorySlice[] {
  const catById = new Map(categories.map((c) => [c.id, c]));
  const agg = new Map<string, { amount: number; count: number }>();
  let total = 0;
  for (const t of transactions) {
    if (t.type !== type) continue;
    const a = agg.get(t.category_id) ?? { amount: 0, count: 0 };
    a.amount += t.amount;
    a.count += 1;
    agg.set(t.category_id, a);
    total += t.amount;
  }
  return [...agg.entries()]
    .map(([categoryId, a]) => ({
      categoryId,
      name: catById.get(categoryId)?.name ?? "Lainnya",
      icon: catById.get(categoryId)?.icon ?? "circle",
      amount: a.amount,
      count: a.count,
      percentage: total > 0 ? (a.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
}

export interface Comparison {
  previous: number;
  current: number;
  difference: number;
  /** null when the previous value is 0 (no meaningful %). */
  percentChange: number | null;
}

export function compare(current: number, previous: number): Comparison {
  return {
    previous,
    current,
    difference: current - previous,
    percentChange: previous === 0 ? null : ((current - previous) / previous) * 100,
  };
}

export interface MonthlyReport {
  period: YearMonth;
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
  mostFrequentCategory: CategorySlice | null;
  highestCategory: CategorySlice | null;
  averageDailyExpense: number;
  elapsedDays: number;
  vsPrevious: { income: Comparison; expense: Comparison; net: Comparison };
}

/**
 * @param transactions transactions of the month (others are ignored)
 * @param previousTotals income/expense of the previous month
 * @param today today's date in the user's timezone (for average daily expense)
 */
export function monthlyReport(
  transactions: readonly TxLike[],
  categories: readonly Category[],
  ym: YearMonth,
  previousTotals: Totals,
  today: string,
): MonthlyReport {
  const monthTx = transactions.filter((t) => inMonth(t.transaction_date, ym));
  const { income, expense } = sumTotals(monthTx);
  const slices = categoryBreakdown(monthTx, categories, "expense");
  const mostFrequent =
    slices.length === 0
      ? null
      : [...slices].sort((a, b) => b.count - a.count || b.amount - a.amount)[0];
  const elapsedDays = elapsedDaysInMonth(ym, today);
  return {
    period: ym,
    income,
    expense,
    net: income - expense,
    transactionCount: monthTx.length,
    mostFrequentCategory: mostFrequent,
    highestCategory: slices[0] ?? null,
    averageDailyExpense: elapsedDays > 0 ? Math.round(expense / elapsedDays) : 0,
    elapsedDays,
    vsPrevious: {
      income: compare(income, previousTotals.income),
      expense: compare(expense, previousTotals.expense),
      net: compare(income - expense, previousTotals.income - previousTotals.expense),
    },
  };
}

export interface MonthTotalRow {
  year: number;
  month: number;
  total_income: number;
  total_expense: number;
}

/** Zero-fills a trend of `count` months ending at `end` (inclusive). */
export function monthlyTrend(rows: readonly MonthTotalRow[], end: YearMonth, count: number) {
  const byKey = new Map(rows.map((r) => [`${r.year}-${r.month}`, r]));
  const out: { year: number; month: number; income: number; expense: number; net: number }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const idx = end.year * 12 + (end.month - 1) - i;
    const year = Math.floor(idx / 12);
    const month = (idx % 12) + 1;
    const r = byKey.get(`${year}-${month}`);
    const income = Number(r?.total_income ?? 0);
    const expense = Number(r?.total_expense ?? 0);
    out.push({ year, month, income, expense, net: income - expense });
  }
  return out;
}
