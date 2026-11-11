import { expect, test } from "@playwright/test";

// Signed-out flows: no real Google account is used; the local Supabase stack
// is enough to check the redirect to Google and the error handling.
test.describe("Google login", () => {
  test("the Google button sends the browser to Supabase's Google authorize URL", async ({ page }) => {
    await page.goto("/login");
    const authorize = page.waitForRequest((r) => r.url().includes("/auth/v1/authorize"));
    await page.getByRole("button", { name: "Masuk dengan Google" }).click();
    const url = new URL((await authorize).url());
    expect(url.searchParams.get("provider")).toBe("google");
    expect(url.searchParams.get("redirect_to")).toMatch(/\/auth\/callback$/);
    expect(url.searchParams.get("code_challenge")).toBeTruthy(); // PKCE
  });

  test("an unregistered Google account gets a clear message", async ({ page }) => {
    await page.goto("/auth/callback?error=access_denied&error_description=Signups+not+allowed+for+this+instance");
    await expect(page).toHaveURL(/\/login\?error=not_registered$/);
    await expect(page.getByText("Akun Google ini belum terdaftar di Lumi.")).toBeVisible();
  });

  test("a callback without a code returns to login with an error", async ({ page }) => {
    await page.goto("/auth/callback");
    await expect(page).toHaveURL(/\/login\?error=oauth_failed$/);
    await expect(page.getByText("Login dengan Google gagal. Coba lagi ya.")).toBeVisible();
  });
});
