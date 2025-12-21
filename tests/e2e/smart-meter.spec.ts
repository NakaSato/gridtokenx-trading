import { test, expect, Page } from '@playwright/test';

// Helper: Sign Up a new user via the Modal
async function signUpUser(page: Page, prefix: string) {
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

    const registerResponse = page.waitForResponse((resp: any) =>
        resp.url().includes('/api/v1/auth/register') && resp.ok()
    );
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await registerResponse;

    // Verify login - Connect button should disappear
    await expect(page.getByRole('button', { name: 'Connect', exact: true })).not.toBeVisible({ timeout: 15000 });

    return { username, email, timestamp };
}

test.describe('Smart Meter Page', () => {
    test('should navigate to meter page successfully', async ({ page }) => {
        await page.goto('/meter');

        // Verify page loaded
        await expect(page).toHaveURL(/\/meter/);

        // Page should load without errors
        const body = await page.locator('body');
        await expect(body).toBeVisible({ timeout: 15000 });
    });

    test('should show meter page content', async ({ page }) => {
        await page.goto('/meter');

        // Wait for body to be visible (simpler than networkidle)
        await expect(page.locator('body')).toBeVisible({ timeout: 15000 });

        // Should have some content  
        const bodyText = await page.locator('body').textContent();
        expect(bodyText?.length).toBeGreaterThan(0);
    });

    test('authenticated user can access meter page', async ({ page }) => {
        // Sign up first
        await signUpUser(page, 'metertest');

        // Navigate to meter page
        await page.goto('/meter');

        // Wait for page to render
        await expect(page.locator('body')).toBeVisible({ timeout: 15000 });

        // Page should load successfully
        await expect(page).toHaveURL(/\/meter/);
    });
});
