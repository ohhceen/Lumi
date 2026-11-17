import { expect, test } from "@playwright/test";
import { dbBalance, login, resetData, rp, sql, totalBalanceCard, userId } from "./helpers";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await resetData();
  await login(page);
});

test("rencana gaji: split the salary into 3 pos (Rp or %), optional breakdown, save persists, balance untouched", async ({ page }) => {
  const before = await dbBalance();
  await page.goto("/salary-plan");
  await expect(page.getByRole("heading", { name: "Rencana Gaji" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Simpan rencana" })).toBeDisabled();

  await page.getByLabel("Gaji yang akan diterima").fill("10000000");
  await expect(page.getByLabel("Gaji yang akan diterima")).toHaveValue("10.000.000");

  // by percent → Rupiah follows
  await page.getByLabel("Jatah Kebutuhan dalam persen").fill("50");
  await expect(page.getByLabel("Jatah Kebutuhan dalam Rupiah")).toHaveValue("5.000.000");
  // by Rupiah → percent follows
  await page.getByLabel("Jatah Keinginan dalam Rupiah").fill("3.000.000");
  await expect(page.getByLabel("Jatah Keinginan dalam persen")).toHaveValue("30");
  await page.getByLabel("Jatah Tabungan dalam Rupiah").fill("1500000");

  const pattern = page.getByRole("img", { name: /Kebutuhan 50%, keinginan 30%, tabungan 15%/ });
  await expect(pattern).toContainText("50 / 30 / 15");
  await expect(page.getByRole("status").filter({ hasText: "Belum dibagi" })).toContainText(`${rp(500_000)} (5%)`);
  await expect(page.getByText("Total dibagi").locator("..")).toContainText(rp(9_500_000));

  // over the salary
  await page.getByLabel("Jatah Tabungan dalam Rupiah").fill("3000000");
  await expect(page.getByRole("status").filter({ hasText: "Pembagianmu lebih dari gaji" })).toContainText(rp(1_000_000));
  await page.getByLabel("Jatah Tabungan dalam persen").fill("20");
  await expect(page.getByRole("status").filter({ hasText: "Pas, semua gaji sudah dibagi" })).toBeVisible();

  // optional breakdown inside a pos
  const needs = page.getByRole("region", { name: "Pos Kebutuhan" });
  await needs.getByRole("button", { name: /Rincian \(opsional\)/ }).click();
  await needs.getByLabel("Rincian Kebutuhan: untuk apa").fill("Sewa kos");
  await needs.getByLabel("Rincian Kebutuhan: nominal").fill("1800000");
  await needs.getByRole("button", { name: "Tambah rincian Kebutuhan" }).click();
  await expect(needs).toContainText(`Terpakai ${rp(1_800_000)} dari ${rp(5_000_000)} · sisa ${rp(3_200_000)}`);
  await expect(page.getByRole("img", { name: /Kebutuhan 50%, keinginan 30%, tabungan 20%/ })).toContainText("50 / 30 / 20"); // breakdown never changes the split

  await page.getByRole("button", { name: "Simpan rencana" }).click();
  await expect(page.getByRole("button", { name: "Tersimpan" })).toBeVisible();
  const [row] = await sql<{ salary: string; needs_amount: string; wants_amount: string; savings_amount: string; items: unknown[] }>(
    "select salary, needs_amount, wants_amount, savings_amount, items from salary_plans where user_id = $1",
    [await userId()],
  );
  expect(row).toEqual({ salary: "10000000", needs_amount: "5000000", wants_amount: "3000000", savings_amount: "2000000", items: [{ name: "Sewa kos", amount: 1_800_000, bucket: "needs" }] });
  expect(await dbBalance()).toBe(before);
  expect(await sql("select 1 from transactions where user_id = $1", [await userId()])).toHaveLength(0);

  await page.reload();
  await expect(page.getByLabel("Gaji yang akan diterima")).toHaveValue("10.000.000");
  await expect(page.getByLabel("Jatah Tabungan dalam Rupiah")).toHaveValue("2.000.000");
  await expect(page.getByText("Sewa kos")).toBeVisible();
  await expect(page.getByRole("img", { name: /Kebutuhan 50%/ })).toContainText("50 / 30 / 20");
});

test("dashboard: eye button hides the balance and remembers it", async ({ page }) => {
  await sql("update settings set initial_balance = 1250000 where user_id = $1", [await userId()]);
  await page.goto("/");
  const card = totalBalanceCard(page);
  await expect(card).toContainText(rp(1_250_000));
  await card.getByRole("button", { name: "Sembunyikan saldo" }).click();
  await expect(card).toContainText("Rp••••••");
  await expect(card).not.toContainText(rp(1_250_000));
  await page.reload();
  await expect(totalBalanceCard(page)).toContainText("Rp••••••");
  await expect(totalBalanceCard(page)).not.toContainText("1.250.000");
  await totalBalanceCard(page).getByRole("button", { name: "Tampilkan saldo" }).click();
  await expect(totalBalanceCard(page)).toContainText(rp(1_250_000));
});
