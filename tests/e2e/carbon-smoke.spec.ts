import { test, expect } from '@playwright/test';

test('carbon-credit page smoke: register, login, screenshot', async ({ page }) => {
  test.setTimeout(180_000);
  const timestamp = Date.now();
  const username = `cc_ui_${timestamp}`;
  const email = `cc_ui_${timestamp}@example.com`;
  const password = 'Test123!@#';
  const shots = process.env.SHOT_DIR || 'test-results';

  // Register (same flow as portfolio-smoke / dca specs)
  await page.goto('/');
  await page.waitForTimeout(1000);
  await page.locator('button', { hasText: /^Connect$/ }).first().click();
  await page.waitForTimeout(500);
  await page.click('button:has-text("Sign up")');
  await page.fill('#signup-username', username);
  await page.fill('#signup-first-name', 'Play');
  await page.fill('#signup-last-name', 'Wright');
  await page.fill('#signup-email', email);
  await page.fill('#signup-password', password);
  await page.fill('#signup-confirm-password', password);
  await page.locator('#agree-terms').click({ force: true });
  await page.click('button:has-text("Sign Up")');
  await expect(page.locator('text=Registration successful').first()).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(2000);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://apisix.gridtokenx-coresystem.orb.local';
  const verifyResp = await page.request.get(
    `${apiBase}/api/v1/auth/verify?token=verify_${encodeURIComponent(email)}`
  );
  expect(verifyResp.ok()).toBeTruthy();

  // Login
  await page.locator('button', { hasText: /^Connect$/ }).first().click();
  await page.waitForTimeout(1000);
  await page.locator('button', { hasText: /^Sign in$/ }).click();
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.locator('button[type="submit"]:has-text("Sign In")').click();
  await expect(page.locator(`text=Welcome back, ${username}!`)).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(2000);

  // Navigate via the navbar. Page links live inside the "Main menu" dropdown
  // (Radix DropdownMenu), whose content renders in a PORTAL outside <nav> — so
  // `nav a[href]` matches only a hidden inline copy and times out "waiting for
  // element to be visible". Open the menu, then click the portaled menu item.
  await page.getByRole('button', { name: 'Main menu' }).click();
  await page.getByRole('menuitem', { name: 'Carbon' }).click();
  await expect(page.locator('h1.text-2xl:has-text("Carbon Credits")')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('text=Total Credits')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Earning History', { exact: true })).toBeVisible();
  await expect(page.locator('text=Quick Transfer')).toBeVisible();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${shots}/carbon-desktop.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${shots}/carbon-mobile.png`, fullPage: true });
});
