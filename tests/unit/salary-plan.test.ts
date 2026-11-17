import { describe, expect, it } from "vitest";
import { donutShares, summarizePlan, type PlanItem } from "@/lib/salary-plan";
import { planItemSchema, salaryPlanSchema } from "@/lib/validation";

const items: PlanItem[] = [
  { name: "Sewa kos", amount: 1_800_000, bucket: "needs" },
  { name: "Makan", amount: 1_500_000, bucket: "needs" },
  { name: "Nongkrong", amount: 600_000, bucket: "wants" },
  { name: "Dana darurat", amount: 1_000_000, bucket: "savings" },
];

describe("summarizePlan", () => {
  it("totals each bucket and the unplanned rest", () => {
    const s = summarizePlan(8_000_000, items);
    expect(s.totals).toEqual({ needs: 3_300_000, wants: 600_000, savings: 1_000_000 });
    expect(s.spent).toBe(4_900_000);
    expect(s.left).toBe(3_100_000);
    expect(s.status).toBe("under");
    expect(s.percents).toEqual({ needs: 41, wants: 8, savings: 13 });
    expect(s.pattern).toBe("41 / 8 / 13");
    expect(s.leftPercent).toBe(39);
  });

  it("flags a plan bigger than the salary", () => {
    const s = summarizePlan(4_000_000, items);
    expect(s.status).toBe("over");
    expect(s.left).toBe(-900_000);
    expect(s.leftPercent).toBe(0);
  });

  it("recognises an exact split", () => {
    expect(summarizePlan(4_900_000, items).status).toBe("exact");
  });

  it("handles no salary and no items", () => {
    const s = summarizePlan(0, []);
    expect(s.status).toBe("empty");
    expect(s.pattern).toBe("0 / 0 / 0");
    expect(donutShares(0, s)).toEqual({ needs: 0, wants: 0, savings: 0, left: 0 });
  });

  it("draws the donut against the larger of salary and spending", () => {
    const over = summarizePlan(4_000_000, items);
    const d = donutShares(4_000_000, over);
    expect(d.needs + d.wants + d.savings).toBeCloseTo(1);
    expect(d.left).toBe(0);
    const under = summarizePlan(9_800_000, items);
    const u = donutShares(9_800_000, under);
    expect(u.needs + u.wants + u.savings + u.left).toBeCloseTo(1);
    expect(u.left).toBeCloseTo(0.5);
  });
});

describe("salaryPlanSchema", () => {
  it("accepts formatted Rupiah and trims names", () => {
    const r = salaryPlanSchema.parse({ salary: "Rp8.000.000", items: [{ name: "  Kos ", amount: "1.800.000", bucket: "needs" }] });
    expect(r).toEqual({ salary: 8_000_000, items: [{ name: "Kos", amount: 1_800_000, bucket: "needs" }] });
  });

  it("rejects empty names, zero or negative amounts and unknown buckets", () => {
    expect(planItemSchema.safeParse({ name: " ", amount: 1000, bucket: "needs" }).success).toBe(false);
    expect(planItemSchema.safeParse({ name: "A", amount: 0, bucket: "needs" }).success).toBe(false);
    expect(planItemSchema.safeParse({ name: "A", amount: "-5000", bucket: "needs" }).success).toBe(false);
    expect(planItemSchema.safeParse({ name: "A", amount: 1000, bucket: "fun" }).success).toBe(false);
  });

  it("requires a salary above zero and at most 100 items", () => {
    expect(salaryPlanSchema.safeParse({ salary: 0, items: [] }).success).toBe(false);
    const many = Array.from({ length: 101 }, () => ({ name: "A", amount: 1, bucket: "needs" }));
    expect(salaryPlanSchema.safeParse({ salary: 1, items: many }).success).toBe(false);
  });
});
