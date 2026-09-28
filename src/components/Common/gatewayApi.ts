/**
 * Shared company-gateway fetch used by the gateway panels
 * (Companies/Adapters/Costs/Runs/Portability/Issues/Approvals).
 *
 * Replaces 7 copy-pasted local helpers that had no timeout — a dead
 * gateway hung the UI forever. Aborts after GATEWAY_TIMEOUT_MS unless
 * the caller passes its own signal.
 */
export const GATEWAY_TIMEOUT_MS = 10000;

/**
 * Default gateway origin. Override per-deployment with
 * VITE_COMPANY_GATEWAY_URL (e.g. Docker/prod) instead of patching code —
 * localhost is only the local-dev default.
 */
export const DEFAULT_GATEWAY_URL =
    (typeof import.meta !== 'undefined' &&
        (import.meta.env?.VITE_COMPANY_GATEWAY_URL as string | undefined)) ||
    'http://localhost:3001';

export async function gatewayApi<T>(
    base: string,
    secret: string,
    p: string,
    init?: RequestInit,
): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) headers['Authorization'] = `Bearer ${secret}`;
    const r = await fetch(base + p, {
        ...init,
        signal: init?.signal ?? AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
        headers: { ...headers, ...(init?.headers || {}) },
    });
    const body = (await r.json().catch(() => ({}))) as unknown;
    if (!r.ok) {
        const msg = (body as { error?: string }).error || `HTTP ${r.status}`;
        const err = new Error(msg) as Error & { status?: number; body?: unknown };
        err.status = r.status;
        err.body = body;
        throw err;
    }
    return body as T;
}
