import { expect, test, type Page } from "@playwright/test";
import { addTransaction, dbBalance, login, resetData, rp, sql, totalBalanceCard, userId } from "./helpers";
import { monthRange, shiftMonth, todayInTimezone, currentYearMonth, yearMonthKey } from "../../src/lib/dates";

const TZ = "Asia/Makassar";
const today = todayInTimezone(TZ);
const thisMonth = currentYearMonth(TZ);
const prevMonth = shiftMonth(thisMonth, -1);
const FOOD = "Makanan & Minuman";

async function setInitialBalance(page: Page, value: string) {
  await page.goto("/settings");
  await page.getByLabel("Saldo awal").fill(value);
  await page.getByRole("button", { name: "Simpan pengaturan" }).click();
  await expect(page.getByText("Pengaturan disimpan")).toBeVisible();
}

async function expectBalance(page: Page, n: number) {
  await page.goto("/");
  await expect(totalBalanceCard(page)).toContainText(rp(n));
  // displayed value must equal the value computed from database records
  expect(await dbBalance()).toBe(n);
}

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await resetData();
  await login(page);
});

test("login rejects a wrong password and protects pages", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/transactions");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email").fill("buddy@example.com");
  await page.getByLabel("Password").fill("salah");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByText("Email atau password salah.")).toBeVisible();
  await ctx.close();
});

test("empty history shows friendly empty states", async ({ page }) => {
  await expect(totalBalanceCard(page)).toContainText("Rp0");
  await expect(page.getByText("Belum ada transaksi", { exact: true })).toBeVisible();
  await page.goto("/transactions");
  await expect(page.getByText("Riwayat masih kosong")).toBeVisible();
});

test("scenarios 1–5: income, expense, edit and delete keep the balance right", async ({ page }) => {
  await setInitialBalance(page, "1000000");
  await expectBalance(page, 1_000_000);

  await addTransaction(page, { type: "income", amount: "500000", description: "Gaji", category: "Gaji" });
  await expectBalance(page, 1_500_000); // scenario 1

  await addTransaction(page, { type: "expense", amount: "200000", description: "Belanja mingguan", category: FOOD });
  await expectBalance(page, 1_300_000); // scenario 2 on top of 1

  // scenario 4: edit expense 200.000 -> 300.000
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Edit Belanja mingguan" }).filter({ visible: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Jumlah").fill("300000");
  await dialog.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(page.getByText("Transaksi diperbarui")).toBeVisible();
  await expectBalance(page, 1_200_000);

  // scenario 5: delete -> back to initial + income
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Hapus Belanja mingguan" }).filter({ visible: true }).click();
  await expect(page.getByRole("alertdialog")).toContainText("akan dihapus permanen");
  await page.getByRole("button", { name: "Ya, hapus" }).click();
  await expect(page.getByText("Transaksi dihapus.")).toBeVisible();
  await expectBalance(page, 1_500_000);
});

test("scenario 3: multiple transactions", async ({ page }) => {
  await setInitialBalance(page, "1.000.000");
  for (const [type, amount, d, c] of [
    ["income", "500000", "A", "Gaji"], ["income", "300000", "B", "Freelance"],
    ["expense", "100000", "C", FOOD], ["expense", "200000", "D", "Transportasi"],
  ] as const) {
    await addTransaction(page, { type, amount, description: d, category: c });
  }
  await expectBalance(page, 1_500_000);
});

