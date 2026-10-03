import { test, expect } from '@playwright/test';
import { boot, dismissWizard } from './helpers';

// Route spine B (TS9-04): see routes-a-flow.spec.ts for the contract.

const ROUTES: Array<[string, string]> = [
    ['connectors', '/connectors'],
    ['settings', '/settings'],
    ['health', '/health'],
    ['logs', '/logs'],
    ['router-trace', '/router-trace'],
    ['analytics', '/analytics'],
    ['budget', '/budget'],
    ['groups', '/groups'],
    ['projects', '/projects'],
    ['tasks', '/tasks'],
    ['playground', '/playground'],
];

test.describe('AI-OS Route Spine B', () => {
    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    for (const [id, path] of ROUTES) {
        test(`route ${id} resolves to a panel`, async ({ page }) => {
            await page.goto(path);
            // App shell hydrated with content (lazy panel chunk may still
            // be loading — the fallback check below is sync-safe either way:
            // an unmapped route renders `Panel "x" not found` immediately).
            await expect(page.locator('#root')).not.toBeEmpty({ timeout: 60000 });
            await dismissWizard(page);

            // Dead-route marker from routes.tsx Panel() fallback.
            await expect(page.getByText(/Panel ".+?" not found/)).toHaveCount(0);

            // Real panel hydrated (shell + content), not a blank/error shell.
            await expect
                .poll(
                    async () =>
                        page.evaluate(() => document.body?.innerText.length ?? 0),
                    { timeout: 60000 },
                )
                .toBeGreaterThan(300);
        });
    }
});
