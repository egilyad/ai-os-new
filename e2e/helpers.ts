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
 * Close the onboarding wizard if open. Matched by its exact button text
 * WITHOUT a dialog scope: the wizard backdrop has no role=dialog, so a
 * scoped lookup never finds it while its overlay keeps covering the page
 * (every click then dies with "intercepts pointer events"). The phrase is
 * unique to the wizard, so an unscoped match is safe.
 */
export async function dismissWizard(page: Page) {
    for (let i = 0; i < 3; i++) {
        const skip = page.getByRole('button', { name: /onboarding skip/i });
        let visible = false;
        try {
            visible = await skip.first().isVisible({ timeout: 3000 });
        } catch {
            return;
        }
        if (!visible) return;
        try {
            await skip.first().click({ timeout: 10000 });
        } catch {
            /* animation race — re-check below */
        }
        try {
            await skip.waitFor({ state: 'hidden', timeout: 10000 });
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

/**
 * Raw IndexedDB put into the app's Dexie database (no app code involved).
 *
 * Done from a sidecar page (same origin, static asset, no SPA) instead of
 * the app page: right after boot the SPA commits same-document history
 * navigations (router settling), and `page.evaluate` on the app page
 * chronically loses that race on CI ("execution context was destroyed").
 * The sidecar document never navigates, so its context is stable.
 */
export async function idbPut(
    page: Page,
    store: 'apiKeys' | 'sessions' | 'debateSessions',
    row: Record<string, unknown>,
): Promise<number> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
        const sidecar = await page.context().newPage();
        try {
            console.log(`DIAG idbPut newPage ok mainUrl=${page.url()}`);
            await sidecar.goto('/favicon.svg');
            console.log(`DIAG idbPut goto ok sidecarUrl=${sidecar.url()}`);
            return await sidecar.evaluate(
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
                            try {
                                const tx = db.transaction(store, 'readwrite');
                                const os = tx.objectStore(store);
                                os.put(row as never);
                                // Count inside the SAME transaction: issuing a
                                // request in oncomplete throws (inactive tx)
                                // and leaves the promise hanging forever.
                                const countReq = os.count();
                                countReq.onsuccess = () =>
                                    resolve(countReq.result as number);
                                countReq.onerror = () => reject(countReq.error);
                                tx.onerror = () => reject(tx.error);
                                tx.onabort = () => reject(tx.error);
                            } catch (e) {
                                reject(e);
                            }
                        };
                    }),
                { dbName: DB_NAME, store, row },
            );
        } catch (e) {
            lastError = e;
            console.log(
                `DIAG idbPut attempt ${attempt} failed url=${sidecar.url()} err=${String(e).split('\n')[0]}`,
            );
        } finally {
            await sidecar.close().catch(() => {});
        }
    }
    throw lastError;
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
    console.log(`STUB-HIT completions stream=${body?.stream} url=${route.request().url()}`);
    if (body?.stream) {
        // Minimal single-event SSE: one delta chunk, then DONE. (A second
        // content-bearing event before DONE confused the app's accumulator
        // handling in e2e and produced empty replies.)
        const sse = [
            `data: {"choices":[{"delta":{"content":"SSE-PATH-42"}}]}`,
            '',
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
                    message: { role: 'assistant', content: 'JSON-PATH-42' },
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