test("invalid amounts and missing fields are rejected", async ({ page }) => {
  await page.getByRole("button", { name: /Catat transaksi/ }).filter({ visible: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Jumlah").fill("0");
  await dialog.getByRole("button", { name: /Simpan/ }).click();
  await expect(dialog.getByText("Jumlah harus lebih dari Rp0.")).toBeVisible();
  await expect(dialog.getByText("Deskripsi wajib diisi.")).toBeVisible();
  await expect(dialog.getByText("Pilih kategori.")).toBeVisible();
  // income category list never contains expense categories
  await dialog.getByRole("radio", { name: "Pemasukan" }).click();
  await expect(dialog.getByLabel("Kategori").locator("option", { hasText: FOOD })).toHaveCount(0);
  expect(await sql("select 1 from transactions where user_id = $1", [await userId()])).toHaveLength(0);
});

test("scenario 6: monthly budget usage, alerts and no duplicates", async ({ page }) => {
  await page.goto(`/budget?month=${yearMonthKey(thisMonth)}`);
  await page.getByRole("button", { name: "Buat anggaran" }).first().click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Kategori pengeluaran").selectOption({ label: FOOD });
  await dialog.getByLabel("Batas anggaran per bulan").fill("1000000");
  await dialog.getByRole("button", { name: "Simpan anggaran" }).click();
  await expect(dialog).toBeHidden();

  await addTransaction(page, { type: "expense", amount: "750000", description: "Makan sebulan", category: FOOD });
  await addTransaction(page, { type: "income", amount: "9000000", description: "Bonus", category: "Gaji" }); // never counts
  await addTransaction(page, { type: "expense", amount: "50000", description: "Bulan lalu", category: FOOD, date: monthRange(prevMonth).start }); // other month

  await page.goto(`/budget?month=${yearMonthKey(thisMonth)}`);
  const row = page.getByRole("progressbar", { name: `Pemakaian anggaran ${FOOD}` });
  await expect(row).toHaveAttribute("aria-valuenow", "75");
  await expect(page.getByText(`${rp(750_000)} dari ${rp(1_000_000)}`)).toBeVisible();
  await expect(page.getByText(`Sisa ${rp(250_000)}`, { exact: true })).toBeVisible();
  await expect(page.getByText(`Anggaran ${FOOD} sudah terpakai 75%`)).toBeVisible(); // 70–89% alert

  // duplicates impossible: category no longer offered for this month
  await page.getByRole("button", { name: "Buat anggaran" }).first().click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Kategori pengeluaran").locator("option", { hasText: FOOD })).toHaveCount(0);
  await page.keyboard.press("Escape");
  expect(await sql("select count(*)::int as n from budgets where user_id = $1", [await userId()])).toEqual([{ n: 1 }]);

  // exceeding
  await addTransaction(page, { type: "expense", amount: "300000", description: "Traktir", category: FOOD });
  await page.goto(`/budget?month=${yearMonthKey(thisMonth)}`);
  await expect(page.getByText(`Anggaran ${FOOD} sudah terlewati ${rp(50_000)}`)).toBeVisible();
});

test("scenario 7: month and category filters respect boundaries", async ({ page }) => {
  const prev = monthRange(prevMonth);
  const lastDayPrev = new Date(Date.UTC(prevMonth.year, prevMonth.month, 0)).toISOString().slice(0, 10);
  await addTransaction(page, { type: "expense", amount: "10000", description: "Akhir bulan lalu", category: FOOD, date: lastDayPrev });
  await addTransaction(page, { type: "expense", amount: "20000", description: "Awal bulan lalu", category: "Transportasi", date: prev.start });
  await addTransaction(page, { type: "expense", amount: "30000", description: "Awal bulan ini", category: FOOD, date: monthRange(thisMonth).start });

  await page.goto(`/transactions?month=${yearMonthKey(prevMonth)}`);
  const table = page.locator("table");
  await expect(table).toContainText("Akhir bulan lalu");
  await expect(table).toContainText("Awal bulan lalu");
  await expect(table).not.toContainText("Awal bulan ini");

  await page.goto(`/transactions?month=${yearMonthKey(thisMonth)}`);
  await expect(page.locator("table")).toContainText("Awal bulan ini");
  await expect(page.locator("table")).not.toContainText("bulan lalu");

  // category filter through the form
  await page.goto("/transactions");
  await page.getByText("Filter lainnya").click();
  await page.getByLabel("Kategori").selectOption({ label: "Transportasi" });
  await page.getByRole("button", { name: "Terapkan" }).click();
  await expect(page.locator("table tbody tr")).toHaveCount(1);
  await expect(page.locator("table")).toContainText("Awal bulan lalu");

  // date filter + search
  await page.goto(`/transactions?date=${lastDayPrev}`);
  await expect(page.locator("table tbody tr")).toHaveCount(1);
  await page.goto("/transactions?q=AWAL");
  await expect(page.locator("table tbody tr")).toHaveCount(2);

  // monthly report only counts the selected month
  await page.goto(`/reports?month=${yearMonthKey(prevMonth)}`);
  await expect(page.locator("section[aria-labelledby='monthly']")).toContainText(rp(30_000));
});

test("categories: add custom, delete in-use one with reassignment", async ({ page }) => {
  await page.goto("/categories");
  await page.getByRole("button", { name: "Tambah" }).nth(1).click(); // expense column
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nama").fill("Kopi");
  await dialog.getByRole("button", { name: "coffee" }).click();
  await dialog.getByRole("button", { name: "Tambah kategori" }).click();
  await expect(page.getByText("Kategori baru ditambahkan")).toBeVisible();

  await addTransaction(page, { type: "expense", amount: "25000", description: "Latte", category: "Kopi" });
  const before = await dbBalance();

  await page.goto("/categories");
  await page.getByRole("button", { name: "Hapus kategori Kopi" }).click();
  const alert = page.getByRole("alertdialog");
  await expect(alert).toContainText("1 transaksi");
  await alert.getByRole("button", { name: "Pindahkan & hapus" }).click();
  await expect(page.getByText("Pilih kategori pengganti dulu ya.")).toBeVisible();
  await alert.getByLabel("Pindahkan transaksi ke").selectOption({ label: FOOD });
  await alert.getByRole("button", { name: "Pindahkan & hapus" }).click();
  await expect(page.getByText("1 transaksi dipindahkan")).toBeVisible();
  expect(await dbBalance()).toBe(before);
  const [moved] = await sql<{ name: string }>("select c.name from transactions t join categories c on c.id = t.category_id where t.description = 'Latte'");
  expect(moved.name).toBe(FOOD);
});

test("reports export Excel and PDF for the selected period", async ({ page }) => {
  await addTransaction(page, { type: "income", amount: "2000000", description: "Gaji", category: "Gaji" });
  await addTransaction(page, { type: "expense", amount: "45000", description: "Bakso", category: FOOD });
  await page.goto(`/reports?month=${yearMonthKey(thisMonth)}&date=${today}`);
  await expect(page.locator("section[aria-labelledby='monthly']")).toContainText(rp(2_000_000));
  await expect(page.getByRole("heading", { name: /Laporan Harian/ })).toBeVisible();

  const [xlsx] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Excel" }).click()]);
  expect(xlsx.suggestedFilename()).toBe(`laporan-lumi-${yearMonthKey(thisMonth)}.xlsx`);
  const xlsxPath = await xlsx.path();
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const rows = wb.getWorksheet("Transaksi")!.getSheetValues().filter(Boolean).length - 1;
  expect(rows).toBe(2);

  const [pdf] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "PDF" }).click()]);
  expect(pdf.suggestedFilename()).toBe(`laporan-lumi-${yearMonthKey(thisMonth)}.pdf`);
  const fs = await import("node:fs");
  expect(fs.readFileSync(await pdf.path()).subarray(0, 4).toString()).toBe("%PDF");
});

