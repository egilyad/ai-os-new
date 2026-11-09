import { test, expect } from '@playwright/test';
import { boot, dismissWizard } from './helpers';

// QW-5: basic a11y smoke without axe (no new deps): landmark exists,
// heading present, iframes carry titles, visible interactive controls are
// focusable by keyboard.

const PANELS = [
    { path: '/keys', heading: /Provider|Провайдеры|Keys/i },
    { path: '/chat', heading: /Chat|Чат/i },
    { path: '/settings', heading: /Setting|Настройки/i },
];

test.describe('AI-OS basic a11y', () => {
    test.describe.configure({ timeout: 300000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    for (const panel of PANELS) {
        test(`panel ${panel.path} exposes landmark, heading and titled iframes`, async ({ page }) => {
            await page.goto(panel.path);
            await dismissWizard(page);

            const main = page.locator('main');
            await expect(main).toBeVisible({ timeout: 30000 });
            await expect(main).toContainText(panel.heading);

            const headings = main.locator('h1, h2, h3');
            expect(await headings.count()).toBeGreaterThan(0);

            const iframes = page.locator('iframe');
            const count = await iframes.count();
            for (let i = 0; i < count; i++) {
                const title = await iframes.nth(i).getAttribute('title');
                expect(title, `iframe #${i} must have a title`).toBeTruthy();
            }
        });
    }

    test('keyboard focus can move through the sidebar', async ({ page }) => {
        const nav = page.locator('nav.sidebar-nav, .sidebar-nav');
        await expect(nav.first()).toBeVisible({ timeout: 30000 });
        await nav.first().locator('button').first().focus();
        await expect(nav.first().locator('button').first()).toBeFocused();
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => document.activeElement?.tagName ?? '');
        expect(focused).toBe('BUTTON');
    });
});
