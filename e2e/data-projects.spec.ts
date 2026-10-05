import { test, expect } from '@playwright/test';
import { boot, dismissWizard } from './helpers';

// Projects demo seed (project-demo-seed.ts): the ☕ header button seeds one
// automation project built by three agents (assignments, tasks in three
// states, README, memory note) and selects it. Idempotent.

test.describe('AI-OS Data Projects', () => {
    test.describe.configure({ timeout: 300000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('demo project seeds and opens with files', async ({ page }) => {
        await page.goto('/projects');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo project' }).click();

        // Project appears in the list...
        await expect(page.getByText('Демо: бот-напоминалка ☕').first()).toBeVisible({
            timeout: 60000,
        });
        // ...and the detail view opens on the files tab with the README.
        await expect(page.getByText('README.md').first()).toBeVisible({
            timeout: 60000,
        });
    });
});
