import { test, expect } from '@playwright/test';
import { boot, dismissWizard } from './helpers';

// Organizer demo seeds (tasks/scheduler/prompts demo-seed modules): each
// panel header has a ☕ button that seeds Russian demo content and refreshes
// the list. All idempotent — repeated clicks reuse existing rows.

test.describe('AI-OS Data Organizer', () => {
    test.describe.configure({ timeout: 300000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('demo tasks seed onto the kanban board', async ({ page }) => {
        await page.goto('/tasks');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo tasks' }).click();

        await expect(page.getByText('Демо: собрать утренний дайджест').first()).toBeVisible({
            timeout: 60000,
        });
        await expect(page.getByText('Демо: проверить риски релиза').first()).toBeVisible({
            timeout: 60000,
        });
        await expect(page.getByText('Демо: этическая экспертиза дайджеста').first()).toBeVisible(
            {
                timeout: 60000,
            },
        );
    });

    test('demo schedules seed into the list', async ({ page }) => {
        await page.goto('/scheduler');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo schedules' }).click();

        await expect(page.getByText('Демо: утренний дайджест').first()).toBeVisible({
            timeout: 60000,
        });
        await expect(page.getByText('Демо: пятничный отчёт').first()).toBeVisible({
            timeout: 60000,
        });
    });

    test('demo prompts seed into the library', async ({ page }) => {
        await page.goto('/prompts');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo prompts' }).click();

        await expect(page.getByText('Демо: вежливый отказ').first()).toBeVisible({
            timeout: 60000,
        });
        await expect(page.getByText('Демо: утренний дайджест').first()).toBeVisible({
            timeout: 60000,
        });
    });
});
