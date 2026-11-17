"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/data";
import { friendlyDbError } from "@/lib/db-errors";
import type { ActionResult } from "@/lib/types";
import { fieldErrors, salaryPlanSchema } from "@/lib/validation";

/** Saves (replaces) the user's single Rencana Gaji. Never touches transactions or the balance. */
export async function saveSalaryPlan(input: unknown): Promise<ActionResult> {
  const parsed = salaryPlanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa lagi gaji dan rencananya ya.", fieldErrors: fieldErrors(parsed.error) };
  const { supabase, user } = await getSession();
  const { error } = await supabase
    .from("salary_plans")
    .upsert({ user_id: user.id, salary: parsed.data.salary, items: parsed.data.items, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return { ok: false, message: friendlyDbError(error, "Rencana gaji gagal disimpan.") };
  revalidatePath("/salary-plan");
  return { ok: true, message: "Rencana gaji disimpan." };
}
