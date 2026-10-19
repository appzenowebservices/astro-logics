import { expect, test } from "@playwright/test";
import { hasAdminCredentials, login, skipWithoutCredentials } from "./helpers/auth";

/**
 * Publishing — the studio writes a post, publishing flips it live, and the
 * public feed picks it up. The spec cleans up after itself.
 */
test.describe("publishing", () => {
  test("analyst composes → publishes → appears in the public feed", async ({
    page,
  }) => {
    test.skip(!hasAdminCredentials(), skipWithoutCredentials());

    const title = `E2E Signal ${Date.now()}`;
    const excerpt = "Excerpt written by the browser spec.";
    const body = "An automated reading written by the browser spec.";

    await login(page);
    await page.goto("/studio");

    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Excerpt").fill(excerpt);
    await page.getByLabel("Body").fill(body);
    await page.getByLabel("Visibility").selectOption("PUBLIC");
    await page.getByRole("button", { name: /save draft/i }).click();

    // The draft list refreshes from the mutation.
    const row = page.locator("div.rounded-2xl").filter({ hasText: title }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.getByText(/DRAFT · PUBLIC/i)).toBeVisible();

    await row.getByTitle("Publish").click();
    await expect(row.getByText(/PUBLISHED · PUBLIC/i)).toBeVisible();

    // Public feed
    await page.goto("/ideas");
    const card = page.getByRole("link", { name: new RegExp(title) });
    await expect(card).toBeVisible();
    await card.click();

    await expect(page).toHaveURL(/\/ideas\/.+/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
    await expect(page.getByText(body)).toBeVisible();

    // Cleanup — the public feed should not keep the test row.
    await page.goto("/studio");
    const cleanupRow = page
      .locator("div.rounded-2xl")
      .filter({ hasText: title })
      .first();
    await cleanupRow.getByTitle("Delete").click();
    await expect(page.getByText(title)).toHaveCount(0, { timeout: 15_000 });
  });
});
