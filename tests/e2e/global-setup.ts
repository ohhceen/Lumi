import { Client } from "pg";
import { E2E_USER, localSupabase } from "./env";

/** Fresh start: wipe app data and (re)create the single E2E account. */
export default async function globalSetup() {
  const { url, serviceKey, dbUrl } = localSupabase();
  const db = new Client({ connectionString: dbUrl });
  await db.connect();
  await db.query("delete from auth.users where email = $1", [E2E_USER.email]); // cascades to app data
  await db.end();

  // Admin API (service role is used ONLY by the test harness, never by the app)
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: E2E_USER.email, password: E2E_USER.password, email_confirm: true }),
  });
  if (!res.ok) throw new Error(`could not create e2e user: ${res.status} ${await res.text()}`);
}
