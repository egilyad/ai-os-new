import { test, expect } from '@playwright/test';
import { boot, dismissWizard } from './helpers';

// Research demo seeds (generator/synthesis/junction demo-seed modules):
// each panel header has a ☕ button that runs/seeds a real local pipeline
// (all heuristics, no LLM) and shows the result. All idempotent.
// (The Knowledge graph panel is fed by the memory demo seed — same store.)

test.describe('AI-OS Data Research', () => {
    test.describe.configure({ timeout: 300000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('demo generation runs the pipeline to a job', async ({ page }) => {
        await page.goto('/knowledge-generator');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo generation' }).click();

        await expect(page.getByText('Демо: тихие часы снижают отток').first()).toBeVisible({
            timeout: 120000,
        });
    });

    test('demo synthesis renders question and statement', async ({ page }) => {
        await page.goto('/synthesis');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo synthesis' }).click();

        await expect(page.getByText('Демо: нужны ли агентам тихие часы?').first()).toBeVisible({
            timeout: 120000,
        });
    });

    test('demo junction links crystal and forum', async ({ page }) => {
        await page.goto('/junctions');
        await dismissWizard(page);

        await page.getByRole('button', { name: 'Load demo junction' }).click();

        await expect(page.getByText(/ограничитель с апелляцией/).first()).toBeVisible({
            timeout: 60000,
        });
    });
});
