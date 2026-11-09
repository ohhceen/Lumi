"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/data";
import { friendlyDbError } from "@/lib/db-errors";
import type { ActionResult } from "@/lib/types";
import { budgetSchema, fieldErrors } from "@/lib/validation";

const idSchema = z.guid();

export async function createBudget(input: unknown): Promise<ActionResult> {
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa lagi isian anggaran ya.", fieldErrors: fieldErrors(parsed.error) };
  const { supabase } = await getSession();

  // Friendly pre-check (the unique constraint is the real guarantee).
  const { data: existing } = await supabase
    .from("budgets")
    .select("id")
    .eq("category_id", parsed.data.category_id)
    .eq("year", parsed.data.year)
    .eq("month", parsed.data.month)
    .maybeSingle();
  if (existing) {
    return {
      ok: false,
      message: "Anggaran untuk kategori ini di bulan tersebut sudah ada. Edit anggaran yang ada saja ya.",
      fieldErrors: { category_id: ["Kategori ini sudah punya anggaran di bulan ini."] },
    };
  }

  const { error } = await supabase.from("budgets").insert(parsed.data);
  if (error) return { ok: false, message: friendlyDbError(error, "Anggaran gagal disimpan.") };
  revalidatePath("/", "layout");
  return { ok: true, message: "Anggaran dibuat! Para alien siap mengawasi 👀" };
}

export async function updateBudget(id: string, input: unknown): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Anggaran tidak ditemukan." };
  const parsed = budgetSchema.pick({ amount: true }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa lagi isian anggaran ya.", fieldErrors: fieldErrors(parsed.error) };
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("budgets").update({ amount: parsed.data.amount }).eq("id", id).select("id");
  if (error) return { ok: false, message: friendlyDbError(error, "Anggaran gagal diperbarui.") };
  if (!data?.length) return { ok: false, message: "Anggaran tidak ditemukan." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Anggaran diperbarui ✨" };
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Anggaran tidak ditemukan." };
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("budgets").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: friendlyDbError(error, "Anggaran gagal dihapus.") };
  if (!data?.length) return { ok: false, message: "Anggaran tidak ditemukan." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Anggaran dihapus." };
}

/** Copies all budgets of the previous month into the target month (skips existing). */
export async function copyBudgetsFromPreviousMonth(year: number, month: number): Promise<ActionResult> {
  const target = z.object({ year: z.number().int().min(2000).max(2100), month: z.number().int().min(1).max(12) }).safeParse({ year, month });
  if (!target.success) return { ok: false, message: "Periode tidak valid." };
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const { supabase } = await getSession();
  const [{ data: source, error: e1 }, { data: current, error: e2 }] = await Promise.all([
    supabase.from("budgets").select("category_id, amount").eq("year", prev.year).eq("month", prev.month),
    supabase.from("budgets").select("category_id").eq("year", year).eq("month", month),
  ]);
  if (e1 || e2) return { ok: false, message: friendlyDbError(e1 ?? e2) };
  const have = new Set((current ?? []).map((b) => b.category_id));
  const rows = (source ?? []).filter((b) => !have.has(b.category_id)).map((b) => ({ ...b, year, month }));
  if (!rows.length) return { ok: false, message: "Tidak ada anggaran baru untuk disalin dari bulan lalu." };
  const { error } = await supabase.from("budgets").insert(rows);
  if (error) return { ok: false, message: friendlyDbError(error, "Gagal menyalin anggaran.") };
  revalidatePath("/", "layout");
  return { ok: true, message: `${rows.length} anggaran disalin dari bulan lalu.` };
}
