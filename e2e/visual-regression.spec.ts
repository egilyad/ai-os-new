import { test, expect, type Page } from '@playwright/test';
import { boot, dismissWizard } from './helpers';

// QW-4: visual regression for key panels. Playwright stores baselines next
// to the spec on first run; later runs diff against them (maxDiffPixelRatio
// 2% tolerates minor font/AA drift). Run locally or on a fixed runner image;
// on shared runners compare carefully or use the manual demo screenshots.

const PANELS: Array<[name: string, route: string]> = [
    ['chat', '/chat'],
    ['providers', '/keys'],
    ['health', '/health'],
    ['diagnostics', '/diagnostics'],
    ['settings', '/settings'],
];

test.use({ viewport: { width: 1440, height: 900 } });

async function waitForPanel(page: Page) {
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 60000 });
    await expect(page.getByText(/Panel ".+?" not found/)).toHaveCount(0);
    await expect
        .poll(async () => page.evaluate(() => document.body?.innerText.length ?? 0), { timeout: 60000 })
        .toBeGreaterThan(200);
}

test.describe('AI-OS visual regression (QW-4)', () => {
    test.describe.configure({ timeout: 600000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    for (const [name, route] of PANELS) {
        test(`${name} matches baseline`, async ({ page }) => {
            await page.goto(route);
            await dismissWizard(page);
            await waitForPanel(page);
            await expect(page).toHaveScreenshot(`panels/${name}.png`, {
                animations: 'disabled',
                maxDiffPixelRatio: 0.02,
            });
        });
    }
});
