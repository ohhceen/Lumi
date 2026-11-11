import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { oauthErrorCode, safeNextPath } from "@/lib/auth-errors";

/**
 * OAuth (Google) return URL. Exchanges the one-time code for a session
 * cookie, then sends the user to the dashboard. Errors go back to /login.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const toLogin = (code: string) => NextResponse.redirect(new URL(`/login?error=${code}`, url.origin));

  const providerError = url.searchParams.get("error");
  if (providerError) return toLogin(oauthErrorCode(providerError, url.searchParams.get("error_description")));

  const code = url.searchParams.get("code");
  if (!code) return toLogin("oauth_failed");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return toLogin(oauthErrorCode(error?.code ?? "oauth_failed", error?.message ?? null));

  // First Google login: use the Google display name instead of the default "Teman".
  const fullName = String(data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? "").trim().slice(0, 60);
  if (fullName) {
    await supabase.from("profiles").update({ name: fullName }).eq("id", data.user.id).eq("name", "Teman");
  }

  return NextResponse.redirect(new URL(safeNextPath(url.searchParams.get("next")), url.origin));
}
