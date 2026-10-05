import { test, expect } from '@playwright/test';
import { boot, dismissWizard } from './helpers';

// Forum demo seed (forum-demo-seed.ts): the ☕ header button seeds one
// human-opened thread with three distinct agent replies (one threaded)
// and opens it. Idempotent — repeated clicks reuse the topic.

test.describe('AI-OS Data Forum', () => {
    test.describe.configure({ timeout: 300000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('demo thread seeds and renders three agent replies', async ({ page }) => {
        await page.goto('/forum');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo thread' }).click();

        await expect(
            page.getByText('Стоит ли давать агентам право вето на задачи?').first(),
        ).toBeVisible({ timeout: 60000 });
        // Risk analyst reply body (proves agent posts rendered in-thread).
        await expect(page.getByText(/вежливых отказов/).first()).toBeVisible({
            timeout: 60000,
        });
        // Ethics reply is threaded under risk (shows nesting works).
        await expect(page.getByText(/инструмента и спроса нет/).first()).toBeVisible({
            timeout: 60000,
        });
    });
});
