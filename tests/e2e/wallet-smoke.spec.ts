import { test, expect } from '@playwright/test';

test('wallet page smoke: register, login, deposit/withdraw tabs, screenshot', async ({ page }) => {
  test.setTimeout(180_000);
  const timestamp = Date.now();
  const username = `wal_ui_${timestamp}`;
  const email = `wal_ui_${timestamp}@example.com`;
  const password = 'Test123!@#';
  const shots = process.env.SHOT_DIR || 'test-results';

  // Register (same flow as carbon-smoke / portfolio-smoke specs)
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

  // Navigate via the new navbar link
  await page.locator('nav a[href="/wallet"]').click();
  await expect(page.locator('h1.text-2xl:has-text("Wallet")')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('text=Escrow Transfer')).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('deposit-tab')).toBeVisible();
  await expect(page.getByTestId('withdraw-tab')).toBeVisible();
  await expect(page.locator('text=Wallet Balance')).toBeVisible();
  await expect(page.locator('text=On-chain Escrow')).toBeVisible();

  // No browser wallet in e2e — the connect-wallet empty state replaces submit
  await expect(page.locator('text=Connect your wallet to deposit GRX')).toBeVisible();
  await page.getByTestId('withdraw-tab').click();
  await expect(page.locator('text=Connect your wallet to withdraw GRX')).toBeVisible();

  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${shots}/wallet-desktop.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${shots}/wallet-mobile.png`, fullPage: true });
});
