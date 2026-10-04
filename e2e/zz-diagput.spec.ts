import { test, expect } from '@playwright/test';
import { boot, dismissWizard, idbPut, stubOpenRouter, STUB_MODEL } from './helpers';

test.describe('zz-diag-put', () => {
    test('watch sessions.put calls', async ({ page }) => {
        await boot(page);
        await idbPut(page, 'apiKeys', {
            id: 'e2e-or-chat',
            provider: 'OpenRouter',
            key: 'sk-or-e2e-test-key-003',
            label: 'e2e-chat-key',
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
        await stubOpenRouter(page);
        await page.reload();
        await boot(page);
        page.on('console', (m) => {
            const t = m.text();
            if (/diag|put|PUT|persist|save/i.test(t)) {
                console.log('CAP:', m.type(), t.slice(0, 220));
            }
        });
        await page.goto('/chat');
        await dismissWizard(page);
        const box = page.getByPlaceholder('Type a message...');
        await expect(box).toBeEnabled({ timeout: 30000 });
        await box.fill('e2e ping 42');
        await page.getByRole('button', { name: 'Send', exact: true }).click();
        await page.waitForTimeout(40000);
    });
});
