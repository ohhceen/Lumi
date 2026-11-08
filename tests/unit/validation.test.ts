import { describe, expect, it } from "vitest";
import { budgetSchema, categorySchema, settingsSchema, transactionFilterSchema, transactionSchema } from "@/lib/validation";

const CAT = "3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b";
const valid = { type: "expense", description: "Makan siang", amount: "25.000", category_id: CAT, transaction_date: "2026-11-08", notes: "" };

describe("transaction validation", () => {
  it("accepts a valid income and expense", () => {
    const r = transactionSchema.parse(valid);
    expect(r.amount).toBe(25_000);
    expect(r.notes).toBeNull();
    expect(transactionSchema.parse({ ...valid, type: "income", amount: 5_000_000 }).type).toBe("income");
  });
  it.each([["0"], ["-5000"], [""], [0], [-1], [12.5], [2_000_000_000_000]])("rejects invalid amount %s", (amount) => {
    const r = transactionSchema.safeParse({ ...valid, amount });
    expect(r.success).toBe(false);
  });
  it("rejects missing required fields with Indonesian messages", () => {
    const r = transactionSchema.safeParse({ ...valid, description: "  ", category_id: "", transaction_date: "2026-02-30", type: "x" });
    expect(r.success).toBe(false);
    const msgs = r.error!.issues.map((i) => i.message);
    expect(msgs).toContain("Deskripsi wajib diisi.");
    expect(msgs).toContain("Pilih kategori.");
    expect(msgs).toContain("Tanggal tidak valid.");
    expect(msgs).toContain("Pilih jenis transaksi.");
  });
});

describe("other schemas", () => {
  it("budget amount must be > 0", () => {
    expect(budgetSchema.safeParse({ category_id: CAT, month: 11, year: 2026, amount: "0" }).success).toBe(false);
    expect(budgetSchema.parse({ category_id: CAT, month: "11", year: "2026", amount: "1.000.000" })).toEqual({ category_id: CAT, month: 11, year: 2026, amount: 1_000_000 });
  });
  it("category", () => {
    expect(categorySchema.safeParse({ name: "", type: "expense", icon: "circle" }).success).toBe(false);
  });
  it("settings allows negative and empty initial balance", () => {
    expect(settingsSchema.parse({ name: "Aku", initial_balance: "-500.000", timezone: "Asia/Makassar" }).initial_balance).toBe(-500_000);
    expect(settingsSchema.parse({ name: "Aku", initial_balance: "", timezone: "Asia/Jakarta" }).initial_balance).toBe(0);
    expect(settingsSchema.safeParse({ name: "Aku", initial_balance: "1", timezone: "Mars/Base" }).success).toBe(false);
  });
  it("filters ignore garbage", () => {
    expect(transactionFilterSchema.parse({ type: "foo", page: "-3", sort: "x", month: "2026-13" })).toEqual({ sort: "newest", page: 1 });
  });
});
