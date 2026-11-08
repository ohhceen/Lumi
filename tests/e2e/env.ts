import { execSync } from "node:child_process";

/** Reads URLs/keys of the local Supabase stack from `supabase status`. */
export function localSupabase() {
  const out = execSync("npx supabase status -o env", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const get = (k: string) => {
    const m = new RegExp(`^${k}="?([^"\\n]+)"?`, "m").exec(out);
    if (!m) throw new Error(`${k} missing from supabase status — is the local stack running?`);
    return m[1];
  };
  return { url: get("API_URL"), serviceKey: get("SERVICE_ROLE_KEY"), dbUrl: get("DB_URL") };
}

export const E2E_USER = { email: "buddy@example.com", password: "Rahasia-123!" };
