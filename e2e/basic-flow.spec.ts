import { test, expect } from '@playwright/test';

test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
        try {
            const info = await page.evaluate(() => {
                const h1s = Array.from(document.querySelectorAll('h1')).map((h) =>
                    (h.textContent || '').trim().slice(0, 60),
                );
                const htmlLen = document.documentElement ? document.documentElement.outerHTML.length : -1;
                let resCount = -1;
                try {
                    resCount = performance.getEntriesByType('resource').length;
                } catch {
                    /* ignore */
                }
                const scripts = Array.from(document.scripts).map((s) => s.src.slice(-40));
                return {
                    url: location.href,
                    title: document.title,
                    h1s,
                    bodyLen: document.body ? document.body.innerText.length : -1,
                    rootChildren: document.getElementById('root')?.children.length ?? -1,
                    htmlLen,
                    resCount,
                    scripts,
                };
            });
            const msg = `PAGE-STATE url=${info.url} title=${info.title} h1=${JSON.stringify(info.h1s)} bodyLen=${info.bodyLen} rootChildren=${info.rootChildren} htmlLen=${info.htmlLen} res=${info.resCount} scripts=${JSON.stringify(info.scripts)}`;
            console.log('::notice title=e2e-page-state::' + msg.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A'));
        } catch {
            /* page already closed */
        }
    }
});

test.describe('AI-OS Basic Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /mission control/i })).toBeVisible({ timeout: 30000 });
  });

  test('should navigate to keys page and show providers', async ({ page }) => {
    await page.getByRole('button', { name: /add a new provider/i }).click({ force: true });
    await expect(page.getByText('AI Providers')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to agents page', async ({ page }) => {
    await page.goto('/agents');
    await expect(page.getByText(/agent|builder/i).first()).toBeVisible({ timeout: 20000 });
  });

  test('should open chat panel', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.getByRole('textbox').first()).toBeVisible({ timeout: 20000 });
  });
});
