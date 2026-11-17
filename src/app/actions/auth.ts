"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { loginErrorMessage, oauthErrorCode } from "@/lib/auth-errors";
import { applyGoogleName } from "@/lib/google-profile";
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

/** The site origin as the browser sees it (works behind Vercel's proxy and locally). */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Starts "Sign in with Google": redirects to Google via Supabase (PKCE). */
export async function loginWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await siteOrigin()}/auth/callback`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) redirect("/login?error=oauth_failed");
  redirect(data.url);
}

const idTokenSchema = z.object({
  credential: z.string().min(20).max(8192),
  nonce: z.string().min(16).max(128),
});

/**
 * "Sign in with Google" button (Google Identity Services): the browser gets
 * a Google ID token on our own domain and Supabase verifies it here (with
 * the raw nonce whose SHA-256 was given to Google). Sets the session cookie.
 */
export async function loginWithGoogleIdToken(input: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = idTokenSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: loginErrorMessage("oauth_failed")! };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: "google", token: parsed.data.credential, nonce: parsed.data.nonce });
  if (error || !data.user) {
    return { ok: false, message: loginErrorMessage(oauthErrorCode(error?.code ?? "oauth_failed", error?.message ?? null))! };
  }
  await applyGoogleName(supabase, data.user);
  return { ok: true };
}
