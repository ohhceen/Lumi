import { expect, test } from "@playwright/test";
import { dbBalance, login, resetData, rp, sql, totalBalanceCard, userId } from "./helpers";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await resetData();
  await login(page);
});

test("rencana gaji: manual salary + items build the pattern, save persists, balance untouched", async ({ page }) => {
  const before = await dbBalance();
  await page.goto("/salary-plan");
  await expect(page.getByRole("heading", { name: "Rencana Gaji" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Simpan rencana" })).toBeDisabled();

  await page.getByLabel("Gaji yang akan diterima").fill("10000000");
  await expect(page.getByLabel("Gaji yang akan diterima")).toHaveValue("10.000.000");

  const add = async (name: string, amount: string, bucket: string) => {
    await page.getByLabel("Untuk apa").fill(name);
    await page.getByLabel("Nominal").fill(amount);
    await page.getByLabel("Kelompok").selectOption({ label: bucket });
    await page.getByRole("button", { name: "Tambah rencana" }).click();
  };
  await add("Sewa kos", "4000000", "Kebutuhan");
  await add("Nongkrong", "1.500.000", "Keinginan");
  await add("Dana darurat", "2000000", "Tabungan");

  const pattern = page.getByRole("img", { name: /Kebutuhan 40%, keinginan 15%, tabungan 20%/ });
  await expect(pattern).toContainText("40 / 15 / 20");
  await expect(page.getByRole("status").filter({ hasText: "Sisa yang belum direncanakan" })).toContainText(`${rp(2_500_000)} (25%)`);
  await expect(page.getByText("Total pengeluaran").locator("..")).toContainText(rp(7_500_000));

  // over the salary
  await add("Liburan", "3000000", "Keinginan");
  await expect(page.getByRole("status").filter({ hasText: "Rencanamu lebih dari gaji" })).toContainText(rp(500_000));
  await page.getByRole("button", { name: "Hapus Liburan" }).click();

  await page.getByRole("button", { name: "Simpan rencana" }).click();
  await expect(page.getByRole("button", { name: "Tersimpan" })).toBeVisible();
  const [row] = await sql<{ salary: string; items: { name: string; amount: number; bucket: string }[] }>("select salary, items from salary_plans where user_id = $1", [await userId()]);
  expect(row.salary).toBe("10000000");
  expect(row.items).toEqual([
    { name: "Sewa kos", amount: 4_000_000, bucket: "needs" },
    { name: "Nongkrong", amount: 1_500_000, bucket: "wants" },
    { name: "Dana darurat", amount: 2_000_000, bucket: "savings" },
  ]);
  expect(await dbBalance()).toBe(before);
  expect(await sql("select 1 from transactions where user_id = $1", [await userId()])).toHaveLength(0);

  await page.reload();
  await expect(page.getByLabel("Gaji yang akan diterima")).toHaveValue("10.000.000");
  await expect(page.getByText("Dana darurat")).toBeVisible();
  await expect(page.getByRole("img", { name: /Kebutuhan 40%/ })).toContainText("40 / 15 / 20");
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
