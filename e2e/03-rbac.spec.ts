import { expect, test } from "@playwright/test";
import {
  hasAdminCredentials,
  loginAdmin,
  skipWithoutCredentials,
} from "./helpers/auth";

/**
 * RBAC — role checks are enforced server-side and surfaced as gates.
 * Admins authenticate through the dedicated env-backed /admin/login route.
 */
test.describe("rbac", () => {
  test("guests are redirected to the admin sign-in", async ({ page }) => {
    await page.goto("/admin");

    await page.waitForURL("**/admin/login", { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /administrator access/i }),
    ).toBeVisible();
  });

  test("anonymous visitors cannot open the studio", async ({ page }) => {
    await page.goto("/studio");

    await expect(
      page.getByRole("heading", { name: /analyst access required/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /save draft/i })).toHaveCount(0);
  });

  test("admin signs in at /admin/login and sees the console", async ({ page }) => {
    test.skip(!hasAdminCredentials(), skipWithoutCredentials());

    await loginAdmin(page);

    await expect(page.getByRole("heading", { name: /admin console/i })).toBeVisible();
    await expect(page.getByText(/open invites/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^invites$/i })).toBeVisible();

    await page.goto("/studio");
    await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible();

    await expect(page.getByRole("link", { name: /^admin$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^studio$/i })).toBeVisible();
  });

  test("member accounts see the admins-only gate", async ({ page }) => {
    test.fixme(
      true,
      "Needs a seeded MEMBER account — set MEMBER_EMAIL / MEMBER_PASSWORD and log in via /login.",
    );
  });
});
