import { test, expect } from '@playwright/test';
import { boot, dismissWizard, idbPut, stubOpenRouter, STUB_MODEL } from './helpers';

// Room invocation circuit: pick agent + task -> Invocation Engine (default
// seeded "Manual Room Chat" policy matches source human-mention) -> chat-mode
// execution via the stubbed provider -> invocation listed with the task text.

test.describe('AI-OS Data Room', () => {
    test.describe.configure({ timeout: 300000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('room invoke lists the invocation', async ({ page }) => {
        await idbPut(page, 'apiKeys', {
            id: 'e2e-or-room',
            provider: 'OpenRouter',
            key: 'sk-or-e2e-test-key-003',
            label: 'e2e-room-key',
            status: 'active',
            availableModels: [STUB_MODEL],
            // Rows without stats are quarantined by the startup integrity scan.
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
        await page.goto('/room');
        await dismissWizard(page);

        // Agent select is the one offering the agent placeholder (the other
        // selects are theme/where/mode). Lazy chunk needs a minute on CI.
        const agentSelect = page.locator('main select', {
            has: page.locator('option', { hasText: 'Select an agent' }),
        });
        await expect(agentSelect).toBeVisible({ timeout: 60000 });
        await agentSelect.selectOption({ index: 1 });

        await page
            .getByPlaceholder('Describe the task for the agent…')
            .fill('e2e room task 9');
        await page.getByRole('button', { name: 'Invoke Agent', exact: true }).click();

        // The lifecycle list quotes the task text once the invocation lands.
        await expect(page.getByText('e2e room task 9').first()).toBeVisible({
            timeout: 120000,
        });
    });
});
