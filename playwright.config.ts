import { defineConfig, devices } from '@playwright/test';

// Overridable so the suite can run when another Next app (e.g. the explorer)
// already occupies 3000 — `PORT=3010 bunx playwright test`. Next dev respects
// the same PORT env, so webServer and baseURL stay in sync.
const PORT = process.env.PORT || '3000';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'on',
        screenshot: 'only-on-failure',
        // Dev APISIX (…orb.local) serves the self-signed local CA; without this
        // page.request calls (e.g. the email-verify shortcut) fail TLS checks.
        ignoreHTTPSErrors: true,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Run your local dev server before starting the tests
    webServer: {
        command: 'npm run dev',
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
    },
});
