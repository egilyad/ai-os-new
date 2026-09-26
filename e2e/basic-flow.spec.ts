import { test, expect } from '@playwright/test';
import fs from 'node:fs';

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
            const msg = `PAGE-STATE [${testInfo.title}] url=${info.url} title=${info.title} h1=${JSON.stringify(info.h1s)} bodyLen=${info.bodyLen} rootChildren=${info.rootChildren} htmlLen=${info.htmlLen} res=${info.resCount} scripts=${JSON.stringify(info.scripts)}`;
            // console.log is unreliable here (reporter indents it, breaking
            // ::notice parsing) — write to a file, the CI step publishes it.
            fs.mkdirSync('test-results', { recursive: true });
            fs.appendFileSync('test-results/page-state.log', msg + '\n');
        } catch {
            /* page already closed */
        }
    }
});

test.describe('AI-OS Basic Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Cold boot on shared GH runners exceeds 60s (38MB bundle, Dexie
        // migrations + seed). Gate every test on the dashboard heading so
        // the app is fully hydrated before any test-specific assertion.
        await expect(page.getByRole('heading', { name: /mission control/i })).toBeVisible({
            timeout: 120000,
        });
        // Fresh browsers show an onboarding overlay whose backdrop absorbs
        // clicks meant for underlying buttons — dismiss it best-effort.
        const overlayBtn = page
            .getByRole('button', { name: /dismiss|onboarding skip|get started/i })
            .first();
        try {
            if (await overlayBtn.isVisible({ timeout: 5000 })) {
                await overlayBtn.click({ timeout: 5000 });
            }
        } catch {
            /* no overlay — proceed */
        }
    });

  test('should load dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /mission control/i })).toBeVisible({ timeout: 30000 });
  });

    test('should navigate to keys page and show providers', async ({ page }) => {
        // Dashboard "Add a new provider" navigates to the keys page
        // (onNavigate('keys')); the providers page has no "AI Providers"
        // text (that string exists only in unit-test mocks) — assert the
        // real "Add Custom Provider" action instead.
        await page.getByRole('button', { name: /add a new provider/i }).click({ force: true });
        await expect(page).toHaveURL(/keys/, { timeout: 30000 });
        await expect(page.getByRole('button', { name: /add custom provider/i })).toBeVisible({
            timeout: 30000,
        });
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
