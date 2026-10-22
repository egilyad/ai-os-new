import { expect, test } from '@playwright/test';
import { boot, idbPut, stubOpenRouter, stubOpenRouterToolCall, STUB_MODEL } from './helpers';

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

    test('the assistant actually acts: opens the panel it was asked for', async ({ page }) => {
        await boot(page);
        await seedKey(page);
        await stubOpenRouterToolCall(page, {
            tool: 'ui.openPanel',
            args: { panelId: 'agents', reason: 'e2e' },
            reply: 'Панель агентов открыта.',
        });
        await page.reload();
        await boot(page);
        await page.goto('/assistant');
        await expect(page.getByRole('heading', { name: /помощник проекта/i })).toBeVisible({
            timeout: 60000,
        });

        const input = page.getByLabel('Вопрос помощнику');
        await input.fill('открой панель агентов');
        await input.press('Enter');

        // The tool call crossed the streaming adapter, the registry ran it and
        // the interface confirmed the navigation: the browser is on /agents.
        await page.waitForURL('**/agents', { timeout: 90000 });
    });

    test('a write action waits for the human, then reports what changed', async ({ page }) => {
        await boot(page);
        await seedKey(page);
        await stubOpenRouterToolCall(page, {
            tool: 'settings.update',
            args: { defaultMode: 'single' },
            reply: 'Режим по умолчанию теперь single.',
        });
        await page.reload();
        await boot(page);
        await page.goto('/assistant');
        await expect(page.getByRole('heading', { name: /помощник проекта/i })).toBeVisible({
            timeout: 60000,
        });

        const input = page.getByLabel('Вопрос помощнику');
        await input.fill('поставь режим по умолчанию single');
        await input.press('Enter');

        // The guarded action does not run by itself: the global approval layer
        // asks the human first and names the tool it wants to use.
        await expect(page.getByText('Инструмент: settings.update')).toBeVisible({ timeout: 90000 });
        await page.getByRole('button', { name: 'Разрешить' }).click();

        // Only after approval the tool runs and the model continues the answer.
        // (The answer used to vanish: the cache replayed the empty tool-call
        // turn back into the loop, so the second round had no text and no calls.)
        await expect(page.getByText('Режим по умолчанию теперь single.')).toBeVisible({
            timeout: 90000,
        });
    });

    test('the assistant is a real agent in the topology', async ({ page }) => {
        await boot(page);
        await page.goto('/agents');

        // The assistant is not a side panel: it is a node of the topology and
        // the admin shows it as a built-in agent.
        const search = page.getByLabel('Search agents');
        await expect(search).toBeVisible({ timeout: 60000 });
        await search.fill('Project Assistant');
        await expect(page.getByText('Project Assistant').first()).toBeVisible({ timeout: 30000 });
        await expect(page.getByText('built-in').first()).toBeVisible({ timeout: 30000 });
        await page.screenshot({ path: 'test-results/assistant-agent.png', fullPage: false });
    });
});
