import { expect, type Page } from "@playwright/test";

/**
 * Shared browser helpers for the Kaalvanta specs.
 *
 * Credentials come from the environment: `playwright-run.mjs` maps the
 * suite's UI_LIVE_ADMIN_EMAIL/PASSWORD onto ADMIN_EMAIL/ADMIN_PASSWORD in
 * live mode. In dev mode fill them in the suite's .env as well.
 */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

export function hasAdminCredentials(): boolean {
  return Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);
}

export const skipWithoutCredentials = () =>
  `Set ADMIN_EMAIL / ADMIN_PASSWORD (suite → UI_LIVE_ADMIN_EMAIL / UI_LIVE_ADMIN_PASSWORD)`;

/**
 * Signs in through the real login form. The page calls signIn(..., {redirect:false})
 * and then router.push("/dashboard") after a short delay.
 */
export async function login(
  page: Page,
  email: string = ADMIN_EMAIL,
  password: string = ADMIN_PASSWORD,
): Promise<void> {
  await page.goto("/login");

  await page.locator('input[placeholder="Email or Mobile"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /align records/i }).click();

  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** The admin console gate text shown to non-admins. */
export const ADMINS_ONLY = /admins only/i;

/** The studio gate text shown to non-analysts. */
export const ANALYSTS_ONLY = /analyst access required/i;

/**
 * Administrator sign-in through the dedicated env-backed route.
 * Uses ADMIN_EMAIL / ADMIN_PASSWORD checked server-side.
 */
export async function loginAdmin(
  page: Page,
  email: string = ADMIN_EMAIL,
  password: string = ADMIN_PASSWORD,
): Promise<void> {
  await page.goto("/admin/login");

  await page.getByLabel("Admin email").fill(email);
  await page.getByLabel("Admin password").fill(password);
  await page.getByRole("button", { name: /enter console/i }).click();

  await page.waitForURL("**/admin", { timeout: 20_000 });
  await expect(page).toHaveURL(/\/admin$/);
}
