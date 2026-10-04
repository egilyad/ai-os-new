import { test, expect } from '@playwright/test';
import {
    boot,
    dismissWizard,
    idbPut,
    stubOpenRouter,
    STUB_MODEL,
} from './helpers';

// Chat data-flow: send via stubbed /proxy/openrouter/* (SSE or JSON,
// inspected from the request body), verify the reply renders, and verify
// history survives reload (covers the persist path fixed alongside the
// version-guard defect).
// Chat auto-selects the first `active` key; `OpenRouter` falls back to
// `openai/gpt-4o` without discovery.

test.describe('AI-OS Data Chat', () => {
    // Boot + reload + reboot per test can exceed the 180s suite default.
    test.describe.configure({ timeout: 300000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('chat send via mocked provider persists history', async ({ page }) => {        await idbPut(page, 'apiKeys', {
            id: 'e2e-or-chat',
            provider: 'OpenRouter',
            key: 'sk-or-e2e-test-key-003',
            label: 'e2e-chat-key',
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

        // Either transport marker proves the mocked provider reply rendered
        // (SSE-PATH-42 via streaming, JSON-PATH-42 via plain JSON).
        await expect(page.getByText(/-PATH-42/).first()).toBeVisible({ timeout: 60000 });

        await page.reload();
        await boot(page);
        await page.goto('/chat');
        await dismissWizard(page);
        await expect(page.getByText('e2e ping 42').first()).toBeVisible({
            timeout: 30000,
        });
    });
});