test("income and expenses pages only list their own type", async ({ page }) => {
  await addTransaction(page, { type: "income", amount: "1000000", description: "Honor proyek", category: "Freelance" });
  await addTransaction(page, { type: "expense", amount: "35000", description: "Es kopi", category: FOOD });

  await page.goto("/income");
  await expect(page.getByRole("heading", { name: "Pemasukan", level: 1 })).toBeVisible();
  await expect(page.locator("table")).toContainText("Honor proyek");
  await expect(page.locator("table")).not.toContainText("Es kopi");

  await page.goto("/expenses");
  await expect(page.getByRole("heading", { name: "Pengeluaran", level: 1 })).toBeVisible();
  await expect(page.locator("table")).toContainText("Es kopi");
  await expect(page.locator("table")).not.toContainText("Honor proyek");

  // tabs switch between the three views
  await page.getByRole("navigation", { name: "Jenis transaksi" }).getByRole("link", { name: "Semua" }).click();
  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.locator("table")).toContainText("Honor proyek");
  await expect(page.locator("table")).toContainText("Es kopi");
});

test("quick add opens the expense form with the category preselected", async ({ page }) => {
  await page.goto("/");
  const quick = page.getByRole("button", { name: /^Catat pengeluaran / }).first();
  const label = (await quick.getAttribute("aria-label"))!.replace("Catat pengeluaran ", "");
  await quick.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("radio", { name: "Pengeluaran" })).toHaveAttribute("aria-checked", "true");
  await expect(dialog.getByLabel("Kategori").locator("option:checked")).toHaveText(label);
  await dialog.getByLabel("Jumlah").fill("18000");
  await dialog.getByLabel("Deskripsi").fill("Pintasan cepat");
  await dialog.getByRole("button", { name: /Simpan/ }).click();
  await expect(dialog).toBeHidden();
  const [row] = await sql<{ name: string; amount: string }>(
    "select c.name, t.amount from transactions t join categories c on c.id = t.category_id where t.description = 'Pintasan cepat'",
  );
  expect(row).toEqual({ name: label, amount: "18000" });
});
