import { test, expect } from '@playwright/test';

test('portfolio redesign smoke: register, login, screenshot portfolio', async ({ page }) => {
  test.setTimeout(180_000);
  const timestamp = Date.now();
  const username = `pf_ui_${timestamp}`;
  const email = `pf_ui_${timestamp}@example.com`;
  const password = 'Test123!@#';
  const shots = process.env.SHOT_DIR || 'test-results';

  // Register
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

  // Dev email-verification shortcut (see tests/e2e/dca.spec.ts)
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

  // Portfolio page
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  await page.goto('/portfolio');
  // Hero: total wealth figure + username
  await expect(page.locator('text=Total wealth')).toBeVisible({ timeout: 15000 });
  await expect(page.locator(`text=${username}`).first()).toBeVisible();
  // Stat row
  await expect(page.locator('text=Performance').first()).toBeVisible();
  await expect(page.locator('text=P&L').first()).toBeVisible();
  await expect(page.locator('text=Avg price').first()).toBeVisible();
  // System Status panel
  await expect(page.locator('text=Your P2P Activity')).toBeVisible({ timeout: 10000 });
  // Tabs section
  await expect(page.locator('button[role="tab"]:has-text("Positions")')).toBeVisible();
  await page.waitForTimeout(3000); // let queries settle
  await page.screenshot({ path: `${shots}/portfolio-desktop.png`, fullPage: true });

  // Mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${shots}/portfolio-mobile.png`, fullPage: true });

  console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors, null, 2));
});
