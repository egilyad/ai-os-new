import { test, expect } from '@playwright/test';

test.describe('AI-OS Basic Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load dashboard', async ({ page }) => {
    await expect(page.getByText('Mission Control')).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to keys page and show providers', async ({ page }) => {
    await page.getByRole('button', { name: /add new provider key/i }).click();
    await expect(page.getByText('AI Providers')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to agents page', async ({ page }) => {
    await page.goto('/agents');
    await expect(page.getByText(/agent|builder/i)).toBeVisible({ timeout: 10000 });
  });

  test('should open chat panel', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.getByRole('textbox', { name: /type your message/i })).toBeVisible({ timeout: 10000 });
  });
});
