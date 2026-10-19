import { expect, test } from "@playwright/test";

/**
 * Public surface — must render for anonymous visitors with no session.
 * These are the pages that carry SEO and the top of the funnel.
 */
test.describe("public surface", () => {
  test("landing page renders the hero", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /read the sky/i,
    );
    await expect(
      page.getByRole("link", { name: /begin your chart/i }),
    ).toBeVisible();
  });

  test("ideas feed renders", async ({ page }) => {
    await page.goto("/ideas");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /published ideas/i,
    );
    // Filter chips are always present, even with an empty feed.
    await expect(page.getByRole("button", { name: /trade ideas/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /astro readings/i })).toBeVisible();
  });

  test("login form is reachable", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator('input[placeholder="Email or Mobile"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: /align records/i }),
    ).toBeVisible();
  });

  test("register form exposes the invite code field", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByText(/invite code/i)).toBeVisible();
    await expect(page.locator('input[placeholder="KAAL-XXXX-XXXX"]')).toBeVisible();
  });
});
