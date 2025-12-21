import { test, expect, request } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should allow a user to sign up and log in via Modal', async ({ page }) => {
        const timestamp = Date.now();
        const email = `e2e_${timestamp}@test.com`;
        const password = 'StrongP@ssw0rd!';
        const username = `user${timestamp}`;
        const firstName = 'Test';
        const lastName = 'User';

        // 1. Open Home
        await page.goto('/');

        // 2. Open Wallet/Auth Modal
        await page.getByRole('button', { name: 'Connect', exact: true }).click();

        // 3. Switch to Email Sign In
        await page.getByRole('button', { name: 'Or sign in with email' }).click();

        // 4. Switch to Sign Up
        await page.getByRole('button', { name: 'Sign up' }).click();

        // 5. Fill Registration Form
        await page.getByLabel('Username').fill(username);
        await page.getByLabel('First Name').fill(firstName);
        await page.getByLabel('Last Name').fill(lastName);
        await page.getByLabel('Email Address').fill(email);
        await page.getByLabel('Password', { exact: true }).fill(password);
        await page.getByLabel('Confirm Password').fill(password);

        // Check "I agree to the Terms" - using click instead of check for Radix checkbox
        await page.locator('#agree-terms').click();

        // 6. Submit Sign Up
        const registerResponse = page.waitForResponse(resp => resp.url().includes('/api/v1/auth/register') && resp.ok());
        await page.getByRole('button', { name: 'Sign Up' }).click();
        await registerResponse;

        // 7. Verify Login State - "Connect" button should disappear after successful registration
        // If the Connect button is not visible, it means authentication was successful and the user is logged in
        await expect(page.getByRole('button', { name: 'Connect', exact: true })).not.toBeVisible({ timeout: 10000 });
    });

    test('should navigate to forgot password page', async ({ page }) => {
        await page.goto('/forgot-password');

        // Verify page loaded
        await expect(page.getByText('Forgot Password?')).toBeVisible();
        await expect(page.getByLabel('Email Address')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Send Reset Link' })).toBeVisible();
    });

    test('should submit forgot password request', async ({ page }) => {
        const timestamp = Date.now();
        const email = `forgot_${timestamp}@test.com`;

        // Navigate to forgot password
        await page.goto('/forgot-password');

        // Submit email for reset
        await page.getByLabel('Email Address').fill(email);

        const forgotResponse = page.waitForResponse(resp =>
            resp.url().includes('/api/v1/auth/forgot-password') && resp.ok()
        );
        await page.getByRole('button', { name: 'Send Reset Link' }).click();
        await forgotResponse;

        // Verify generic success message (doesn't reveal if email exists)
        await expect(page.getByText('If an account with that email exists')).toBeVisible({ timeout: 5000 });
    });

    test('should show reset password page with valid token', async ({ page }) => {
        // Navigate directly to reset page with a mock token
        await page.goto('/reset-password?token=test-token-123');

        // Verify form elements are present
        await expect(page.getByLabel('New Password')).toBeVisible();
        await expect(page.getByLabel('Confirm Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Reset Password' })).toBeVisible();
    });

    test('should show error for missing token on reset page', async ({ page }) => {
        // Navigate to reset page without token
        await page.goto('/reset-password');

        // Verify error message
        await expect(page.getByText('Invalid Reset Link')).toBeVisible({ timeout: 5000 });
    });
});
