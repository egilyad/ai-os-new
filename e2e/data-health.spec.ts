import { test, expect } from '@playwright/test';
import { boot, dismissWizard, idbPut, stubOpenRouter } from './helpers';

// Health data-flow: mocked GET /models flips a pending key to active
// (key-health.ts success path persists status + latency via saveKeys).

test.describe('AI-OS Data Health', () => {
    // Boot + reload + reboot per test can exceed the 180s suite default.
    test.describe.configure({ timeout: 300000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('mocked health check flips pending key to active', async ({ page }) => {
        await idbPut(page, 'apiKeys', {
            id: 'e2e-or-pending',
            provider: 'OpenRouter',
            key: 'sk-or-e2e-test-key-002',
            label: 'e2e-pending-01',
            status: 'pending',
            // Required by ApiKeySchema — rows without stats are quarantined
            // by the startup integrity scan and invisible to services.
            stats: {
                successCount: 0,
                errorCount: 0,
                totalTokens: 0,
                avgLatency: 0,
                minLatency: 0,
                maxLatency: 0,
            },
            createdAt: Date.now(),
        });
        await stubOpenRouter(page);

        await page.reload();
        await boot(page);
        await page.goto('/keys');
        await dismissWizard(page);

        const row = page.locator('tr:has-text("e2e-pending-01")');
        await expect(row).toBeVisible({ timeout: 30000 });
        await row.getByTitle('Check Health').click();
        // Title flips to Disable once the key becomes active.
        await expect(row.getByTitle('Disable')).toBeVisible({ timeout: 60000 });

        await page.reload();
        await boot(page);
        await page.goto('/keys');
        await dismissWizard(page);
        const rowAfter = page.locator('tr:has-text("e2e-pending-01")');
        await expect(rowAfter).toBeVisible({ timeout: 30000 });
        await expect(rowAfter.getByTitle('Disable')).toBeVisible({ timeout: 15000 });
    });
});
