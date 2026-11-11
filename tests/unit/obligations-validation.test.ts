import { describe, expect, it } from "vitest";
import { billSchema, installmentSchema, payBillSchema } from "@/lib/validation";

const CAT = "3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b";

describe("bill & installment validation", () => {
  it("accepts a valid bill and parses Rupiah input", () => {
    expect(billSchema.parse({ name: " Listrik ", amount: "450.000", due_day: "20", category_id: CAT, notes: "" })).toEqual({
      name: "Listrik", amount: 450_000, due_day: 20, category_id: CAT, notes: null,
    });
  });
  it.each([0, 32, 1.5])("rejects due day %s", (due_day) => {
    expect(billSchema.safeParse({ name: "A", amount: 1, due_day, category_id: CAT }).success).toBe(false);
  });
  it("installment: start month becomes the 1st, paid_before defaults to 0", () => {
    expect(installmentSchema.parse({ name: "HP", monthly_amount: "500.000", tenor: "12", start_month: "2026-07", due_day: 10, category_id: CAT })).toMatchObject({
      monthly_amount: 500_000, tenor: 12, start_month: "2026-07-01", paid_before: 0,
    });
  });
  it("installment: paid_before > tenor is reported together with the other errors", () => {
    const r = installmentSchema.safeParse({ name: "", monthly_amount: "", tenor: "2", start_month: "2026-07", due_day: "", paid_before: "5", category_id: "" });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["name", "monthly_amount", "due_day", "category_id", "paid_before"]));
  });
  it("pay: amount must be > 0 and the date valid", () => {
    expect(payBillSchema.safeParse({ bill_id: CAT, year: 2026, month: 11, amount: "0", paid_on: "2026-11-05", record: true }).success).toBe(false);
    expect(payBillSchema.safeParse({ bill_id: CAT, year: 2026, month: 11, amount: "1000", paid_on: "2026-02-30", record: true }).success).toBe(false);
    expect(payBillSchema.safeParse({ bill_id: CAT, year: 2026, month: 11, amount: "1000", paid_on: "2026-11-05", record: false }).success).toBe(true);
  });
});
