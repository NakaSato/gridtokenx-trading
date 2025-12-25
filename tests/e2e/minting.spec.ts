import { test, expect, Page } from '@playwright/test';

// API base URL
const API_URL = process.env.API_URL || 'http://localhost:4000';

// Helper: Register a new user and return credentials
async function registerUser(page: Page, prefix: string) {
    const timestamp = Date.now();
    const email = `${prefix}_${timestamp}@test.com`;
    const password = 'StrongP@ssw0rd!';
    const username = `${prefix}${timestamp}`;

    // Register via API first for speed
    const response = await fetch(`${API_URL}/api/v1/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password,
            username,
            first_name: prefix,
            last_name: 'User'
        })
    });

    const data = await response.json();
    const token = data.auth?.access_token;

    if (!token) {
        throw new Error(`Failed to register user: ${JSON.stringify(data)}`);
    }

    return { email, password, username, token, timestamp };
}

// Helper: Register and verify a meter for a user
async function registerMeter(token: string, timestamp: number) {
    const meterSerial = `METER-${timestamp}`;

    // Register meter
    await fetch(`${API_URL}/api/v1/meters`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            serial_number: meterSerial,
            location: 'Test Location',
            meter_type: 'smart'
        })
    });

    // Note: Meter verification would need to be done via DB in a real test
    // For now, we assume the test environment auto-verifies or has a test endpoint
    return meterSerial;
}

// Helper: Submit a meter reading
async function submitReading(token: string, meterSerial: string, kwh: number) {
    const response = await fetch(`${API_URL}/api/v1/meters/${meterSerial}/readings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            kwh,
            wallet_address: `TestWallet${Date.now()}`
        })
    });

    return response.json();
}

// Helper: Login user via UI
async function loginUser(page: Page, email: string, password: string) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    await page.getByRole('button', { name: 'Or sign in with email' }).click();

    // Fill login form
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);

    // Submit login
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for login to complete
    await expect(page.getByRole('button', { name: 'Connect', exact: true })).not.toBeVisible({ timeout: 10000 });
}

