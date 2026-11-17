import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";

/** First Google login: use the Google display name instead of the default "Teman". */
export async function applyGoogleName(supabase: SupabaseClient, user: User) {
  const fullName = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim().slice(0, 60);
  if (fullName) await supabase.from("profiles").update({ name: fullName }).eq("id", user.id).eq("name", "Teman");
}
