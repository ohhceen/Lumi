import { describe, expect, it } from "vitest";
import { amountForPercent, donutShares, itemTotals, summarizePlan, type PlanItem } from "@/lib/salary-plan";
import { planItemSchema, salaryPlanSchema } from "@/lib/validation";

const split = { needs: 4_000_000, wants: 2_400_000, savings: 1_600_000 };

describe("summarizePlan (3 pos)", () => {
  it("gives each pos its share and the pattern of the salary", () => {
    const s = summarizePlan(8_000_000, split);
    expect(s.percents).toEqual({ needs: 50, wants: 30, savings: 20 });
    expect(s.pattern).toBe("50 / 30 / 20");
    expect(s.allocated).toBe(8_000_000);
    expect(s.left).toBe(0);
    expect(s.status).toBe("exact");
  });

  it("reports what is not given to any pos yet", () => {
    const s = summarizePlan(10_000_000, split);
    expect(s.status).toBe("under");
    expect(s.left).toBe(2_000_000);
    expect(s.leftPercent).toBe(20);
    expect(s.pattern).toBe("40 / 24 / 16");
  });

  it("flags pos that add up to more than the salary", () => {
    const s = summarizePlan(7_000_000, split);
    expect(s.status).toBe("over");
    expect(s.left).toBe(-1_000_000);
    expect(s.leftPercent).toBe(0);
  });

  it("handles no salary", () => {
    const s = summarizePlan(0, { needs: 0, wants: 0, savings: 0 });
    expect(s.status).toBe("empty");
    expect(s.pattern).toBe("0 / 0 / 0");
    expect(donutShares(0, s)).toEqual({ needs: 0, wants: 0, savings: 0, left: 0 });
  });

  it("optional breakdown items are measured against their pos", () => {
    const items: PlanItem[] = [
      { name: "Sewa kos", amount: 1_800_000, bucket: "needs" },
      { name: "Makan", amount: 1_500_000, bucket: "needs" },
      { name: "Konser", amount: 3_000_000, bucket: "wants" },
    ];
    const s = summarizePlan(8_000_000, split, items);
    expect(s.details.needs).toEqual({ itemsTotal: 3_300_000, itemsLeft: 700_000, itemsCount: 2 });
    expect(s.details.wants.itemsLeft).toBe(-600_000);
    expect(s.details.savings).toEqual({ itemsTotal: 0, itemsLeft: 1_600_000, itemsCount: 0 });
    // items never change the split itself
    expect(s.pattern).toBe("50 / 30 / 20");
    expect(itemTotals(items)).toEqual({ needs: 3_300_000, wants: 3_000_000, savings: 0 });
  });

  it("percent → Rupiah rounds down and stays within 0–100%", () => {
    expect(amountForPercent(7_777_777, 33)).toBe(2_566_666);
    expect(amountForPercent(1_000_000, 150)).toBe(1_000_000);
    expect(amountForPercent(1_000_000, -5)).toBe(0);
    const s = summarizePlan(7_777_777, { needs: amountForPercent(7_777_777, 50), wants: amountForPercent(7_777_777, 30), savings: amountForPercent(7_777_777, 20) });
    expect(s.left).toBeGreaterThanOrEqual(0);
  });

  it("draws the donut against the larger of salary and the split", () => {
    const over = summarizePlan(4_000_000, split);
    const d = donutShares(4_000_000, over);
    expect(d.needs + d.wants + d.savings).toBeCloseTo(1);
    expect(d.left).toBe(0);
    const under = donutShares(16_000_000, summarizePlan(16_000_000, split));
    expect(under.left).toBeCloseTo(0.5);
  });
});

describe("salaryPlanSchema", () => {
  it("accepts formatted Rupiah, empty pos and no breakdown", () => {
    const r = salaryPlanSchema.parse({ salary: "Rp8.000.000", allocations: { needs: "4.000.000", wants: "", savings: 0 } });
    expect(r).toEqual({ salary: 8_000_000, allocations: { needs: 4_000_000, wants: 0, savings: 0 }, items: [] });
  });

  it("rejects negative pos, bad items and too many items", () => {
    expect(salaryPlanSchema.safeParse({ salary: 1, allocations: { needs: "-5000", wants: 0, savings: 0 } }).success).toBe(false);
    expect(salaryPlanSchema.safeParse({ salary: 0, allocations: { needs: 0, wants: 0, savings: 0 } }).success).toBe(false);
    expect(planItemSchema.safeParse({ name: " ", amount: 1000, bucket: "needs" }).success).toBe(false);
    expect(planItemSchema.safeParse({ name: "A", amount: 0, bucket: "needs" }).success).toBe(false);
    expect(planItemSchema.safeParse({ name: "A", amount: 1000, bucket: "fun" }).success).toBe(false);
    const many = Array.from({ length: 101 }, () => ({ name: "A", amount: 1, bucket: "needs" }));
    expect(salaryPlanSchema.safeParse({ salary: 1, allocations: { needs: 0, wants: 0, savings: 0 }, items: many }).success).toBe(false);
  });
});
