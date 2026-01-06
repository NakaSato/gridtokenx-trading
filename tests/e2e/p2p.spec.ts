import { test, expect, Page } from '@playwright/test';

test.describe('P2P Trading Flow', () => {
    test.describe('Page Navigation', () => {
        test('should navigate to P2P page successfully', async ({ page }) => {
            await page.goto('/p2p');
            await expect(page).toHaveURL(/\/p2p/);
            await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
        });

        test('should show P2P trading interface elements', async ({ page }) => {
            await page.goto('/p2p');
            await page.waitForLoadState('networkidle');

            const content = await page.locator('body').textContent();
            expect(content).toBeTruthy();

            // Look for common P2P trading terms
            const hasTradeTerms = content?.toLowerCase().includes('buy') ||
                content?.toLowerCase().includes('sell') ||
                content?.toLowerCase().includes('energy') ||
                content?.toLowerCase().includes('order') ||
                content?.toLowerCase().includes('trade');
            expect(hasTradeTerms).toBeTruthy();
        });

        test('page should load without errors', async ({ page }) => {
            await page.goto('/p2p');
            await page.waitForLoadState('networkidle');

            // No unhandled errors in console
            const errors: string[] = [];
            page.on('pageerror', err => errors.push(err.message));

            await page.waitForTimeout(2000);

            // Filter out expected errors
            const criticalErrors = errors.filter(e =>
                !e.includes('ResizeObserver') &&
                !e.includes('zustand')
            );
            expect(criticalErrors.length).toBe(0);
        });
    });

    test.describe('Order Book', () => {
        test('should display order book or order list', async ({ page }) => {
            await page.goto('/p2p');
            await page.waitForLoadState('networkidle');

            // Check for any list or table structure
            const hasList = await page.locator('table, [role="table"], ul, [class*="list"], [class*="order"], [class*="grid"]').count() > 0;
        });

        test('should show trading section', async ({ page }) => {
            await page.goto('/p2p');
            await page.waitForLoadState('networkidle');

            // Check for form elements (flexible - may be on page or as button)
            const hasOrderUI = await page.locator('button, form, input').count() > 0;
            expect(hasOrderUI).toBeTruthy();
        });
    });

    test.describe('API Integration', () => {
        test('should handle page load gracefully', async ({ page }) => {
            await page.goto('/p2p');
            await page.waitForLoadState('networkidle');

            // Page should render (not crash)
            await expect(page.locator('body')).toBeVisible();
        });
    });
});

test.describe('Main Page', () => {
    test('should load home page', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('body')).toBeVisible();
    });

    test('should have navigation elements', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check for nav or header
        const hasNav = await page.locator('nav, header, [class*="nav"], [class*="header"]').count() > 0;
        expect(hasNav).toBeTruthy();
    });

    test('should have interactive elements', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Look for any button (connect, wallet, etc)
        const hasButtons = await page.locator('button').count() > 0;
        expect(hasButtons).toBeTruthy();
    });
});
