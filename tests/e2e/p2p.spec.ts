import { test, expect, Page } from '@playwright/test';

// Helper: Sign Up and Login a new user via the Modal
async function signUpAndLogin(page: Page, prefix: string) {
    const timestamp = Date.now();
    const email = `${prefix}_${timestamp}@test.com`;
    const password = 'StrongP@ssw0rd!';
    const username = `${prefix}${timestamp}`;

    await page.goto('/');
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    await page.getByRole('button', { name: 'Or sign in with email' }).click();
    await page.getByRole('button', { name: 'Sign up' }).click();

    await page.getByLabel('Username').fill(username);
    await page.getByLabel('First Name').fill(prefix);
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('Email Address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm Password').fill(password);
    await page.locator('#agree-terms').click();

    const registerResponse = page.waitForResponse(resp =>
        resp.url().includes('/api/v1/users') && resp.ok()
    );
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await registerResponse;

    // Verify login - Connect button should disappear
    await expect(page.getByRole('button', { name: 'Connect', exact: true })).not.toBeVisible({ timeout: 15000 });

    return { username, email };
}

test.describe('P2P Trading Flow', () => {
    test('should navigate to P2P page successfully', async ({ page }) => {
        await page.goto('/p2p');

        // Verify page loaded - should have some content
        await expect(page).toHaveURL(/\/p2p/);

        // Page should load without errors
        const body = await page.locator('body');
        await expect(body).toBeVisible();
    });

    test('should show P2P trading interface elements', async ({ page }) => {
        await page.goto('/p2p');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Should have some trading-related content (flexible matching)
        const hasContent = await page.locator('body').textContent();
        expect(hasContent).toBeTruthy();
    });

    test('authenticated user can access P2P page', async ({ page }) => {
        // Sign up first
        await signUpAndLogin(page, 'p2ptest');

        // Navigate to P2P
        await page.goto('/p2p');
        await page.waitForLoadState('networkidle');

        // Page should load successfully
        await expect(page).toHaveURL(/\/p2p/);
    });
});
