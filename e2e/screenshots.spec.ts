import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { boot, dismissWizard, idbPut, stubOpenRouter, STUB_MODEL } from './helpers';

// Demo screenshots for docs/demos/ (Этап C). Produces real panel captures
// with the automated Playwright flow — never hand-drawn mockups.
//
// Run: npm run gen:demos   (requires `npm run build` first: preview serves dist/)
// Output: docs/demos/img/<name>.png  (committed; refresh + review manually)
//
// One test captures all five panels: a single cold boot + reload warm-up
// (each panel would otherwise pay a full boot every time — far too slow).
// Not part of the e2e CI matrix: PNG bytes differ across runner images, so
// these are reviewed artifacts, not a gated diff.

const OUT = path.resolve('docs/demos/img');

const PANELS: Array<[name: string, route: string]> = [
    ['chat', '/chat'],
    ['debate', '/debate'],
    ['providers', '/keys'],
    ['memory', '/memory'],
    ['diagnostics', '/diagnostics'],
];

test.use({ viewport: { width: 1440, height: 900 } });

async function waitForPanel(page: Page) {
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 60000 });
    await expect(page.getByText(/Panel ".+?" not found/)).toHaveCount(0);
    await expect
        .poll(async () => page.evaluate(() => document.body?.innerText.length ?? 0), { timeout: 60000 })
        .toBeGreaterThan(300);
}

test.describe('AI-OS demo screenshots', () => {
    test.describe.configure({ timeout: 600000, retries: 0 });

    test('capture all demo panels', async ({ page }) => {
        mkdirSync(OUT, { recursive: true });
        await boot(page);
        await idbPut(page, 'apiKeys', {
            id: 'demo-openrouter',
            provider: 'OpenRouter',
            key: 'sk-or-demo-placeholder',
            label: 'demo',
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

        for (const [name, route] of PANELS) {
            await page.goto(route);
            await dismissWizard(page);
            await waitForPanel(page);
            await page.screenshot({
                path: path.join(OUT, `${name}.png`),
                animations: 'disabled',
                fullPage: false,
            });
        }
    });
});
