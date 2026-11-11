import { expect, type Page } from "@playwright/test";
import { Client } from "pg";
import { E2E_USER, localSupabase } from "./env";

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(E2E_USER.email);
  await page.getByLabel("Password").fill(E2E_USER.password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

/** Runs SQL as the e2e user's data owner (superuser, for asserting DB truth). */
export async function sql<T extends Record<string, unknown>>(query: string, params: unknown[] = []): Promise<T[]> {
  const db = new Client({ connectionString: localSupabase().dbUrl });
  await db.connect();
  try {
    return (await db.query<T>(query, params)).rows;
  } finally {
    await db.end();
  }
}

export async function userId(): Promise<string> {
  const [r] = await sql<{ id: string }>("select id from auth.users where email = $1", [E2E_USER.email]);
  return r.id;
}

/** Balance computed directly from DB records (initial + income − expense). */
export async function dbBalance(): Promise<number> {
  const uid = await userId();
  const [r] = await sql<{ b: string }>(
    `select s.initial_balance + coalesce((select sum(case when type='income' then amount else -amount end) from transactions where user_id = $1), 0) as b
       from settings s where s.user_id = $1`,
    [uid],
  );
  return Number(r.b);
}

export async function resetData() {
  const uid = await userId();
  await sql("delete from budgets where user_id = $1", [uid]);
  await sql("delete from transactions where user_id = $1", [uid]);
  await sql("delete from categories where user_id = $1 and name in ('Kopi', 'Kopi & Jajan')", [uid]);
  await sql("update settings set initial_balance = 0, timezone = 'Asia/Makassar' where user_id = $1", [uid]);
}

export function rp(n: number) {
  const abs = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${n < 0 ? "-" : ""}Rp${abs}`;
}

export const totalBalanceCard = (page: Page) => page.locator("section[aria-label='Ringkasan'] > div").first();

export async function addTransaction(
  page: Page,
  t: { type: "income" | "expense"; amount: string; description: string; category: string; date?: string },
) {
  // the visible quick-add button (sidebar on desktop, top bar on mobile)
  await page.getByRole("button", { name: /Catat transaksi|^Catat$/ }).filter({ visible: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: t.type === "income" ? "Pemasukan" : "Pengeluaran" }).click();
  await dialog.getByLabel("Jumlah").fill(t.amount);
  await dialog.getByLabel("Deskripsi").fill(t.description);
  await dialog.getByLabel("Kategori").selectOption({ label: t.category });
  if (t.date) await dialog.getByLabel("Tanggal").fill(t.date);
  await dialog.getByRole("button", { name: /Simpan/ }).click();
  await expect(dialog).toBeHidden();
}
