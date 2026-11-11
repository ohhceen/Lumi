"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/data";
import { friendlyDbError } from "@/lib/db-errors";
import type { ActionResult } from "@/lib/types";
import { categorySchema, fieldErrors } from "@/lib/validation";

const idSchema = z.guid();

export async function createCategory(input: unknown): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa lagi isian kategori ya.", fieldErrors: fieldErrors(parsed.error) };
  const { supabase } = await getSession();
  const { error } = await supabase.from("categories").insert(parsed.data);
  if (error) return { ok: false, message: friendlyDbError(error, "Kategori gagal disimpan."), fieldErrors: error.code === "23505" ? { name: [friendlyDbError(error)] } : undefined };
  revalidatePath("/", "layout");
  return { ok: true, message: "Kategori baru ditambahkan 🌟" };
}

export async function updateCategory(id: string, input: unknown): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Kategori tidak ditemukan." };
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa lagi isian kategori ya.", fieldErrors: fieldErrors(parsed.error) };
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("categories").update(parsed.data).eq("id", id).select("id");
  if (error) {
    if (error.code === "23503") {
      return { ok: false, message: "Jenis kategori tidak bisa diubah karena sudah dipakai transaksi atau anggaran.", fieldErrors: { type: ["Sudah dipakai — jenis tidak bisa diubah."] } };
    }
    return { ok: false, message: friendlyDbError(error, "Kategori gagal diperbarui."), fieldErrors: error.code === "23505" ? { name: [friendlyDbError(error)] } : undefined };
  }
  if (!data?.length) return { ok: false, message: "Kategori tidak ditemukan." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Kategori diperbarui ✨" };
}

/**
 * Deletes a category. If it is used by transactions, `reassignTo` must be a
 * category of the same type; transactions are moved atomically first.
 * Budgets of the deleted category are removed (cascade).
 */
export async function deleteCategory(id: string, reassignTo?: string | null): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Kategori tidak ditemukan." };
  const { supabase } = await getSession();

  if (reassignTo) {
    if (!idSchema.safeParse(reassignTo).success) return { ok: false, message: "Kategori tujuan tidak valid." };
    const { data, error } = await supabase.rpc("reassign_and_delete_category", { p_source: id, p_target: reassignTo });
    if (error) return { ok: false, message: friendlyDbError(error, "Kategori gagal dihapus.") };
    revalidatePath("/", "layout");
    return { ok: true, message: `Kategori dihapus. ${Number(data ?? 0)} transaksi dipindahkan.` };
  }

  const counts = await Promise.all(
    (["transactions", "bills", "installments"] as const).map((table) =>
      supabase.from(table).select("id", { count: "exact", head: true }).eq("category_id", id),
    ),
  );
  const countError = counts.find((c) => c.error)?.error;
  if (countError) return { ok: false, message: friendlyDbError(countError) };
  const [tx, bills, inst] = counts.map((c) => c.count ?? 0);
  if (tx + bills + inst > 0) {
    const what = [tx ? `${tx} transaksi` : null, bills ? `${bills} tagihan` : null, inst ? `${inst} cicilan` : null].filter(Boolean).join(", ");
    return { ok: false, message: `Kategori ini masih dipakai oleh ${what}. Pilih kategori pengganti dulu ya.` };
  }
  const { data, error } = await supabase.from("categories").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: friendlyDbError(error, "Kategori gagal dihapus.") };
  if (!data?.length) return { ok: false, message: "Kategori tidak ditemukan." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Kategori dihapus." };
}
