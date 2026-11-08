import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const ADMIN_URL = process.env.TEST_DATABASE_ADMIN_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";
export const TEST_DB = "mymoney_buddy_test";

function urlFor(db: string) {
  const u = new URL(ADMIN_URL);
  u.pathname = `/${db}`;
  return u.toString();
}

export async function canConnect(): Promise<boolean> {
  const c = new Client({ connectionString: ADMIN_URL, connectionTimeoutMillis: 2000 });
  try {
    await c.connect();
    await c.end();
    return true;
  } catch {
    return false;
  }
}

/** Drops + recreates the test DB, applies the Supabase stub and all migrations. */
export async function resetDatabase(): Promise<Client> {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`drop database if exists ${TEST_DB} with (force)`);
  await admin.query(`create database ${TEST_DB}`);
  await admin.end();

  const db = new Client({ connectionString: urlFor(TEST_DB) });
  await db.connect();
  const root = path.resolve(__dirname, "../..");
  await db.query(readFileSync(path.join(root, "tests/db/supabase-stub.sql"), "utf8"));
  const dir = path.join(root, "supabase/migrations");
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.query(readFileSync(path.join(dir, f), "utf8"));
  }
  return db;
}

export async function createUser(db: Client, email: string): Promise<string> {
  const r = await db.query<{ id: string }>("insert into auth.users (email) values ($1) returning id", [email]);
  return r.rows[0].id;
}

/**
 * Runs `fn` as the given Supabase user (role `authenticated`, JWT sub = uid),
 * exactly like PostgREST does. Rolled back on error.
 */
export async function asUser<T>(db: Client, uid: string | null, fn: () => Promise<T>): Promise<T> {
  await db.query("begin");
  try {
    await db.query(`set local role ${uid ? "authenticated" : "anon"}`);
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(uid ? { sub: uid, role: "authenticated" } : { role: "anon" })]);
    const result = await fn();
    await db.query("commit");
    return result;
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}
