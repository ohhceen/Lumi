import { expect, test } from "@playwright/test";
import { dbBalance, login, resetData, sql, userId } from "./helpers";
import { currentYearMonth, todayInTimezone } from "../../src/lib/dates";

const TZ = "Asia/Makassar";
const today = todayInTimezone(TZ);
const ym = currentYearMonth(TZ);
const FOOD = "Makanan & Minuman";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await resetData();
  await login(page);
});

test("bills: add, mark paid with a transaction, then undo", async ({ page }) => {
  await page.goto("/bills");
  await expect(page.getByText("Belum ada tagihan")).toBeVisible();
  await page.getByRole("button", { name: "Tagihan baru" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nama tagihan").fill("Internet");
  await dialog.getByLabel("Nominal biasanya").fill("350000");
  await dialog.getByLabel("Jatuh tempo tiap tanggal").fill("31");
  await dialog.getByLabel("Kategori").selectOption({ label: "Tagihan & Utilitas" });
  await dialog.getByRole("button", { name: "Simpan tagihan" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Internet", { exact: true })).toBeVisible();

  const before = await dbBalance();
  await page.getByRole("button", { name: "Tandai lunas Internet" }).click();
  const pay = page.getByRole("dialog");
  await pay.getByLabel("Nominal dibayar").fill("365000");
  await pay.getByRole("button", { name: "Tandai lunas" }).click();
  await expect(page.getByText("Lunas! Pengeluarannya sudah dicatat.")).toBeVisible();
  expect(await dbBalance()).toBe(before - 365_000);
  const [p] = await sql<{ amount: string; year: number; month: number; transaction_id: string | null }>(
    "select amount, year, month, transaction_id from bill_payments where user_id = $1", [await userId()],
  );
  expect(p).toMatchObject({ amount: "365000", year: ym.year, month: ym.month });
  expect(p.transaction_id).toBeTruthy();

  // the expense shows up in the transaction history
  await page.goto("/expenses");
  await expect(page.locator("table")).toContainText("Internet");

  // undo: transaction removed, balance restored
  await page.goto("/bills");
  await page.getByRole("button", { name: "Batalkan lunas Internet" }).click();
  await page.getByRole("button", { name: "Ya, batalkan" }).click();
  await expect(page.getByText("Status lunas dibatalkan.")).toBeVisible();
  expect(await dbBalance()).toBe(before);
  expect(await sql("select 1 from bill_payments where user_id = $1", [await userId()])).toHaveLength(0);
});

test("bills: mark paid without recording a transaction", async ({ page }) => {
  const uid = await userId();
  const [cat] = await sql<{ id: string }>("select id from categories where user_id = $1 and name = $2", [uid, FOOD]);
  await sql("insert into bills (user_id, name, amount, due_day, category_id) values ($1, 'Katering', 400000, 1, $2)", [uid, cat.id]);
  const before = await dbBalance();
  await page.goto("/bills");
  await page.getByRole("button", { name: "Tandai lunas Katering" }).click();
  const pay = page.getByRole("dialog");
  await pay.getByLabel("Catat juga sebagai pengeluaran").uncheck();
  await pay.getByRole("button", { name: "Tandai lunas" }).click();
  await expect(page.getByText("Ditandai lunas.")).toBeVisible();
  expect(await dbBalance()).toBe(before);
});

test("installments: add, pay, see progress; dashboard lists what is due", async ({ page }) => {
  const uid = await userId();
  const [cat] = await sql<{ id: string }>("select id from categories where user_id = $1 and name = 'Tagihan & Utilitas'", [uid]);
  // a bill due today → appears in "Jatuh tempo minggu ini"
  await sql("insert into bills (user_id, name, amount, due_day, category_id) values ($1, 'Listrik', 450000, $2, $3)", [uid, Number(today.slice(8, 10)), cat.id]);

  await page.goto("/installments");
  await page.getByRole("button", { name: "Cicilan baru" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nama cicilan").fill("Cicilan HP");
  await dialog.getByLabel("Cicilan per bulan").fill("500000");
  await dialog.getByLabel("Tenor (berapa kali bayar)").fill("3");
  await dialog.getByLabel("Jatuh tempo tiap tanggal").fill("10");
  await dialog.getByLabel("Sudah dibayar sebelumnya").fill("1");
  await dialog.getByLabel("Kategori").selectOption({ label: "Tagihan & Utilitas" });
  await expect(dialog.getByText("Total Rp1.500.000")).toBeVisible();
  await dialog.getByRole("button", { name: "Simpan cicilan" }).click();
  await expect(dialog).toBeHidden();

  const progress = page.getByRole("progressbar", { name: "Progres cicilan Cicilan HP" });
  await expect(progress).toHaveAttribute("aria-valuenow", "1");
  const before = await dbBalance();
  await page.getByRole("button", { name: "Bayar cicilan Cicilan HP" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Catat pembayaran" }).click();
  await expect(page.getByText("Pembayaran cicilan dicatat sebagai pengeluaran.")).toBeVisible();
  await expect(progress).toHaveAttribute("aria-valuenow", "2");
  await expect(page.getByText("Sisa Rp500.000")).toBeVisible();
  expect(await dbBalance()).toBe(before - 500_000);

  await page.goto("/");
  const card = page.getByRole("heading", { name: "Jatuh tempo minggu ini" }).locator("xpath=ancestor::div[contains(@class,'rounded-3xl')][1]");
  await expect(card).toContainText("Listrik");
  await expect(card).toContainText("Hari ini");
});

test("form validation for bills and installments", async ({ page }) => {
  await page.goto("/bills");
  await page.getByRole("button", { name: "Tagihan baru" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Jatuh tempo tiap tanggal").fill("40");
  await dialog.getByRole("button", { name: "Simpan tagihan" }).click();
  await expect(dialog.getByText("Nama tagihan wajib diisi.")).toBeVisible();
  await expect(dialog.getByText("Nominal wajib diisi.")).toBeVisible();
  await expect(dialog.getByText("Tanggal jatuh tempo 1–31.")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/installments");
  await page.getByRole("button", { name: "Cicilan baru" }).first().click();
  const d2 = page.getByRole("dialog");
  await d2.getByLabel("Tenor (berapa kali bayar)").fill("2");
  await d2.getByLabel("Sudah dibayar sebelumnya").fill("5");
  await d2.getByRole("button", { name: "Simpan cicilan" }).click();
  await expect(d2.getByText("Tidak boleh lebih dari tenor.")).toBeVisible();
  expect(await sql("select 1 from installments where user_id = $1", [await userId()])).toHaveLength(0);
});
