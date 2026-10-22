import { expect, test } from '@playwright/test';
import { boot, idbPut, stubOpenRouter, STUB_MODEL } from './helpers';

/** Seed a working key so the assistant can actually call the model. */
async function seedKey(page: import('@playwright/test').Page) {
    await idbPut(page, 'apiKeys', {
        id: 'e2e-or-assistant',
        provider: 'OpenRouter',
        key: 'sk-or-e2e-test-key-assistant',
        label: 'e2e-assistant-key',
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

/**
 * The assistant panel must work in the real app: it renders, it takes a
 * question, it streams an answer and it does not break when the runtime has
 * no API key configured.
 */
test.describe('assistant panel', () => {
    test('renders and accepts a question', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));

        await boot(page);
        await page.goto('/assistant');

        await expect(page.getByRole('heading', { name: /помощник проекта/i })).toBeVisible({
            timeout: 60000,
        });

        // The suggestions are the entry points of the panel.
        await expect(page.getByRole('button', { name: /панель памяти/i }).first()).toBeVisible();

        // The user question reaches the assistant and the UI stays alive.
        const input = page.getByLabel('Вопрос помощнику');
        await expect(input).toBeVisible();
        await input.fill('где панель памяти?');
        await input.press('Enter');

        // The user question is echoed in the thread.
        await expect(page.getByText('где панель памяти?')).toBeVisible({ timeout: 30000 });

        // No uncaught exception in the page.
        expect(errors).toEqual([]);
    });

    test('the trust ledger is visible', async ({ page }) => {
        await boot(page);
        await page.goto('/assistant');

        // The ledger lists what the system can do and how far it is trusted.
        const trust = page.locator('.assistant-trust__badge').first();
        await expect(trust).toBeVisible({ timeout: 60000 });
        await expect(trust).toContainText(/verified|discovered|declared/);
    });

    test('a screenshot of the panel', async ({ page }) => {
        await boot(page);
        await seedKey(page);
        await stubOpenRouter(page);
        await page.reload();
        await boot(page);
        await page.goto('/assistant');
        await expect(page.getByRole('heading', { name: /помощник проекта/i })).toBeVisible({
            timeout: 60000,
        });
        const input = page.getByLabel('Вопрос помощнику');
        await input.fill('где панель памяти и что её обслуживает?');
        // Enter submits the form; clicking the button is flaky while the
        // layout shifts under the streaming answer.
        await input.press('Enter');
        await expect(page.getByText(/-PATH-42/).first()).toBeVisible({ timeout: 90000 });
        await page.screenshot({ path: 'test-results/assistant-panel.png', fullPage: false });
    });
});
