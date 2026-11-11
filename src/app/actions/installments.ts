"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/data";
import { friendlyDbError } from "@/lib/db-errors";
import type { ActionResult } from "@/lib/types";
import { fieldErrors, installmentSchema, payInstallmentSchema } from "@/lib/validation";

const idSchema = z.guid();

export async function createInstallment(input: unknown): Promise<ActionResult> {
  const parsed = installmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa lagi isian cicilan ya.", fieldErrors: fieldErrors(parsed.error) };
  const { supabase } = await getSession();
  const { error } = await supabase.from("installments").insert(parsed.data);
  if (error) return { ok: false, message: friendlyDbError(error, "Cicilan gagal disimpan.") };
  revalidatePath("/", "layout");
  return { ok: true, message: "Cicilan ditambahkan." };
}

export async function updateInstallment(id: string, input: unknown): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Cicilan tidak ditemukan." };
  const parsed = installmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa lagi isian cicilan ya.", fieldErrors: fieldErrors(parsed.error) };
  const { supabase } = await getSession();
  const { count, error: countError } = await supabase.from("installment_payments").select("id", { count: "exact", head: true }).eq("installment_id", id);
  if (countError) return { ok: false, message: friendlyDbError(countError) };
  if (parsed.data.paid_before + (count ?? 0) > parsed.data.tenor) {
    return { ok: false, message: "Tenor lebih kecil dari jumlah pembayaran yang sudah tercatat.", fieldErrors: { tenor: ["Lebih kecil dari pembayaran yang sudah tercatat."] } };
  }
  const { data, error } = await supabase.from("installments").update(parsed.data).eq("id", id).select("id");
  if (error) return { ok: false, message: friendlyDbError(error, "Cicilan gagal diperbarui.") };
  if (!data?.length) return { ok: false, message: "Cicilan tidak ditemukan." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Cicilan diperbarui." };
}

/** Deletes an installment and its payment records. Transactions already recorded stay. */
export async function deleteInstallment(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Cicilan tidak ditemukan." };
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("installments").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: friendlyDbError(error, "Cicilan gagal dihapus.") };
  if (!data?.length) return { ok: false, message: "Cicilan tidak ditemukan." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Cicilan dihapus." };
}

export async function payInstallment(input: unknown): Promise<ActionResult> {
  const parsed = payInstallmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa lagi isian pembayaran ya.", fieldErrors: fieldErrors(parsed.error) };
  const p = parsed.data;
  const { supabase } = await getSession();
  const { error } = await supabase.rpc("pay_installment", { p_installment: p.installment_id, p_amount: p.amount, p_paid_on: p.paid_on, p_record: p.record });
  if (error) {
    if (error.code === "23514") return { ok: false, message: "Cicilan ini sudah lunas." };
    return { ok: false, message: friendlyDbError(error, "Pembayaran gagal dicatat.") };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: p.record ? "Pembayaran cicilan dicatat sebagai pengeluaran." : "Pembayaran cicilan dicatat." };
}

/** Removes a payment record; a linked transaction is deleted too (balance restored). */
export async function deleteInstallmentPayment(paymentId: string): Promise<ActionResult> {
  if (!idSchema.safeParse(paymentId).success) return { ok: false, message: "Pembayaran tidak ditemukan." };
  const { supabase } = await getSession();
  const { data: payment, error } = await supabase.from("installment_payments").select("id, transaction_id").eq("id", paymentId).maybeSingle();
  if (error || !payment) return { ok: false, message: friendlyDbError(error, "Pembayaran tidak ditemukan.") };
  const del = payment.transaction_id
    ? await supabase.from("transactions").delete().eq("id", payment.transaction_id)
    : await supabase.from("installment_payments").delete().eq("id", paymentId);
  if (del.error) return { ok: false, message: friendlyDbError(del.error, "Gagal menghapus pembayaran.") };
  revalidatePath("/", "layout");
  return { ok: true, message: "Pembayaran dihapus." };
}