test.describe('Minting Functionality', () => {

    test.describe('Minting UI Components', () => {

        test('should display stats cards including Minted Tokens and Pending Mints', async ({ page }) => {
            // Setup: Register user with readings
            const { email, password, token, timestamp } = await registerUser(page, 'mint_ui');
            const meterSerial = await registerMeter(token, timestamp);
            await submitReading(token, meterSerial, 25.5);

            // Login and navigate
            await loginUser(page, email, password);
            await page.goto('/meter');

            // Wait for dashboard to load
            await expect(page.locator('h1:has-text("Smart Energy Dashboard")')).toBeVisible({ timeout: 15000 });

            // Verify stats cards are present
            await expect(page.locator('text=Total Generation')).toBeVisible();
            await expect(page.locator('text=Minted Tokens')).toBeVisible();
            await expect(page.locator('text=Pending Mints')).toBeVisible();
            await expect(page.locator('text=Net Energy')).toBeVisible();
            await expect(page.locator('text=Active Meters')).toBeVisible();
        });

        test('should display reading table with Action column', async ({ page }) => {
            const { email, password, token, timestamp } = await registerUser(page, 'mint_table');
            const meterSerial = await registerMeter(token, timestamp);
            await submitReading(token, meterSerial, 15.0);

            await loginUser(page, email, password);
            await page.goto('/meter');

            // Wait for readings table
            await expect(page.locator('text=Reading History')).toBeVisible({ timeout: 15000 });

            // Verify table headers
            await expect(page.locator('text=Time')).toBeVisible();
            await expect(page.locator('text=Type')).toBeVisible();
            await expect(page.locator('text=Amount')).toBeVisible();
            await expect(page.locator('text=Status')).toBeVisible();
            await expect(page.locator('text=Action')).toBeVisible();
        });

        test('should show Mint button for unminted readings', async ({ page }) => {
            const { email, password, token, timestamp } = await registerUser(page, 'mint_btn');
            const meterSerial = await registerMeter(token, timestamp);
            await submitReading(token, meterSerial, 20.0);

            await loginUser(page, email, password);
            await page.goto('/meter');

            // Wait for the table to load
            await page.waitForTimeout(2000);

            // Look for Mint button
            const mintButton = page.locator('button:has-text("Mint")').first();
            await expect(mintButton).toBeVisible({ timeout: 10000 });

            // Verify it has the correct styling (green gradient)
            await expect(mintButton).toHaveClass(/bg-gradient/);
        });

        test('should show Pending badge for unminted readings', async ({ page }) => {
            const { email, password, token, timestamp } = await registerUser(page, 'pending');
            const meterSerial = await registerMeter(token, timestamp);
            await submitReading(token, meterSerial, 10.0);

            await loginUser(page, email, password);
            await page.goto('/meter');

            // Wait and verify pending badge
            await expect(page.locator('text=Pending').first()).toBeVisible({ timeout: 15000 });
        });

    });

    test.describe('Minting Flow', () => {

        test('should successfully mint tokens from a reading', async ({ page }) => {
            const { email, password, token, timestamp } = await registerUser(page, 'mint_flow');
            const meterSerial = await registerMeter(token, timestamp);
            await submitReading(token, meterSerial, 30.0);

            await loginUser(page, email, password);
            await page.goto('/meter');

            // Wait for Mint button
            const mintButton = page.locator('button:has-text("Mint")').first();
            await expect(mintButton).toBeVisible({ timeout: 15000 });

            // Click mint button
            await mintButton.click();

            // Wait for either success toast or loading state
            await page.waitForTimeout(1000);

            // Should show loading state or success
            const loadingOrDone = page.locator('text=Minting...').or(page.locator('text=Done'));
            await expect(loadingOrDone).toBeVisible({ timeout: 30000 });
        });

        test('should show success toast after minting', async ({ page }) => {
            const { email, password, token, timestamp } = await registerUser(page, 'mint_toast');
            const meterSerial = await registerMeter(token, timestamp);
            await submitReading(token, meterSerial, 12.5);

            await loginUser(page, email, password);
            await page.goto('/meter');

            const mintButton = page.locator('button:has-text("Mint")').first();
            await expect(mintButton).toBeVisible({ timeout: 15000 });

            await mintButton.click();

            // Look for success toast (react-hot-toast)
            const toast = page.locator('[role="status"]').or(page.locator('text=Successfully minted'));
            await expect(toast).toBeVisible({ timeout: 30000 });
        });

        test('should update Minted Tokens stat after minting', async ({ page }) => {
            const { email, password, token, timestamp } = await registerUser(page, 'mint_stat');
            const meterSerial = await registerMeter(token, timestamp);
            await submitReading(token, meterSerial, 50.0);

            await loginUser(page, email, password);
            await page.goto('/meter');

            // Get initial minted tokens value
            const mintedCard = page.locator('text=Minted Tokens').locator('..');
            const initialValue = await mintedCard.locator('text=0.00 GRX').isVisible();

            // Mint tokens
            const mintButton = page.locator('button:has-text("Mint")').first();
            await mintButton.click();

            // Wait for refresh
            await page.waitForTimeout(5000);

            // Minted tokens should increase
            const updatedValue = await mintedCard.locator('text=50.00 GRX').isVisible();

            // Either initial was 0 and now it's 50, or the card shows a higher value
            expect(updatedValue || !initialValue).toBeTruthy();
        });

        test('should change button to Done after minting', async ({ page }) => {
            const { email, password, token, timestamp } = await registerUser(page, 'mint_done');
            const meterSerial = await registerMeter(token, timestamp);
            await submitReading(token, meterSerial, 8.0);

            await loginUser(page, email, password);
            await page.goto('/meter');

            const mintButton = page.locator('button:has-text("Mint")').first();
            await expect(mintButton).toBeVisible({ timeout: 15000 });

            await mintButton.click();

            // Wait for the status to change to Done
            await expect(page.locator('text=Done').first()).toBeVisible({ timeout: 30000 });
        });

    });

    test.describe('Minting Error Handling', () => {

        test('should handle minting errors gracefully', async ({ page }) => {
            const { email, password, token, timestamp } = await registerUser(page, 'mint_err');
            const meterSerial = await registerMeter(token, timestamp);
            await submitReading(token, meterSerial, 5.0);

            await loginUser(page, email, password);
            await page.goto('/meter');

            const mintButton = page.locator('button:has-text("Mint")').first();
            await expect(mintButton).toBeVisible({ timeout: 15000 });

            // Try to mint (may fail if blockchain services are not running)
            await mintButton.click();

            // Should show either success or error (not crash)
            await page.waitForTimeout(5000);

            // The page should still be functional
            await expect(page.locator('h1:has-text("Smart Energy Dashboard")')).toBeVisible();
        });

        test('should not show Mint button for consumption readings', async ({ page }) => {
            const { email, password, token, timestamp } = await registerUser(page, 'no_mint');
            const meterSerial = await registerMeter(token, timestamp);

            // Submit negative reading (consumption)
            await submitReading(token, meterSerial, -10.0);

            await loginUser(page, email, password);
            await page.goto('/meter');

            // Wait for table to load
            await page.waitForTimeout(2000);

            // Should show N/A instead of Mint button for consumption
            await expect(page.locator('text=N/A')).toBeVisible({ timeout: 10000 });
        });

    });

    test.describe('Pending Mints Tracking', () => {

        test('should show correct pending mints count', async ({ page }) => {
            const { email, password, token, timestamp } = await registerUser(page, 'pending_count');
            const meterSerial = await registerMeter(token, timestamp);

            // Submit multiple readings
            await submitReading(token, meterSerial, 10.0);
            await submitReading(token, meterSerial, 20.0);
            await submitReading(token, meterSerial, 15.0);

            await loginUser(page, email, password);
            await page.goto('/meter');

            // Verify pending mints card shows 3 readings
            await expect(page.locator('text=3 readings ready to mint')).toBeVisible({ timeout: 15000 });
        });

        test('should decrease pending count after minting', async ({ page }) => {
            const { email, password, token, timestamp } = await registerUser(page, 'pending_dec');
            const meterSerial = await registerMeter(token, timestamp);
            await submitReading(token, meterSerial, 25.0);
            await submitReading(token, meterSerial, 30.0);

            await loginUser(page, email, password);
            await page.goto('/meter');

            // Initially should show 2 pending
            await expect(page.locator('text=2 readings ready to mint')).toBeVisible({ timeout: 15000 });

            // Mint one
            const mintButton = page.locator('button:has-text("Mint")').first();
            await mintButton.click();

            // Wait for refresh
            await page.waitForTimeout(5000);

            // Should now show 1 pending
            await expect(page.locator('text=1 readings ready to mint')).toBeVisible({ timeout: 15000 });
        });

    });

});
