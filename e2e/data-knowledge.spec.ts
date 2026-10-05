import { test, expect } from '@playwright/test';
import { boot, dismissWizard } from './helpers';

// Knowledge demo seeds (memory/crystals/bookmarks/sop demo-seed modules):
// each panel header has a ☕ button that seeds Russian demo content.
// All idempotent — repeated clicks reuse existing rows. (SOP definitions
// are in-memory only, so the SOP demo re-seeds per session.)

test.describe('AI-OS Data Knowledge', () => {
    test.describe.configure({ timeout: 300000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('demo memories seed into the explorer', async ({ page }) => {
        await page.goto('/memory');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo memories' }).click();

        await expect(page.getByText(/вето агентов работает только/).first()).toBeVisible({
            timeout: 60000,
        });
    });

    test('demo crystal seeds into the vault', async ({ page }) => {
        await page.goto('/crystals');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo crystal' }).click();

        await expect(page.getByText(/тихие часы 23:00/).first()).toBeVisible({
            timeout: 60000,
        });
    });

    test('demo bookmark seeds from the demo chat', async ({ page }) => {
        await page.goto('/bookmarks');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo bookmark' }).click();

        await expect(page.getByText('Демо: лучший ответ про вето').first()).toBeVisible({
            timeout: 60000,
        });
    });

    test('demo SOP seeds into the definitions', async ({ page }) => {
        await page.goto('/sop');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo SOP' }).click();

        await expect(page.getByText('Демо: утренний дайджест').first()).toBeVisible({
            timeout: 60000,
        });
    });
});
