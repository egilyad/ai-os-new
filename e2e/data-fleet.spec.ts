import { test, expect } from '@playwright/test';
import { boot, dismissWizard } from './helpers';

// Fleet demo seeds (crews/persona/interop/frontier demo-seed modules):
// each Fleet tab has a ☕ button that seeds Russian demo content via the
// real services (all offline-capable) and refreshes the tab stores.
// All idempotent — repeated clicks reuse existing rows.

test.describe('AI-OS Data Fleet', () => {
    test.describe.configure({ timeout: 300000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('demo crew seeds with roles and tasks', async ({ page }) => {
        await page.goto('/fleet-crews');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo' }).click();

        await expect(page.getByText('Демо: утренняя газета').first()).toBeVisible({
            timeout: 60000,
        });
    });

    test('demo context and goal seed into persona tab', async ({ page }) => {
        await page.goto('/fleet-persona');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo' }).click();

        await expect(page.getByText('Демо: кают-компания').first()).toBeVisible({
            timeout: 60000,
        });
        await expect(page.getByText('Демо: запустить бота-напоминалку').first()).toBeVisible({
            timeout: 60000,
        });
    });

    test('demo peer seeds into interop tab', async ({ page }) => {
        await page.goto('/fleet-interop');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo' }).click();

        await expect(page.getByText('Демо-стенд').first()).toBeVisible({
            timeout: 60000,
        });
    });

    test('demo benchmark seeds and runs on frontier tab', async ({ page }) => {
        await page.goto('/fleet-frontier');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo' }).click();

        // The tab lists runs (subject + score), not benchmarks: the seeded
        // single-case run scores full marks.
        await expect(page.getByText('10/10').first()).toBeVisible({
            timeout: 120000,
        });
    });
});
