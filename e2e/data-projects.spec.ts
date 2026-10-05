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
        // ...and the detail view opens on the files tab with the files.
        await expect(page.getByText('README.md').first()).toBeVisible({
            timeout: 60000,
        });
        await expect(page.getByText('index.html').first()).toBeVisible({
            timeout: 60000,
        });

        // QA tab inspects the seeded landing: headings, viewport, charset,
        // title, description, alt texts and anchors are all compliant.
        await page.getByRole('button', { name: 'QA', exact: true }).click();
        await page.getByRole('button', { name: 'Refresh', exact: true }).click();
        await expect(page.getByText('100%').first()).toBeVisible({
            timeout: 60000,
        });
        await expect(page.getByText('Passed', { exact: true }).first()).toBeVisible({
            timeout: 60000,
        });
    });
});
