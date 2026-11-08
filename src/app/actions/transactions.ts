"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/data";
import { friendlyDbError } from "@/lib/db-errors";
import type { ActionResult } from "@/lib/types";
import { fieldErrors, transactionSchema } from "@/lib/validation";
import { z } from "zod";

const idSchema = z.guid();

export async function createTransaction(input: unknown): Promise<ActionResult> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa lagi isian transaksi ya.", fieldErrors: fieldErrors(parsed.error) };
  const { supabase } = await getSession();
  const { error } = await supabase.from("transactions").insert(parsed.data);
  if (error) return { ok: false, message: friendlyDbError(error, "Transaksi gagal disimpan.") };
  revalidatePath("/", "layout");
  return { ok: true, message: parsed.data.type === "income" ? "Pemasukan tersimpan! 🎉" : "Pengeluaran tercatat 👍" };
}

export async function updateTransaction(id: string, input: unknown): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Transaksi tidak ditemukan." };
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa lagi isian transaksi ya.", fieldErrors: fieldErrors(parsed.error) };
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("transactions").update(parsed.data).eq("id", id).select("id");
  if (error) return { ok: false, message: friendlyDbError(error, "Transaksi gagal diperbarui.") };
  if (!data?.length) return { ok: false, message: "Transaksi tidak ditemukan." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Transaksi diperbarui ✨" };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Transaksi tidak ditemukan." };
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("transactions").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: friendlyDbError(error, "Transaksi gagal dihapus.") };
  if (!data?.length) return { ok: false, message: "Transaksi tidak ditemukan." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Transaksi dihapus." };
}
