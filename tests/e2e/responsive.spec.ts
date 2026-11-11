import { expect, test } from "@playwright/test";
import { login, resetData } from "./helpers";

test("mobile layout: bottom nav, no horizontal scroll on every page", async ({ page }) => {
  await resetData();
  await login(page);
  for (const path of ["/", "/transactions", "/income", "/expenses", "/budget", "/bills", "/installments", "/reports", "/more", "/categories", "/settings"]) {
    await page.goto(path);
    await expect(page.getByRole("navigation", { name: "Navigasi utama" }).filter({ visible: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
  }
});
