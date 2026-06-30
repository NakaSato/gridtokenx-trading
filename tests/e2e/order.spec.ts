import { test, expect } from '@playwright/test';

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
    await page.click('button:has-text("Or sign in with email")');
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
    // is_active=false; login filters on is_active=true, so login would 401 with a
    // generic "Invalid username or password" without this step (see dca.spec.ts).
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
    // Order placement doesn't require GRX balance up front — only matching/settlement
    // does — so a fresh zero-balance test user can still place (not fill) an order.
    await page.fill('[data-testid="order-amount-input"]', '5');
    await page.fill('[data-testid="order-price-input"]', '4.50');
    await page.click('[data-testid="order-submit-button"]');

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
    await orderCard.getByTestId('cancel-order-button').click();
    await expect(page.locator('text=Order canceled successfully')).toBeVisible({ timeout: 15000 });
    // Same cold-dev-server/refetch latency margin as dca.spec.ts's analogous assertion.
    await expect(orderCard).not.toBeVisible({ timeout: 20000 });
  });
});
