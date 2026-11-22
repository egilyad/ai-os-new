import { test, expect, type Page } from '@playwright/test';
import { boot, dismissWizard, idbPut, stubOpenRouter, STUB_MODEL } from './helpers';

async function seedKey(page: Page) {
    await idbPut(page, 'apiKeys', {
        id: 'e2e-or-run-history',
        provider: 'OpenRouter',
        key: 'sk-or-e2e-test-key-003',
        label: 'e2e-run-history-key',
        status: 'active',
        availableModels: [STUB_MODEL],
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
}

test.describe('AI-OS two-agent run history', () => {
    test.describe.configure({ timeout: 600000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('first run → two agents → result → history after reload', async ({ page }) => {
        await seedKey(page);
        await stubOpenRouter(page);

        await page.reload();
        await boot(page);
        await page.goto('/debate');
        await dismissWizard(page);

        const topic = page.getByPlaceholder('Enter the topic or question to debate...');
        await expect(topic).toBeVisible({ timeout: 60000 });
        await topic.fill('e2e run history topic 42');
        for (let i = 0; i < 8; i++) {
            const remove = page.locator('main button[aria-label^="Remove "]');
            if ((await remove.count()) <= 2) break;
            await remove.last().click();
        }
        await page.locator('main input[type="number"]').fill('2');
        const start = page.getByRole('button', { name: /start debate/i });
        await expect(start).toBeEnabled({ timeout: 30000 });
        await start.click();

        await expect(start).toBeHidden({ timeout: 60000 });
        await expect(page.getByText(/-PATH-42/).first()).toBeVisible({ timeout: 240000 });

        await page.reload();
        await boot(page);
        await page.goto('/debate');
        await dismissWizard(page);
        await expect(page.getByText('e2e run history topic 42').first()).toBeVisible({
            timeout: 60000,
        });
    });
});
