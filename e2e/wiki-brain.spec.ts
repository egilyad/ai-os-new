import { expect, test } from '@playwright/test';
import { boot } from './helpers';

test.describe('wiki brain', () => {
    test('queues a source through the panel', async ({ page }) => {
        await boot(page);
        await page.goto('/wiki-brain');

        await expect(page.getByRole('heading', { name: /wiki brain/i })).toBeVisible({
            timeout: 60000,
        });

        const title = 'E2E Wiki Source';
        await page.getByPlaceholder('Title').fill(title);
        await page.getByPlaceholder(/paste markdown content/i).fill('# E2E\nСодержимое про память.');
        await page.getByRole('button', { name: /queue for ingest/i }).click();

        await expect(page.getByText(`Queued "${title}" for ingest`)).toBeVisible({
            timeout: 30000,
        });

        await expect(page.getByText('Ingest queue')).toBeVisible();
        await expect(page.locator('li').filter({ hasText: 'pending' }).first()).toBeVisible({
            timeout: 15000,
        });
    });
});
