import { describe, expect, it } from "vitest";
import {
  balanceFromTransactions,
  budgetStatus,
  buildBudgetProgress,
  categoryBreakdown,
  computeBalance,
  computeBudgetUsage,
  dailyReport,
  dailySeries,
  monthlyReport,
  monthlyTrend,
  summarizeBudgets,
  sumTotals,
  type TxLike,
} from "@/lib/finance";
import type { Budget, Category } from "@/lib/types";

const FOOD = "food";
const TRANSPORT = "transport";
const SALARY = "salary";
const categories: Category[] = [
  { id: FOOD, name: "Makanan & Minuman", type: "expense", icon: "utensils", created_at: "" },
  { id: TRANSPORT, name: "Transportasi", type: "expense", icon: "bus", created_at: "" },
  { id: SALARY, name: "Gaji", type: "income", icon: "briefcase", created_at: "" },
];
const tx = (type: TxLike["type"], amount: number, date = "2026-11-05", category_id = type === "income" ? SALARY : FOOD): TxLike => ({
  type, amount, transaction_date: date, category_id,
});
const budget = (category_id: string, amount: number, year = 2026, month = 11): Budget => ({
  id: `b-${category_id}-${year}-${month}`, category_id, amount, year, month, created_at: "", updated_at: "",
});

describe("balance (scenarios 1–5)", () => {
  it("scenario 1: adding income", () => {
    expect(balanceFromTransactions(1_000_000, [tx("income", 500_000)])).toBe(1_500_000);
  });
  it("scenario 2: adding expense", () => {
    expect(balanceFromTransactions(1_000_000, [tx("expense", 200_000)])).toBe(800_000);
  });
  it("scenario 3: multiple transactions", () => {
    const list = [tx("income", 500_000), tx("income", 300_000), tx("expense", 100_000), tx("expense", 200_000)];
    expect(balanceFromTransactions(1_000_000, list)).toBe(1_500_000);
  });
  it("scenario 4: editing an expense recalculates (no double counting)", () => {
    const list = [tx("expense", 200_000)];
    expect(balanceFromTransactions(1_000_000, list)).toBe(800_000);
    const edited = list.map((t) => ({ ...t, amount: 300_000 }));
    expect(balanceFromTransactions(1_000_000, edited)).toBe(700_000);
  });
  it("scenario 5: deleting an expense restores the balance", () => {
    const list = [tx("expense", 200_000)];
    expect(balanceFromTransactions(1_000_000, list.filter(() => false))).toBe(1_000_000);
  });
  it("initial balance is not counted as income", () => {
    expect(sumTotals([])).toEqual({ income: 0, expense: 0 });
    expect(computeBalance(1_000_000, { income: 0, expense: 0 })).toBe(1_000_000);
  });
  it("balance can go negative", () => {
    expect(balanceFromTransactions(100_000, [tx("expense", 250_000)])).toBe(-150_000);
  });
  it("handles empty history", () => {
    expect(balanceFromTransactions(0, [])).toBe(0);
  });
});

describe("budget usage (scenario 6)", () => {
  it("food budget 1.000.000 with 750.000 spent", () => {
    const u = computeBudgetUsage(1_000_000, 750_000);
    expect(u.remaining).toBe(250_000);
    expect(u.percentage).toBe(75);
    expect(u.status).toBe("warning");
  });
  it.each([
    [0, "normal"], [699_999, "normal"], [700_000, "warning"], [899_999, "warning"],
    [900_000, "danger"], [999_999, "danger"], [1_000_000, "exceeded"], [1_500_000, "exceeded"],
  ])("spent %i of 1.000.000 -> %s", (spent, status) => {
    expect(computeBudgetUsage(1_000_000, spent).status).toBe(status);
  });
  it("status thresholds by percentage", () => {
    expect(budgetStatus(69.9)).toBe("normal");
    expect(budgetStatus(70)).toBe("warning");
    expect(budgetStatus(90)).toBe("danger");
    expect(budgetStatus(100)).toBe("exceeded");
  });
  it("exceeded budget has negative remaining", () => {
    expect(computeBudgetUsage(300_000, 450_000).remaining).toBe(-150_000);
  });
  it("only counts expenses of the selected month; income never counts", () => {
    const list = [
      tx("expense", 400_000, "2026-11-01"),
      tx("expense", 350_000, "2026-11-30"),
      tx("expense", 999_000, "2026-10-31"), // other month
      tx("expense", 999_000, "2026-12-01"), // other month
      { ...tx("income", 5_000_000, "2026-11-10"), category_id: FOOD }, // income never counts
      tx("expense", 50_000, "2026-11-10", TRANSPORT),
    ];
    const progress = buildBudgetProgress(
      [budget(FOOD, 1_000_000), budget(TRANSPORT, 500_000), budget(FOOD, 1, 2026, 10)],
      list, categories, { year: 2026, month: 11 },
    );
    expect(progress).toHaveLength(2);
    const food = progress.find((p) => p.categoryId === FOOD)!;
    expect(food.spent).toBe(750_000);
    expect(food.remaining).toBe(250_000);
    expect(food.percentage).toBe(75);
    const overview = summarizeBudgets(progress);
    expect(overview.totalLimit).toBe(1_500_000);
    expect(overview.totalSpent).toBe(800_000);
    expect(overview.remaining).toBe(700_000);
  });
  it("no budgets -> empty overview", () => {
    expect(summarizeBudgets([])).toMatchObject({ totalLimit: 0, totalSpent: 0, remaining: 0, count: 0 });
  });
});

