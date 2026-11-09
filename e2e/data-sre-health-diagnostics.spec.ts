import { test, expect } from '@playwright/test';
import { boot, dismissWizard } from './helpers';

// QW-3: SRE / Health / Diagnostics panels render and expose their core
// surface (title/heading) after a full boot. Health-focused smoke — no
// service assertions beyond render (subjective panel internals are covered
// by unit tests).

test.describe('AI-OS SRE / Health / Diagnostics', () => {
    test.describe.configure({ timeout: 300000 });

    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('SRE panel renders', async ({ page }) => {
        await page.goto('/sre');
        await dismissWizard(page);
        await expect(page.locator('main')).toBeVisible({ timeout: 30000 });
        await expect(page.locator('main')).toContainText(/SRE|sre|Reliability/i);
    });

    test('Health hub renders', async ({ page }) => {
        await page.goto('/health');
        await dismissWizard(page);
        await expect(page.locator('main')).toBeVisible({ timeout: 30000 });
        await expect(page.locator('main')).toContainText(/Health|Здоровье/i);
    });

    test('Diagnostics panel renders', async ({ page }) => {
        await page.goto('/diagnostics');
        await dismissWizard(page);
        await expect(page.locator('main')).toBeVisible({ timeout: 30000 });
        await expect(page.locator('main')).toContainText(/Diagnostic|Диагностика/i);
    });
});
