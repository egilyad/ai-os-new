import { expect, type Page, type Route } from '@playwright/test';

// Shared e2e helpers: boot gate, IndexedDB seeding, OpenRouter stubs.
// NOTE: this file must not match *.spec.ts, otherwise Playwright runs it.

// Dexie DB `super_agents_os_v4` (see src/kernel/services/dexie-schema.ts).
const DB_NAME = 'super_agents_os_v4';

export const STUB_MODEL = 'openai/gpt-4o';
export const STUB_REPLY = 'E2E-STUB-REPLY-42';

/** Full cold-boot gate: dashboard heading means hydration is complete. */
export async function boot(page: Page) {
    await page.goto('/');
    // Cold boot on shared GH runners exceeds 60s (38MB bundle, Dexie
    // migrations + seed). Gate every test on the dashboard heading so
    // the app is fully hydrated before any test-specific assertion.
    await expect(page.getByRole('heading', { name: /mission control/i })).toBeVisible({
        timeout: 120000,
    });
    await dismissWizard(page);
}

/**
 * Close the onboarding wizard if open. Scoped to the wizard dialog:
 * a bare /dismiss/i selector can hit unrelated Dismiss buttons
 * (toasts, banners) while the wizard backdrop keeps covering the page.
 * The wizard can pop up AFTER hydration (post-keystore-load), so call
 * this right before any click, not just after boot.
 */
export async function dismissWizard(page: Page) {
    for (let i = 0; i < 3; i++) {
        const skip = page
            .getByRole('dialog')
            .getByRole('button', { name: /onboarding skip/i });
        let visible = false;
        try {
            visible = await skip.isVisible({ timeout: 3000 });
        } catch {
            return;
        }
        if (!visible) return;
        try {
            await skip.click({ timeout: 10000 });
        } catch {
            /* animation race — re-check below */
        }
        try {
            await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 10000 });
            return;
        } catch {
            /* still open — retry */
        }
    }
}

/** Legacy best-effort overlay dismiss (kept for compatibility). */
export async function dismissOverlay(page: Page) {
    await dismissWizard(page);
}

/** Raw IndexedDB put into the app's Dexie database (no app code involved). */
export async function idbPut(
    page: Page,
    store: 'apiKeys' | 'sessions',
    row: Record<string, unknown>,
): Promise<number> {
    // The SPA can navigate under us (deep-link handling, redirects) right
    // after boot, killing the execution context. Retry with a re-gate.
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            return await idbPutOnce(page, store, row);
        } catch (e) {
            lastError = e;
            if (!/destroyed|navigation|crashed|closed/i.test(String(e))) throw e;
            try {
                await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
                await expect(
                    page.getByRole('heading', { name: /mission control/i }),
                ).toBeVisible({ timeout: 60000 });
            } catch {
                /* re-gate failed — retry will surface it */
            }
        }
    }
    throw lastError;
}

async function idbPutOnce(
    page: Page,
    store: 'apiKeys' | 'sessions',
    row: Record<string, unknown>,
): Promise<number> {
    return page.evaluate(
        ({ dbName, store, row }) =>
            new Promise<number>((resolve, reject) => {
                const req = indexedDB.open(dbName);
                req.onerror = () => reject(req.error);
                req.onsuccess = () => {
                    const db = req.result;
                    if (!db.objectStoreNames.contains(store)) {
                        reject(new Error(`store ${store} missing`));
                        return;
                    }
                    const tx = db.transaction(store, 'readwrite');
                    tx.oncomplete = () => {
                        const count = tx.objectStore(store).count();
                        count.onsuccess = () => resolve(count.result as number);
                        count.onerror = () => reject(count.error);
                    };
                    tx.onerror = () => reject(tx.error);
                    tx.objectStore(store).put(row as never);
                };
            }),
        { dbName: DB_NAME, store, row },
    );
}

function stubModels(route: Route) {
    return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: STUB_MODEL }] }),
    });
}

async function stubCompletions(route: Route) {
    const body = route.request().postDataJSON() as { stream?: boolean } | null;
    if (body?.stream) {
        const sse = [
            `data: {"choices":[{"delta":{"content":"${STUB_REPLY}"},"finish_reason":null}]}`,
            'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}',
            'data: [DONE]',
            '',
            '',
        ].join('\n');
        return route.fulfill({
            status: 200,
            contentType: 'text/event-stream',
            body: sse,
        });
    }
    return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
            id: 'chatcmpl-e2e',
            choices: [
                {
                    index: 0,
                    message: { role: 'assistant', content: STUB_REPLY },
                    finish_reason: 'stop',
                },
            ],
            usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
        }),
    });
}

/**
 * Stub the same-origin /proxy/openrouter/* layer (see OpenRouterAdapter:
 * baseURL `/proxy/openrouter/api/v1`). No egress, no real keys needed.
 */
export async function stubOpenRouter(page: Page) {
    await page.route('**/proxy/openrouter/api/v1/models', (r) => stubModels(r));
    await page.route('**/proxy/openrouter/api/v1/chat/completions', (r) => stubCompletions(r));
}
