import { test, expect } from '@playwright/test';
import {
    boot,
    dismissWizard,
    idbPut,
    stubOpenRouter,
    STUB_MODEL,
    STUB_REPLY,
} from './helpers';

// Data-flow e2e (TS9-04): scenarios WITH data — key create/persist, seeded
// key render, health-check flip (mocked network), chat send (mocked
// provider) + history persist.
//
// Conventions (verified against src, 2026-10):
// - Dexie DB `super_agents_os_v4`, stores `apiKeys` / `sessions` keyed by `id`.
// - AddKeyModal: provider card `OpenRouter` -> `#apiKey` accepts `sk-or-*`
//   ("Detected: ..."), `Save Close` persists with status `pending`, no network.
// - `Check Health` (title attr) flips pending->active via GET /models.
// - Chat auto-selects first `active` key; `OpenRouter` falls back to
//   `openai/gpt-4o` without discovery. POST /chat/completions carries
//   `stream:true` when streaming, else plain JSON.

test.describe('AI-OS Data Flow', () => {
    // Boot + reload + reboot per test can exceed the 180s suite default.
    test.describe.configure({ timeout: 300000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('key created via UI persists across reload', async ({ page }) => {
        await page.goto('/keys');
        await dismissWizard(page);
        await expect(
            page.getByRole('button', { name: /add custom provider/i }),
        ).toBeVisible({ timeout: 30000 });

        // The wizard can pop up after hydration — dismiss again right
        // before clicking, and bound the click so a covered button fails
        // fast instead of burning the whole test timeout on retries.
        await dismissWizard(page);
        await page
            .getByRole('button', { name: /add custom provider/i })
            .click({ timeout: 60000 });
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 15000 });

        // Step 1: pick provider. Default state is already OpenRouter, but
        // clicking the card also generates the label alias (openrouter-01).
        await dialog.getByRole('button', { name: /openrouter/i }).first().click();
        await expect(dialog.getByLabel('API key')).toBeVisible({ timeout: 15000 });

        // Step 2: fill key. sk-or-* passes local format check, no network.
        await dialog.getByLabel('API key').fill('sk-or-e2e-ui-001');
        await expect(dialog.getByText(/detected: openrouter/i)).toBeVisible({
            timeout: 10000,
        });

        // Save & close path: persists with status pending, skips /models.
        await dialog.getByRole('button', { name: 'Save Close', exact: true }).click();
        await expect(dialog).toBeHidden({ timeout: 15000 });

        const label = 'openrouter-01';
        await expect(page.getByText(label).first()).toBeVisible({ timeout: 15000 });

        await page.reload();
        await boot(page);
        await page.goto('/keys');
        await dismissWizard(page);
        await expect(page.getByText(label).first()).toBeVisible({ timeout: 30000 });
    });

    test('seeded active key renders in keys list', async ({ page }) => {
        const count = await idbPut(page, 'apiKeys', {
            id: 'e2e-or-1',
            provider: 'OpenRouter',
            key: 'sk-or-e2e-test-key-001',
            label: 'e2e-openrouter-01',
            status: 'active',
            availableModels: [STUB_MODEL],
            createdAt: Date.now(),
        });
        expect(count).toBeGreaterThanOrEqual(1);

        await page.reload();
        await boot(page);
        await page.goto('/keys');
        await dismissWizard(page);
        await expect(page.getByText('e2e-openrouter-01').first()).toBeVisible({
            timeout: 30000,
        });
    });

    test('mocked health check flips pending key to active', async ({ page }) => {
        await idbPut(page, 'apiKeys', {
            id: 'e2e-or-pending',
            provider: 'OpenRouter',
            key: 'sk-or-e2e-test-key-002',
            label: 'e2e-pending-01',
            status: 'pending',
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

    test('chat send via mocked provider persists history', async ({ page }) => {
        await idbPut(page, 'apiKeys', {
            id: 'e2e-or-chat',
            provider: 'OpenRouter',
            key: 'sk-or-e2e-test-key-003',
            label: 'e2e-chat-key',
            status: 'active',
            availableModels: [STUB_MODEL],
            createdAt: Date.now(),
        });
        await stubOpenRouter(page);

        await page.reload();
        await boot(page);
        await page.goto('/chat');
        await dismissWizard(page);

        // Textarea is enabled only when a key is auto-selected.
        const box = page.getByPlaceholder('Type a message...');
        await expect(box).toBeEnabled({ timeout: 30000 });
        await box.fill('e2e ping 42');
        await page.getByRole('button', { name: 'Send', exact: true }).click();

        await expect(page.getByText(STUB_REPLY).first()).toBeVisible({ timeout: 60000 });

        await page.reload();
        await boot(page);
        await page.goto('/chat');
        await dismissWizard(page);
        await expect(page.getByText('e2e ping 42').first()).toBeVisible({
            timeout: 30000,
        });
    });
});
