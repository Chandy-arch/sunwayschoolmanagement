/**
 * TC-001  Valid admin login redirects to /admin dashboard
 * TC-002  Valid staff login redirects to /staff dashboard
 * TC-003  Invalid credentials shows error message
 */
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any prior session so each auth test starts unauthenticated
    await page.context().clearCookies();
    await page.goto("/login");
  });

  // TC-001: Admin login
  test("TC-001: valid admin login reaches admin dashboard", async ({ page }) => {
    await page.fill('input[name="email"], input[type="email"]', "admin@sunwayglobalschool.edu");
    await page.fill('input[name="password"], input[type="password"]', "admin123");
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname.startsWith('/admin'), { timeout: 15_000 });
    expect(page.url()).toContain('/admin');
  });

  // TC-002: Staff login
  test("TC-002: valid staff login reaches staff dashboard", async ({ page }) => {
    // Uses the hardcoded demo staff credential from lib/auth.ts
    await page.fill('input[name="email"], input[type="email"]', "staff@sunwayglobalschool.edu");
    await page.fill('input[name="password"], input[type="password"]', "staff123");
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname.startsWith('/staff'), { timeout: 15_000 });
    expect(page.url()).toContain('/staff');
  });

  // TC-003: Invalid credentials
  test("TC-003: wrong credentials shows an error message", async ({ page }) => {
    await page.fill('input[name="email"], input[type="email"]', "notauser@example.com");
    await page.fill('input[name="password"], input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should NOT navigate away
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });

    // Wait for error message to appear (server response might take a moment)
    const errorLocator = page.locator("text=/invalid|incorrect|wrong|error|failed/i").first();
    await errorLocator.waitFor({ state: "visible", timeout: 8_000 });
    await expect(errorLocator).toBeVisible();
  });

  // Extra: unauthenticated access to admin redirects to login
  test("TC-003b: unauthenticated visit to /admin redirects to /login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
