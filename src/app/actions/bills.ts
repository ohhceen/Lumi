"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/data";
import { friendlyDbError } from "@/lib/db-errors";
import type { ActionResult } from "@/lib/types";
import { billSchema, fieldErrors, payBillSchema } from "@/lib/validation";

const idSchema = z.guid();

export async function createBill(input: unknown): Promise<ActionResult> {
  const parsed = billSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa lagi isian tagihan ya.", fieldErrors: fieldErrors(parsed.error) };
  const { supabase } = await getSession();
  const { error } = await supabase.from("bills").insert(parsed.data);
  if (error) return { ok: false, message: friendlyDbError(error, "Tagihan gagal disimpan.") };
  revalidatePath("/", "layout");
  return { ok: true, message: "Tagihan ditambahkan." };
}

export async function updateBill(id: string, input: unknown): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Tagihan tidak ditemukan." };
  const parsed = billSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa lagi isian tagihan ya.", fieldErrors: fieldErrors(parsed.error) };
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("bills").update(parsed.data).eq("id", id).select("id");
  if (error) return { ok: false, message: friendlyDbError(error, "Tagihan gagal diperbarui.") };
  if (!data?.length) return { ok: false, message: "Tagihan tidak ditemukan." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Tagihan diperbarui." };
}

export async function setBillActive(id: string, active: boolean): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Tagihan tidak ditemukan." };
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("bills").update({ active }).eq("id", id).select("id");
  if (error || !data?.length) return { ok: false, message: friendlyDbError(error, "Tagihan tidak ditemukan.") };
  revalidatePath("/", "layout");
  return { ok: true, message: active ? "Tagihan diaktifkan lagi." : "Tagihan dihentikan. Riwayatnya tetap tersimpan." };
}

/** Deletes a bill and its paid-marks. Transactions already recorded stay. */
export async function deleteBill(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Tagihan tidak ditemukan." };
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("bills").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: friendlyDbError(error, "Tagihan gagal dihapus.") };
  if (!data?.length) return { ok: false, message: "Tagihan tidak ditemukan." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Tagihan dihapus." };
}

/** Marks a bill paid for a month; with `record` also records the expense transaction (atomic). */
export async function payBill(input: unknown): Promise<ActionResult> {
  const parsed = payBillSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa lagi isian pembayaran ya.", fieldErrors: fieldErrors(parsed.error) };
  const p = parsed.data;
  const { supabase } = await getSession();
  const { error } = await supabase.rpc("pay_bill", {
    p_bill: p.bill_id, p_year: p.year, p_month: p.month, p_amount: p.amount, p_paid_on: p.paid_on, p_record: p.record,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, message: "Tagihan ini sudah ditandai lunas untuk bulan tersebut." };
    return { ok: false, message: friendlyDbError(error, "Pembayaran gagal dicatat.") };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: p.record ? "Lunas! Pengeluarannya sudah dicatat." : "Ditandai lunas." };
}

/** Undo a paid-mark. If it recorded a transaction, that transaction is deleted too (and the balance restored). */
export async function unpayBill(paymentId: string): Promise<ActionResult> {
  if (!idSchema.safeParse(paymentId).success) return { ok: false, message: "Pembayaran tidak ditemukan." };
  const { supabase } = await getSession();
  const { data: payment, error } = await supabase.from("bill_payments").select("id, transaction_id").eq("id", paymentId).maybeSingle();
  if (error || !payment) return { ok: false, message: friendlyDbError(error, "Pembayaran tidak ditemukan.") };
  // deleting the transaction cascades to the payment
  const del = payment.transaction_id
    ? await supabase.from("transactions").delete().eq("id", payment.transaction_id)
    : await supabase.from("bill_payments").delete().eq("id", paymentId);
  if (del.error) return { ok: false, message: friendlyDbError(del.error, "Gagal membatalkan.") };
  revalidatePath("/", "layout");
  return { ok: true, message: "Status lunas dibatalkan." };
}
