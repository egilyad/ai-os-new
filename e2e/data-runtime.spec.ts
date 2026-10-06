import { test, expect } from '@playwright/test';
import { boot, dismissWizard } from './helpers';

// Runtime demo seeds (director/rooms/dyad/runqueue/workflows/autonomy/
// channels demo-seed modules): each panel header has a ☕ button that seeds
// Russian demo content through the real services (all offline-capable) and
// shows it. All idempotent — repeated clicks reuse existing rows.
// (SOP definitions and channel data are in-memory by design.)

test.describe('AI-OS Data Runtime', () => {
    test.describe.configure({ timeout: 300000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('demo scenario seeds into the director library', async ({ page }) => {
        await page.goto('/director');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo scenario' }).click();

        await expect(page.getByText('Демо: планёрка по боту-напоминалке').first()).toBeVisible({
            timeout: 60000,
        });
    });

    test('demo invocation seeds into the room list', async ({ page }) => {
        await page.goto('/room');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo invocation' }).click();

        await expect(page.getByText('Демо: проверить риски релиза').first()).toBeVisible({
            timeout: 60000,
        });
    });

    test('demo dyad seeds a completed loop', async ({ page }) => {
        await page.goto('/dyad');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo dyad' }).click();

        await expect(page.getByText('Демо: согласовать тихие часы').first()).toBeVisible({
            timeout: 60000,
        });
    });

    test('demo queue item seeds into the run queue', async ({ page }) => {
        await page.goto('/run-queue');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo queue item' }).click();

        await expect(page.getByText('demo-morning-paper').first()).toBeVisible({
            timeout: 60000,
        });
    });

    test('demo workflow seeds into the list', async ({ page }) => {
        await page.goto('/workflows');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo workflow' }).click();

        await expect(page.getByText('Демо: утренний дайджест').first()).toBeVisible({
            timeout: 60000,
        });
    });

    test('demo autonomy loop seeds into the list', async ({ page }) => {
        await page.goto('/autonomy');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo loop' }).click();

        await expect(page.getByText('Демо: навести порядок в напоминаниях').first()).toBeVisible({
            timeout: 60000,
        });
    });

    test('demo channel seeds with three messages', async ({ page }) => {
        await page.goto('/channels');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo channel' }).click();

        await expect(page.getByText('Демо: курилка ☕').first()).toBeVisible({
            timeout: 60000,
        });
        await expect(page.getByText(/лимит три напоминания/).first()).toBeVisible({
            timeout: 60000,
        });
    });
});
