import { expect, test } from "@playwright/test";
import { hasAdminCredentials, login, skipWithoutCredentials } from "./helpers/auth";

/**
 * Auth behaviour — the credentials provider must actually verify a password.
 * Before the SaaS work it accepted any password for any email; these keep
 * that regression from coming back.
 */
test.describe("authentication", () => {
  test("wrong password is rejected", async ({ page }) => {
    await page.goto("/login");

    await page.locator('input[placeholder="Email or Mobile"]').fill("nobody@kaalvanta.test");
    await page.locator('input[type="password"]').fill("definitely-not-the-password");
    await page.getByRole("button", { name: /align records/i }).click();

    // signIn resolves with an error, so the router never pushes to /dashboard.
    await page.waitForTimeout(2_000);
    await expect(page).toHaveURL(/\/login/);
  });

  test("unknown account is rejected", async ({ page }) => {
    await page.goto("/login");

    await page
      .locator('input[placeholder="Email or Mobile"]')
      .fill(`missing.${Date.now()}@kaalvanta.test`);
    await page.locator('input[type="password"]').fill("whatever-1234");
    await page.getByRole("button", { name: /align records/i }).click();

    await page.waitForTimeout(2_000);
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin can sign in and lands on the dashboard", async ({ page }) => {
    test.skip(!hasAdminCredentials(), skipWithoutCredentials());

    await login(page);
    await expect(page.getByRole("link", { name: /kaalvanta/i }).first()).toBeVisible();
  });

  test("suspended accounts cannot sign in", async ({ page }) => {
    test.fixme(
      true,
      "Needs a suspended fixture account — seed one with status=SUSPENDED and set SUSPENDED_EMAIL/PASSWORD.",
    );
    await page.goto("/login");
  });
});
