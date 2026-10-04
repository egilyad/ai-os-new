import { test, expect } from '@playwright/test';
import { boot, dismissWizard, idbPut, stubOpenRouter, STUB_MODEL } from './helpers';

test.describe('zz-persist-watch', () => {
    test('watch sessions rows second by second after send', async ({ page }) => {
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
        await page.goto('/chat');
        await dismissWizard(page);
        const box = page.getByPlaceholder('Type a message...');
        await expect(box).toBeEnabled({ timeout: 30000 });
        await box.fill('e2e ping 42');
        await page.getByRole('button', { name: 'Send', exact: true }).click();
        for (let i = 0; i < 30; i++) {
            await page.waitForTimeout(1000);
            const snap = await page
                .evaluate(
                    () =>
                        new Promise((resolve) => {
                            try {
                                const req = indexedDB.open('super_agents_os_v4');
                                req.onsuccess = () => {
                                    try {
                                        const db = req.result;
                                        const tx = db.transaction('sessions', 'readonly');
                                        const all = tx.objectStore('sessions').getAll();
                                        all.onsuccess = () =>
                                            resolve(
                                                (all.result as Array<Record<string, unknown>>).map(
                                                    (s) => ({
                                                        h: Array.isArray(s.history)
                                                            ? s.history.length
                                                            : -1,
                                                        u: s.updatedAt,
                                                        v: (s as Record<string, unknown>).version,
                                                    }),
                                                ),
                                            );
                                        all.onerror = () => resolve('READ-ERR');
                                    } catch {
                                        resolve('TX-ERR');
                                    }
                                };
                                req.onerror = () => resolve('OPEN-ERR');
                            } catch {
                                resolve('OUTER-ERR');
                            }
                        }),
                )
                .catch((e) => 'EVAL-ERR:' + String(e).split('\n')[0]);
            console.log(`WATCH t+${i + 1}s:`, JSON.stringify(snap));
        }
    });
});
