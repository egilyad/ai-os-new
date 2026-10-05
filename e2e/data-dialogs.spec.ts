import { test, expect } from '@playwright/test';
import { boot, dismissWizard } from './helpers';

// Dialogs demo seeds (chat/groupchat/council demo-seed modules): each panel
// header/sidebar has a ☕ button that seeds Russian demo content and opens it.
// All idempotent — repeated clicks reuse existing rows.

test.describe('AI-OS Data Dialogs', () => {
    test.describe.configure({ timeout: 300000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('demo chat seeds a completed exchange', async ({ page }) => {
        await page.goto('/chat');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo chat' }).click();

        await expect(page.getByText('Демо: вето агентов').first()).toBeVisible({
            timeout: 60000,
        });
        await expect(page.getByText(/перекрывает/).first()).toBeVisible({
            timeout: 60000,
        });
    });

    test('demo group chat seeds three turns', async ({ page }) => {
        await page.goto('/group-chat');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo chat' }).click();

        await expect(page.getByText('Демо: планёрка ☕').first()).toBeVisible({
            timeout: 60000,
        });
        await expect(page.getByText(/тихие часы/).first()).toBeVisible({
            timeout: 60000,
        });
    });

    test('demo council seeds messages and a fact', async ({ page }) => {
        await page.goto('/fleet-councils');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo council' }).click();

        await expect(page.getByText(/тихие часы для уведомлений/).first()).toBeVisible({
            timeout: 60000,
        });
        await expect(page.getByText(/только звонок человека/).first()).toBeVisible({
            timeout: 60000,
        });
    });
});
