import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';

/**
 * Buy AND sell through the real UI, exercising both server-side order gates:
 *
 * - a BUY is refused (402) unless the buyer's on-chain currency balance covers
 *   price x amount -> point the fresh user's wallet mirror at the funded dev
 *   payer (same backdoor class as the pytest harness's `ensure_funded`);
 * - a SELL is refused (403) unless the seller owns a VERIFIED meter -> seed the
 *   meter in BOTH places that consult it: meter-service `meters` (feeds the
 *   UI's `useSellEligibility` notice/disable) and trading's `meter_read_model`
 *   (the projection the submit gate actually reads).
 *
 * The seeds only satisfy the gates' lookups — both gates still run for real.
 */
function psql(db: string, sql: string): string {
  return execFileSync(
    'docker',
    ['exec', 'gridtokenx-postgres', 'psql', '-U', 'gridtokenx_user', '-d', db, '-t', '-A', '-c', sql],
    { encoding: 'utf8' }
  ).trim();
}

function userIdOf(username: string): string {
  const userId = psql('gridtokenx_iam', `SELECT id FROM users WHERE username = '${username}';`);
  if (!userId) throw new Error(`no user '${username}' in gridtokenx_iam`);
  return userId;
}

function fundBuyer(userId: string) {
  const wallet =
    process.env.E2E_FUNDED_WALLET || 'EzudwoHvNPAc4dpPi5ndU8MEZVHVzq3Pj3Thm9ooKmiJ';
  psql(
    'gridtokenx_trading',
    `UPDATE iam_wallet_read_model SET is_primary = false WHERE user_id = '${userId}';`
  );
  psql(
    'gridtokenx_trading',
    `INSERT INTO iam_wallet_read_model (user_id, wallet_address, is_primary, blockchain_registered, updated_at) ` +
      `VALUES ('${userId}', '${wallet}', true, true, now()) ` +
      `ON CONFLICT (user_id, wallet_address) DO UPDATE SET is_primary = true, updated_at = now();`
  );
}

function grantVerifiedMeter(userId: string): string {
  const serial = `ui-e2e-${userId.slice(0, 8)}`;
  // Meter-service registry: what the UI's sell-eligibility hook lists.
  psql(
    'gridtokenx_meter',
    `INSERT INTO meters (user_id, serial_number, meter_type, is_verified) ` +
      `VALUES ('${userId}', '${serial}', 'solar', true) ` +
      `ON CONFLICT DO NOTHING;`
  );
  // Trading's projection: what the submit gate reads (mirrors lib/db.py).
  psql(
    'gridtokenx_trading',
    `INSERT INTO meter_read_model (serial_number, meter_id, user_id, zone_id, status, is_verified, updated_at) ` +
      `VALUES ('${serial}', gen_random_uuid(), '${userId}', NULL, 'active', true, now()) ` +
      `ON CONFLICT (serial_number) DO UPDATE SET user_id = EXCLUDED.user_id, is_verified = true, updated_at = now();`
  );
  return serial;
}

test.describe('Buy + Sell Flow', () => {
  test('should register, login, place a funded buy and a meter-backed sell', async ({ page }) => {
    test.setTimeout(150000);

    const timestamp = Date.now();
    const username = `buysell_ui_${timestamp}`;
    const email = `buysell_ui_${timestamp}@example.com`;
    const password = 'Test123!@#';

    // 1. Register + verify + login (mirrors order.spec.ts boilerplate).
    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.locator('button', { hasText: /^Connect$/ }).first().click();
    await page.waitForTimeout(500);
    await page.click('button:has-text("Sign up")');
    await page.fill('#signup-username', username);
    await page.fill('#signup-first-name', 'BuySell');
    await page.fill('#signup-last-name', 'Test');
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

    await page.locator('button', { hasText: /^Connect$/ }).first().click();
    await page.waitForTimeout(1000);
    await page.locator('button', { hasText: /^Sign in$/ }).click();
    await page.fill('#username', username);
    await page.fill('#password', password);
    await page.locator('button[type="submit"]:has-text("Sign In")').click();
    await expect(page.locator(`text=Welcome back, ${username}!`)).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);

    // 2. Seed both gates' inputs, then reload so the sell-eligibility query
    // refetches and unblocks the Sell tab.
    const userId = userIdOf(username);
    fundBuyer(userId);
    grantVerifiedMeter(userId);
    await page.reload();
    await page.waitForTimeout(2000);

    // Await the actual POST, not the success toast: the buy's toast lingers
    // ~4s, so a toast assertion after the sell can match the BUY's leftover
    // toast and let the spec reload while the sell POST is still in flight —
    // observed as a network-aborted (status -1) sell that never hit the book.
    const submitAndAwaitOrder = async () => {
      const [resp] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/api/v1/orders') && r.request().method() === 'POST',
          { timeout: 15000 }
        ),
        page.click('[data-testid="order-submit-button"]'),
      ]);
      expect(resp.status(), await resp.text().catch(() => '')).toBe(200);
    };

    // 3. BUY: low bid so it rests without crossing other suites' asks.
    await page.fill('[data-testid="order-amount-input"]', '2');
    await page.fill('[data-testid="order-price-input"]', '3.25');
    await submitAndAwaitOrder();
    await page.waitForTimeout(1000);

    // 4. SELL: high ask so it rests (and cannot cross this test's own bid).
    await page.locator('button', { hasText: /^Sell$/ }).first().click();
    await expect(page.locator('[data-testid="unverified-meter-notice"]')).not.toBeVisible();
    await page.fill('[data-testid="order-amount-input"]', '1');
    await page.fill('[data-testid="order-price-input"]', '9.75');
    await submitAndAwaitOrder();

    // 5. Both rest in "My Orders" (fresh fetch after reload — the positions
    // list polls on its own 60s interval, same as order.spec.ts).
    await page.reload();
    await page.waitForTimeout(2000);
    await page.click('[data-testid="positions-tab-openorders"]');
    const cards = page.getByTestId('open-order-card');
    await expect(cards.filter({ hasText: 'Buy' }).first()).toBeVisible({ timeout: 20000 });
    await expect(cards.filter({ hasText: 'Sell' }).first()).toBeVisible({ timeout: 20000 });

    // 6. Cancel both so nothing lingers in the shared book. Response-first, not
    // toast-first: the first cancel's toast lingers long enough to satisfy the
    // second cancel's toast assertion even if that cancel failed.
    for (const side of ['Buy', 'Sell']) {
      const card = cards.filter({ hasText: side }).first();
      const [cancelResp] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/api/v1/orders/') && r.request().method() === 'DELETE',
          { timeout: 20000 }
        ),
        card.getByTestId('cancel-order-button').click(),
      ]);
      expect(cancelResp.status(), await cancelResp.text().catch(() => '')).toBe(200);
      await page.waitForTimeout(1500);
    }
  });
});