describe("reports (scenario 7: month boundaries)", () => {
  const list = [
    tx("income", 3_000_000, "2026-10-01"),
    tx("expense", 100_000, "2026-10-31"),
    tx("expense", 40_000, "2026-11-01"),
    tx("income", 2_000_000, "2026-11-30", SALARY),
    tx("expense", 60_000, "2026-11-30", TRANSPORT),
  ];
  it("October only includes October", () => {
    const r = monthlyReport(list, categories, { year: 2026, month: 10 }, { income: 0, expense: 0 }, "2026-11-08");
    expect(r.income).toBe(3_000_000);
    expect(r.expense).toBe(100_000);
    expect(r.transactionCount).toBe(2);
    expect(r.elapsedDays).toBe(31);
    expect(r.averageDailyExpense).toBe(Math.round(100_000 / 31));
  });
  it("November only includes November + compares with October", () => {
    const r = monthlyReport(list, categories, { year: 2026, month: 11 }, { income: 3_000_000, expense: 100_000 }, "2026-11-30");
    expect(r.income).toBe(2_000_000);
    expect(r.expense).toBe(100_000);
    expect(r.net).toBe(1_900_000);
    expect(r.highestCategory?.categoryId).toBe(TRANSPORT);
    expect(r.vsPrevious.expense.percentChange).toBe(0);
    expect(r.vsPrevious.income.difference).toBe(-1_000_000);
  });
  it("average daily expense uses elapsed days for the current month", () => {
    const r = monthlyReport([tx("expense", 80_000, "2026-11-02")], categories, { year: 2026, month: 11 }, { income: 0, expense: 0 }, "2026-11-08");
    expect(r.elapsedDays).toBe(8);
    expect(r.averageDailyExpense).toBe(10_000);
  });
  it("future month has 0 elapsed days and no division by zero", () => {
    const r = monthlyReport([], categories, { year: 2027, month: 1 }, { income: 0, expense: 0 }, "2026-11-08");
    expect(r.averageDailyExpense).toBe(0);
    expect(r.mostFrequentCategory).toBeNull();
    expect(r.vsPrevious.income.percentChange).toBeNull();
  });
  it("most frequent vs highest category", () => {
    const l = [tx("expense", 10_000), tx("expense", 10_000), tx("expense", 10_000), tx("expense", 500_000, "2026-11-05", TRANSPORT)];
    const r = monthlyReport(l, categories, { year: 2026, month: 11 }, { income: 0, expense: 0 }, "2026-11-30");
    expect(r.mostFrequentCategory?.categoryId).toBe(FOOD);
    expect(r.highestCategory?.categoryId).toBe(TRANSPORT);
  });
  it("daily series is zero-filled and month-bounded", () => {
    const s = dailySeries(list, { year: 2026, month: 11 });
    expect(s).toHaveLength(30);
    expect(s[0]).toMatchObject({ date: "2026-11-01", expense: 40_000, income: 0, net: -40_000 });
    expect(s[29]).toMatchObject({ income: 2_000_000, expense: 60_000 });
    expect(dailySeries([], { year: 2028, month: 2 })).toHaveLength(29);
  });
  it("daily report", () => {
    expect(dailyReport(list, "2026-11-30")).toEqual({ date: "2026-11-30", income: 2_000_000, expense: 60_000, net: 1_940_000, count: 2 });
    expect(dailyReport(list, "2026-11-15")).toEqual({ date: "2026-11-15", income: 0, expense: 0, net: 0, count: 0 });
  });
  it("category breakdown percentages sum to 100", () => {
    const b = categoryBreakdown(list, categories);
    expect(b.reduce((s, x) => s + x.percentage, 0)).toBeCloseTo(100);
    expect(b.every((x) => x.categoryId !== SALARY)).toBe(true);
  });
  it("monthly trend zero-fills and crosses years", () => {
    const t = monthlyTrend([{ year: 2026, month: 1, total_income: 5, total_expense: 2 }], { year: 2026, month: 2 }, 4);
    expect(t.map((x) => `${x.year}-${x.month}`)).toEqual(["2025-11", "2025-12", "2026-1", "2026-2"]);
    expect(t[2]).toMatchObject({ income: 5, expense: 2, net: 3 });
  });
});
