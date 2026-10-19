import { expect, test } from "@playwright/test";
import { hasAdminCredentials, login, skipWithoutCredentials } from "./helpers/auth";

/**
 * RBAC — role checks are enforced server-side and surfaced as gates.
 * A member must never see the console or the composer.
 */
test.describe("rbac", () => {
  test("anonymous visitors cannot open the admin console", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: /admins only/i })).toBeVisible();
    await expect(page.getByText(/control plane/i)).toHaveCount(0);
  });

  test("anonymous visitors cannot open the studio", async ({ page }) => {
    await page.goto("/studio");

    await expect(
      page.getByRole("heading", { name: /analyst access required/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /save draft/i })).toHaveCount(0);
  });

  test("admin sees the console, the studio and the admin nav", async ({ page }) => {
    test.skip(!hasAdminCredentials(), skipWithoutCredentials());

    await login(page);

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /admin console/i })).toBeVisible();
    await expect(page.getByText(/open invites/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^invites$/i })).toBeVisible();

    await page.goto("/studio");
    await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible();

    await expect(page.getByRole("link", { name: /^admin$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^studio$/i })).toBeVisible();
  });
});
