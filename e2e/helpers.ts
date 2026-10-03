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
    await dismissOverlay(page);
}

/** Fresh browsers show an onboarding overlay whose backdrop absorbs clicks. */
export async function dismissOverlay(page: Page) {
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
}

/** Raw IndexedDB put into the app's Dexie database (no app code involved). */
export async function idbPut(
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
