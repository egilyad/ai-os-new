import { test, expect } from '@playwright/test';
import {
    boot,
    dismissWizard,
    idbPut,
    stubOpenRouter,
    STUB_MODEL,
    STUB_REPLY,
} from './helpers';

// Chat data-flow: send via stubbed /proxy/openrouter/* (SSE or JSON,
// inspected from the request body) and verify history survives reload.
// Chat auto-selects the first `active` key; `OpenRouter` falls back to
// `openai/gpt-4o` without discovery.

test.describe('AI-OS Data Chat', () => {
    // Boot + reload + reboot per test can exceed the 180s suite default.
    test.describe.configure({ timeout: 300000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
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
