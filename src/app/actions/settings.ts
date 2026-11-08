"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/data";
import { friendlyDbError } from "@/lib/db-errors";
import type { ActionResult } from "@/lib/types";
import { fieldErrors, settingsSchema } from "@/lib/validation";

export async function updateSettings(input: unknown): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa lagi isian pengaturan ya.", fieldErrors: fieldErrors(parsed.error) };
  const { supabase, user } = await getSession();
  const { name, initial_balance, timezone } = parsed.data;

  const [settingsRes, profileRes] = await Promise.all([
    supabase.from("settings").update({ initial_balance, timezone }).eq("user_id", user.id).select("id"),
    supabase.from("profiles").update({ name }).eq("id", user.id).select("id"),
  ]);
  const error = settingsRes.error ?? profileRes.error;
  if (error) return { ok: false, message: friendlyDbError(error, "Pengaturan gagal disimpan.") };
  if (!settingsRes.data?.length) return { ok: false, message: "Pengaturan tidak ditemukan. Coba muat ulang halaman." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Pengaturan disimpan 💾" };
}
