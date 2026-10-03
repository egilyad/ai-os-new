import { test, expect } from '@playwright/test';
import { boot, dismissWizard } from './helpers';

// Route spine A (TS9-04): one E2E per important user route. Each test proves
// the route resolves to a real panel: no `Panel "x" not found` fallback
// (routes.tsx), non-empty render after lazy hydration. Paths and component
// mappings verified against src/routes.tsx + src/route-imports.ts.

const ROUTES: Array<[string, string]> = [
    ['debate', '/debate'],
    ['debate-live', '/debate-live'],
    ['debate-history', '/debate-history'],
    ['debate-templates', '/debate-templates'],
    ['debates-manager', '/debates-manager'],
    ['roles', '/roles'],
    ['skills', '/skills'],
    ['memory', '/memory'],
    ['knowledge', '/knowledge'],
    ['tools', '/tools'],
    ['mcp', '/mcp'],
];

test.describe('AI-OS Route Spine A', () => {
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
