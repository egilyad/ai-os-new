import { test, expect } from '@playwright/test';
import { boot, dismissWizard, idbPut, STUB_MODEL } from './helpers';

// Key data-flow: UI create/persist + seeded render. Conventions verified
// against src, 2026-10: AddKeyModal provider card `OpenRouter`, `#apiKey`
// accepts `sk-or-*`, `Save Close` persists with status `pending`, no network.

test.describe('AI-OS Data Keys', () => {
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
        expect(count).toBeGreaterThanOrEqual(1);

        await page.reload();
        await boot(page);
        await page.goto('/keys');
        await dismissWizard(page);
        await expect(page.getByText('e2e-openrouter-01').first()).toBeVisible({
            timeout: 30000,
        });
    });
});
