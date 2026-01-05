import { test, expect, Page, BrowserContext } from '@playwright/test';

// === HELPER FUNCTIONS ===

async function signUpAndLogin(page: Page, prefix: string) {
    const timestamp = Date.now();
    const email = `${prefix}_${timestamp}@test.com`;
    const password = 'StrongP@ssw0rd!';
    const username = `${prefix}${timestamp}`;

    await page.goto('/');

    // Auth Flow
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    await page.getByRole('button', { name: 'Or sign in with email' }).click();
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Fill Form
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('First Name').fill(prefix);
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('Email Address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm Password').fill(password);
    await page.locator('#agree-terms').click();

    // Submit
    const registerResponse = page.waitForResponse(resp =>
        resp.url().includes('/api/v1/auth/register') && resp.ok()
    );
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await registerResponse;

    // Verify Session
    await expect(page.getByRole('button', { name: 'Connect', exact: true })).not.toBeVisible({ timeout: 15000 });

    return { username, email, password };
}

async function placeOrder(page: Page, type: 'Buy' | 'Sell', amount: string, price: string) {
    await page.goto('/p2p');
    await page.waitForLoadState('networkidle');

    // Click Buy or Sell Tab (assuming Tabs usage)
    if (type === 'Sell') {
        await page.getByRole('tab', { name: 'Sell' }).click();
    } else {
        await page.getByRole('tab', { name: 'Buy' }).click();
    }

    // Fill Order Form
    // Using placeholders or labels depending on your UI implementation
    await page.getByPlaceholder('Ex: 50').first().fill(amount); // Amount
    await page.getByPlaceholder('Ex: 0.15').fill(price); // Price

    // Submit
    const orderResponse = page.waitForResponse(resp =>
        resp.url().includes('/api/v1/trading/orders') && resp.status() === 201
    );
    await page.getByRole('button', { name: `Place ${type} Order` }).click();
    await orderResponse;
}

// === TESTS ===

test.describe('Full P2P Trading Lifecycle', () => {
    // Shared contexts for Seller and Buyer
    let sellerContext: BrowserContext;
    let buyerContext: BrowserContext;
    let sellerPage: Page;
    let buyerPage: Page;

    test.beforeAll(async ({ browser }) => {
        // Create two isolated browser contexts
        sellerContext = await browser.newContext();
        buyerContext = await browser.newContext();
        sellerPage = await sellerContext.newPage();
        buyerPage = await buyerContext.newPage();
    });

    test.afterAll(async () => {
        await sellerContext.close();
        await buyerContext.close();
    });

    test('Step 1: Seller registers and places a SELL order', async () => {
        await test.step('Seller Registration', async () => {
            await signUpAndLogin(sellerPage, 'Seller');
        });

        await test.step('Place Sell Order', async () => {
            // Sell 50 kWh @ $0.50
            await placeOrder(sellerPage, 'Sell', '50', '0.50');
        });

        await test.step('Verify Order in List', async () => {
            await expect(sellerPage.getByText('SELL', { exact: true }).first()).toBeVisible();
            await expect(sellerPage.getByText('50.00 kWh').first()).toBeVisible();
            // Should be PENDING initially
            await expect(sellerPage.getByText('PENDING').first()).toBeVisible();
        });
    });

    test('Step 2: Buyer registers and places a matching BUY order', async () => {
        await test.step('Buyer Registration', async () => {
            await signUpAndLogin(buyerPage, 'Buyer');
        });

        await test.step('Place Buy Order', async () => {
            // Buy 50 kWh @ $0.50 (Matches Seller)
            await placeOrder(buyerPage, 'Buy', '50', '0.50');
        });
    });

    test('Step 3: Verify Match and Order Status Update', async () => {
        // Wait for Matching Engine (default cycle might be 1s - 5s)
        // We verify on the Buyer's page first

        await test.step('Wait for Fill', async () => {
            // Reload page periodically to check status
            for (let i = 0; i < 5; i++) {
                await buyerPage.reload();
                await buyerPage.waitForLoadState('networkidle');

                const filledBadge = buyerPage.getByText('FILLED').first();
                if (await filledBadge.isVisible()) {
                    break;
                }
                await buyerPage.waitForTimeout(2000); // Wait 2s
            }

            // Final Assertion
            await expect(buyerPage.getByText('FILLED').first()).toBeVisible();
        });
    });
});
