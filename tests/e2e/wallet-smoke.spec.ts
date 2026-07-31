import { test, expect } from '@playwright/test';

test('wallet page smoke: register, login, fiat/swap/withdraw/escrow tabs, screenshot', async ({ page }) => {
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

  // Navigate directly — the nav link's clickability is NavBar's concern, not
  // this page's (it currently never settles as "stable" for Playwright).
  await page.goto('/wallet');

  // Action card with the four flows; fiat deposit is the default tab
  await expect(page.locator('text=Move Money')).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('fiat-deposit-tab')).toBeVisible();
  await expect(page.getByTestId('swap-tab')).toBeVisible();
  await expect(page.getByTestId('fiat-withdraw-tab')).toBeVisible();
  await expect(page.getByTestId('escrow-tab')).toBeVisible();

  // Deposit (fiat) — gated: method picker renders, submit stays disabled
  await expect(page.locator('text=Payment Method')).toBeVisible();
  await expect(page.getByTestId('deposit-method-promptpay')).toBeVisible();
  await expect(page.getByTestId('fiat-deposit-submit')).toBeDisabled();

  // Swap — live form: amount input, flip control, submit disabled while empty
  await page.getByTestId('swap-tab').click();
  await expect(page.getByTestId('escrow-amount-input')).toBeVisible();
  await expect(page.getByTestId('swap-flip-button')).toBeVisible();
  await expect(page.getByTestId('swap-submit')).toBeDisabled();

  // Withdraw (fiat) — gated like deposit
  await page.getByTestId('fiat-withdraw-tab').click();
  await expect(page.getByTestId('withdraw-destination')).toBeVisible();
  await expect(page.getByTestId('fiat-withdraw-submit')).toBeDisabled();

  // Escrow — both assets selectable; no browser wallet in e2e, so the
  // connect-wallet empty state replaces the submit button
  await page.getByTestId('escrow-tab').click();
  await expect(page.getByTestId('escrow-asset-grx')).toBeVisible();
  await expect(page.getByTestId('escrow-asset-thbc')).toBeVisible();
  await expect(page.getByTestId('escrow-direction-withdraw')).toBeVisible();
  await expect(page.locator('text=Connect your wallet to move GRX')).toBeVisible();

  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${shots}/wallet-desktop.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${shots}/wallet-mobile.png`, fullPage: true });
});
