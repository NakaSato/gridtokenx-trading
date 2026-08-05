import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';

/**
 * Point the freshly-registered user's primary wallet (Trading's
 * `iam_wallet_read_model` mirror) at the funded dev payer, so the buy-side
 * funding gate admits their bid. Trading refuses a buy (402) when the buyer's
 * on-chain currency balance cannot cover the order's maximum spend, and a user
 * registered seconds ago holds nothing. Same backdoor class as the pytest
 * harness's `ensure_funded` (superproject tests/e2e/lib/db.py): seed only what
 * the gate reads — its balance check still runs for real against the chain.
 */
function fundBuyer(username: string) {
  const psql = (db: string, sql: string) =>
    execFileSync(
      'docker',
      ['exec', 'gridtokenx-postgres', 'psql', '-U', 'gridtokenx_user', '-d', db, '-t', '-A', '-c', sql],
      { encoding: 'utf8' }
    ).trim();
  const userId = psql('gridtokenx_iam', `SELECT id FROM users WHERE username = '${username}';`);
  if (!userId) throw new Error(`fundBuyer: no user '${username}' in gridtokenx_iam`);
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

test.describe('Order Placement Flow', () => {
  test('should register, login, place a limit buy order, and cancel it', async ({ page }) => {
    // Mirrors dca.spec.ts's signup->verify->login boilerplate and timeout budget
    // (cold Turbopack dev server compiles each route on first hit).
    test.setTimeout(120000);

    const timestamp = Date.now();
    const username = `order_ui_${timestamp}`;
    const email = `order_ui_${timestamp}@example.com`;
    const password = 'Test123!@#';

    // 1. Visit Homepage
    await page.goto('/');
    await page.waitForTimeout(1000);

    // 2. Sign Up
    await page.locator('button', { hasText: /^Connect$/ }).first().click();
    await page.waitForTimeout(500);
    // Modal opens on the email sign-in tab (see dca.spec.ts) — go straight to sign-up.
    await page.click('button:has-text("Sign up")');

    await page.fill('#signup-username', username);
    await page.fill('#signup-first-name', 'Order');
    await page.fill('#signup-last-name', 'Test');
    await page.fill('#signup-email', email);
    await page.fill('#signup-password', password);
    await page.fill('#signup-confirm-password', password);
    await page.locator('#agree-terms').click({ force: true });
    await page.click('button:has-text("Sign Up")');

    await expect(page.locator('text=Registration successful').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);

    // Email-verification gate: gridtokenx-iam-service registers the account with
    // is_active=false; without this step login would 401 with AUTH_1005
    // EmailNotVerified and the UI would stop at the "verify your email"
    // alert instead of signing in (see dca.spec.ts).
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://apisix.gridtokenx-coresystem.orb.local';
    const verifyResp = await page.request.get(
      `${apiBase}/api/v1/auth/verify?token=verify_${encodeURIComponent(email)}`
    );
    expect(verifyResp.ok()).toBeTruthy();

    // 3. Log In
    await page.locator('button', { hasText: /^Connect$/ }).first().click();
    await page.waitForTimeout(1000);
    await page.locator('button', { hasText: /^Sign in$/ }).click();
    await page.fill('#username', username);
    await page.fill('#password', password);
    await page.locator('button[type="submit"]:has-text("Sign In")').click();

    await expect(page.locator(`text=Welcome back, ${username}!`)).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);

    // 4. Place a limit Buy order (orderType defaults to 'buy', no tab click needed).
    // Buys ARE gated on funding at submit (402 when the wallet cannot cover
    // price x amount) — point this fresh zero-balance user at the funded dev
    // payer first, or the submit below is refused before it reaches the book.
    fundBuyer(username);
    await page.fill('[data-testid="order-amount-input"]', '5');
    await page.fill('[data-testid="order-price-input"]', '4.50');
    // Await the actual POST alongside the click — a toast can be missed on a
    // cold dev server or matched stale (see buysell.spec.ts).
    const [submitResp] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/orders') && r.request().method() === 'POST',
        { timeout: 20000 }
      ),
      page.click('[data-testid="order-submit-button"]'),
    ]);
    expect(submitResp.status(), await submitResp.text().catch(() => '')).toBe(200);

    await expect(page.locator('text=Order placed successfully')).toBeVisible({ timeout: 15000 });

    // TradingPositions' "My Orders" list (orderInfos/fetchData) is a separate
    // 60s-interval poll, NOT wired to OrderForm's onSuccess query invalidation
    // (['p2p-orders']/['orderbook'] etc.) — same gap as RecurringOrdersList in
    // dca.spec.ts. Reload to force a fresh fetch instead of waiting up to 60s.
    await page.reload();
    await page.waitForTimeout(2000);

    // 5. Navigate to "My Orders" tab (TradingPositions' own tab strip) and find the
    // order. Generous timeout for the same post-reload refetch race as dca.spec.ts.
    await page.click('[data-testid="positions-tab-openorders"]');
    const orderCard = page.getByTestId('open-order-card').first();
    await expect(orderCard).toBeVisible({ timeout: 20000 });
    await expect(orderCard.locator('text=Buy')).toBeVisible();

    // 6. Cancel it and verify it disappears (list refetches and drops closed orders,
    // same pattern observed for cancelled DCA strategies in dca.spec.ts).
    // Response-first for the same stale-toast reason as the submit above.
    const [cancelResp] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/orders/') && r.request().method() === 'DELETE',
        { timeout: 20000 }
      ),
      orderCard.getByTestId('cancel-order-button').click(),
    ]);
    expect(cancelResp.status(), await cancelResp.text().catch(() => '')).toBe(200);
    await expect(page.locator('text=Order canceled successfully')).toBeVisible({ timeout: 15000 });
    // Same cold-dev-server/refetch latency margin as dca.spec.ts's analogous assertion.
    await expect(orderCard).not.toBeVisible({ timeout: 20000 });
  });
});
