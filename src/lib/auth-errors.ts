/** Error codes used in /login?error=… after a failed OAuth sign-in. */
export type LoginErrorCode = "not_registered" | "cancelled" | "oauth_failed";

/**
 * Maps the error Supabase/Google sends back to the callback URL to one of
 * our codes. `description` is Supabase's `error_description`.
 */
export function oauthErrorCode(error: string | null, description: string | null): LoginErrorCode {
  const text = `${error ?? ""} ${description ?? ""}`.toLowerCase();
  if (text.includes("signup") || text.includes("sign up") || text.includes("not allowed")) return "not_registered";
  if (text.includes("access_denied") || text.includes("cancel")) return "cancelled";
  return "oauth_failed";
}

export function loginErrorMessage(code: string | undefined | null): string | null {
  switch (code) {
    case "not_registered":
      return "Akun Google ini belum terdaftar di Lumi. Masuk dengan akun yang sudah terdaftar, atau minta pemilik aplikasi menambahkannya.";
    case "cancelled":
      return "Login dengan Google dibatalkan.";
    case "oauth_failed":
      return "Login dengan Google gagal. Coba lagi ya.";
    default:
      return null;
  }
}

/** Only allow same-site relative paths as post-login destinations. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
