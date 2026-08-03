import { test, expect } from '@playwright/test';

test.describe('DCA Trading Flow', () => {
  test('should register, login, and create a DCA order (management UI removed in 63894b7)', async ({ page }) => {
    // Use a high timeout for e2e flow touching the db; bumped from 60s since the sum
    // of individual step waits (register/verify/login/create/pause/resume/cancel,
    // each with its own 15-20s budget against a cold Turbopack dev server) can exceed it.
    test.setTimeout(120000);

    const timestamp = Date.now();
    const username = `dca_ui_${timestamp}`;
    const email = `dca_ui_${timestamp}@example.com`;
    const password = 'Test123!@#';
    const dcaName = `My DCA ${timestamp}`;

    // 1. Visit Homepage
    await page.goto('/');

    // Wait a bit for hydrations
    await page.waitForTimeout(1000);

    // 2. Sign Up
    await page.locator('button', { hasText: /^Connect$/ }).first().click();
    // Wait for modal animation
    await page.waitForTimeout(500);
    // Modal opens on the email sign-in tab (wallet-signature login is not
    // supported by IAM, so 'signin' is the default authMode) — switch straight
    // to the sign-up form.
    await page.click('button:has-text("Sign up")');

    await page.fill('#signup-username', username);
    await page.fill('#signup-first-name', 'Play');
    await page.fill('#signup-last-name', 'Wright');
    await page.fill('#signup-email', email);
    await page.fill('#signup-password', password);
    await page.fill('#signup-confirm-password', password);
    await page.locator('#agree-terms').click({ force: true });

    await page.click('button:has-text("Sign Up")');

    // Wait for registration success toast
    await expect(page.locator('text=Registration successful').first()).toBeVisible({ timeout: 15000 });

    // Wait for post-registration redirect
    await page.waitForTimeout(2000);

    // Registration leaves the account inactive (is_active=false) until email
    // verification (gridtokenx-iam-service auth_service.rs register()); login
    // on an unverified account 401s with AUTH_1005 EmailNotVerified (after the
    // password check), so without this step the UI stops at the
    // "verify your email" alert instead of signing in.
    // Dev/non-production builds accept a `verify_<email>` token without a DB lookup
    // (auth_service.rs verify_email()), same shortcut tests/e2e/90_golden_path uses.
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://apisix.gridtokenx-coresystem.orb.local';
    const verifyResp = await page.request.get(
      `${apiBase}/api/v1/auth/verify?token=verify_${encodeURIComponent(email)}`
    );
    expect(verifyResp.ok()).toBeTruthy();

    // 3. Log In
    await page.locator('button', { hasText: /^Connect$/ }).first().click();
    await page.waitForTimeout(1000); // Keep this wait for modal animation

    // The modal remembers its last state ('signup'). We need to click the "Sign in" link at the bottom.
    // The submit button says "Sign Up", but the link says "Sign in". We can click the exact text "Sign in".
    await page.locator('button', { hasText: /^Sign in$/ }).click();

    // Fill login
    await page.fill('#username', username);
    await page.fill('#password', password);
    // The modal login button has text "Sign In" or "Signing In..."
    // Use a broader text match or ID if possible. has-text can match any node containing it.
    // We can just use the exact text or type=submit
    // There is a form with submit, so let's hit the submit button
    await page.locator('button[type="submit"]:has-text("Sign In")').click();

    // Wait for login toast
    await expect(page.locator(`text=Welcome back, ${username}!`)).toBeVisible({ timeout: 15000 });

    // Wait for the auth context to apply and the page to fully load the trading interface
    await page.waitForTimeout(2000);

    // 4. Navigate to DCA form
    // button:has-text("DCA") is ambiguous — TradingPositions.tsx has its own Radix
    // TabsTrigger value="DCA" (a positions-panel tab, unrelated to order entry) that
    // can resolve first in DOM order and isn't reliably visible/stable, causing flaky
    // 60s timeouts. Use the OrderTypeTabs order-entry switcher (the one that actually
    // sets orderType='recurring' and mounts RecurringOrderForm) via its testid.
    await page.click('[data-testid="order-type-tab-dca"]');
    await expect(page.locator('text=Strategy Name')).toBeVisible({ timeout: 5000 });

    // 5. Create a Strategy
    // NOTE: input[placeholder="0.00"] is ambiguous — the surrounding order panel
    // has its own Amount field with the same placeholder, so a bare placeholder
    // selector silently fills the wrong input, leaving the DCA form's `amount`
    // state empty (which disables the SlideToConfirm submit). Use the testid.
    await page.fill('input[placeholder="e.g. Daily Solar Buy"]', dcaName);
    await page.fill('[data-testid="dca-amount-input"]', '10.5');

    // Set interval to Daily
    // Clicking the "Daily" button in frequency config
    await page.click('button:has-text("Daily")');

    // Submit: form's confirm control is a pointer-drag "slide to confirm" thumb
    // (RecurringOrderForm.tsx SlideToConfirm), not a clickable button — drag the
    // thumb past SLIDE_THRESHOLD (0.7 of max travel) toward the right/Buy side.
    const slideTrack = page.getByTestId('slide-to-confirm-track');
    const slideThumb = page.getByTestId('slide-to-confirm-thumb');
    // boundingBox() does NOT auto-scroll (unlike .click()) — without this, coordinates
    // can resolve to a clipped/off-screen position under the sticky header above the
    // scrollable form, so the mouse drag silently misses the thumb entirely.
    await slideThumb.scrollIntoViewIfNeeded();
    const trackBox = await slideTrack.boundingBox();
    const thumbBox = await slideThumb.boundingBox();
    if (!trackBox || !thumbBox) throw new Error('slide-to-confirm track/thumb not found');
    const startX = thumbBox.x + thumbBox.width / 2;
    const y = thumbBox.y + thumbBox.height / 2;
    const endX = trackBox.x + trackBox.width - thumbBox.width / 2 - 2; // far right, well past the 0.7 threshold
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y, { steps: 15 });
    await page.mouse.up();

    // Check for success message inside form or toast
    await expect(page.locator('text=DCA strategy created')).toBeVisible({ timeout: 15000 });

    // ── Management steps (list -> pause -> resume -> cancel) REMOVED ──────────
    // They drove RecurringOrdersList via the positions-panel DCA tab
    // (positions-tab-dca). Commit 63894b7 "refactor(trading): migrate to
    // features/, dedupe the positions surface" removed BOTH: the tab strip is now
    // Positions/LiveGrid/P2PActivity/OpenOrders/History/Alerts and no component
    // renders "Pause Strategy"/"Resume Strategy" anywhere. Creation (asserted
    // above) is the whole surface the UI still exposes for DCA; restore the
    // management flow here when (if) a management surface returns. The backend
    // CRUD is covered separately by tests/e2e/40_trading
    // test_recurring_order_crud_lifecycle in the superproject.
  });
});
