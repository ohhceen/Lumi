import { describe, expect, it } from "vitest";
import {
  billsForMonth, daysBetween, dueDateIn, dueStatus, installmentProgress, summarizeBills, upcomingObligations,
  type BillLike, type InstallmentLike,
} from "@/lib/obligations";

const bill = (id: string, due_day: number, amount = 100_000, active = true): BillLike => ({ id, name: id, amount, due_day, active });

describe("due dates", () => {
  it("clamps the due day to the month's last day", () => {
    expect(dueDateIn(31, { year: 2026, month: 2 })).toBe("2026-02-28");
    expect(dueDateIn(31, { year: 2028, month: 2 })).toBe("2028-02-29");
    expect(dueDateIn(31, { year: 2026, month: 4 })).toBe("2026-04-30");
    expect(dueDateIn(5, { year: 2026, month: 11 })).toBe("2026-11-05");
  });
  it("counts calendar days across months and years", () => {
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
    expect(daysBetween("2026-11-10", "2026-11-05")).toBe(-5);
  });
  it("status: paid > overdue > due within 7 days > later", () => {
    expect(dueStatus("2026-11-05", true, "2026-11-20")).toBe("lunas");
    expect(dueStatus("2026-11-05", false, "2026-11-06")).toBe("terlambat");
    expect(dueStatus("2026-11-05", false, "2026-11-05")).toBe("segera");
    expect(dueStatus("2026-11-12", false, "2026-11-05")).toBe("segera");
    expect(dueStatus("2026-11-13", false, "2026-11-05")).toBe("belum");
  });
});

describe("bills of a month", () => {
  const bills = [bill("Listrik", 20, 450_000), bill("Internet", 5, 350_000), bill("Kos", 1, 1_800_000), bill("Lama", 10, 50_000, false)];
  const payments = [
    { bill_id: "Kos", year: 2026, month: 11, amount: 1_750_000, transaction_id: "tx1" },
    { bill_id: "Internet", year: 2026, month: 10, amount: 350_000, transaction_id: null }, // other month
  ];
  const rows = billsForMonth(bills, payments, { year: 2026, month: 11 }, "2026-11-15");

  it("hides inactive bills, orders by urgency and uses the month's payments only", () => {
    expect(rows.map((r) => [r.bill.id, r.status])).toEqual([
      ["Internet", "terlambat"],
      ["Listrik", "segera"],
      ["Kos", "lunas"],
    ]);
  });
  it("summary uses the paid amount for paid bills", () => {
    expect(summarizeBills(rows)).toEqual({ total: 350_000 + 450_000 + 1_750_000, paid: 1_750_000, unpaid: 800_000, paidCount: 1, count: 3 });
  });
  it("a past month with no payment is overdue, a future month is not", () => {
    expect(billsForMonth([bill("A", 5)], [], { year: 2026, month: 10 }, "2026-11-15")[0].status).toBe("terlambat");
    expect(billsForMonth([bill("A", 5)], [], { year: 2027, month: 1 }, "2026-11-15")[0].status).toBe("belum");
  });
  it("an inactive bill that was paid this month still shows", () => {
    const r = billsForMonth([bill("Lama", 10, 50_000, false)], [{ bill_id: "Lama", year: 2026, month: 11, amount: 50_000, transaction_id: null }], { year: 2026, month: 11 }, "2026-11-15");
    expect(r).toHaveLength(1);
  });
});

describe("installments", () => {
  const hp: InstallmentLike = { id: "hp", name: "HP", monthly_amount: 500_000, tenor: 12, start_month: "2026-07-01", due_day: 10, paid_before: 2 };

  it("progress counts payments made before using Lumi", () => {
    const p = installmentProgress(hp, [{ amount: 500_000, paid_on: "2026-09-10" }, { amount: 500_000, paid_on: "2026-10-10" }], "2026-11-05");
    expect(p).toMatchObject({ total: 6_000_000, paidCount: 4, paidAmount: 2_000_000, remaining: 4_000_000, done: false, nextNumber: 5, nextDueDate: "2026-11-10", status: "segera" });
    expect(p.percentage).toBeCloseTo(33.33, 1);
    expect(p.lastMonth).toEqual({ year: 2027, month: 6 });
  });
  it("next payment overdue", () => {
    expect(installmentProgress(hp, [], "2026-10-01")).toMatchObject({ nextNumber: 3, nextDueDate: "2026-09-10", status: "terlambat" });
  });
  it("paid off when the tenor is reached; remaining never negative", () => {
    const p = installmentProgress({ ...hp, paid_before: 11 }, [{ amount: 900_000, paid_on: "2027-06-10" }], "2027-06-11");
    expect(p).toMatchObject({ done: true, paidCount: 12, nextNumber: null, nextDueDate: null, status: "lunas", remaining: 0 });
  });
  it("due day 31 across short months", () => {
    const i = { ...hp, start_month: "2026-01-01", due_day: 31, paid_before: 1 };
    expect(installmentProgress(i, [], "2026-02-20").nextDueDate).toBe("2026-02-28");
  });
});

describe("upcoming obligations (dashboard)", () => {
  it("lists overdue and soon-due items, sorted by date", () => {
    const rows = billsForMonth([bill("Internet", 5), bill("Listrik", 20), bill("Air", 28)], [], { year: 2026, month: 11 }, "2026-11-15");
    const inst: InstallmentLike = { id: "m", name: "Motor", monthly_amount: 900_000, tenor: 24, start_month: "2026-01-01", due_day: 17, paid_before: 10 };
    const items = upcomingObligations(rows, [{ inst, progress: installmentProgress(inst, [], "2026-11-15") }], "2026-11-15");
    expect(items.map((i) => [i.name, i.dueDate, i.status, i.daysLeft])).toEqual([
      ["Internet", "2026-11-05", "terlambat", -10],
      ["Motor", "2026-11-17", "segera", 2],
      ["Listrik", "2026-11-20", "segera", 5],
    ]);
    expect(items[1].label).toBe("Cicilan ke-11 dari 24");
    expect(items.some((i) => i.name === "Air")).toBe(false); // 13 days away
  });
});
