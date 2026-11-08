"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email({ error: "Masukkan email yang valid." }),
  password: z.string().min(1, "Password wajib diisi."),
});

export type LoginState = { message?: string; email?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { message: parsed.error.issues[0].message, email };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { message: error.message.includes("Invalid login") ? "Email atau password salah." : "Gagal masuk. Coba lagi ya.", email };
  }
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
