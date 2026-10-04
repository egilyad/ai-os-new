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

export type GatewayPolicy = { allowed: true } | { allowed: false; reason: string };

function safeOrigin(url: string): string | undefined {
    try {
        return new URL(url).origin;
    } catch {
        return undefined;
    }
}

function isLoopback(hostname: string): boolean {
    const h = hostname.toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h.startsWith('127.');
}

/**
 * C-7: pure policy check for company-gateway requests, evaluated BEFORE any
 * fetch (and before the Authorization header is attached anywhere).
 *
 * - Non-http(s) schemes, embedded credentials: always blocked.
 * - Plaintext http: allowed only for loopback (local dev default). A Bearer
 *   secret must never cross a non-loopback network in the clear.
 * - Pinned origin (set when VITE_COMPANY_GATEWAY_URL is configured): any
 *   base with a different origin is refused entirely — even unauthenticated.
 *   This kills localStorage-swap exfiltration (XSS plants attacker URL, the
 *   real secret never leaves): the pin lives in build-time env, which page
 *   JS cannot rewrite, unlike localStorage.
 *
 * NOTE: without a pinned env (plain localhost dev) a swapped https URL is
 * still fetchable — full XSS game-over is fixed at the XSS layer (C-9), not
 * here. sessionStorage migration of the 7 panels' secrets stays open.
 */
export function resolveGatewayPolicy(base: string, pinnedOrigin?: string): GatewayPolicy {
    let parsed: URL;
    try {
        parsed = new URL(base);
    } catch {
        return { allowed: false, reason: 'invalid gateway url' };
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { allowed: false, reason: `scheme ${parsed.protocol} not allowed` };
    }
    if (parsed.username || parsed.password) {
        return { allowed: false, reason: 'credentials embedded in gateway url' };
    }
    if (parsed.protocol === 'http:' && !isLoopback(parsed.hostname)) {
        return { allowed: false, reason: 'plaintext http gateway blocked (non-loopback)' };
    }
    if (pinnedOrigin && parsed.origin !== pinnedOrigin) {
        return { allowed: false, reason: 'gateway origin not pinned' };
    }
    return { allowed: true };
}

export async function gatewayApi<T>(
    base: string,
    secret: string,
    p: string,
    init?: RequestInit,
): Promise<T> {
    const envUrl =
        typeof import.meta !== 'undefined'
            ? (import.meta.env?.VITE_COMPANY_GATEWAY_URL as string | undefined)
            : undefined;
    const policy = resolveGatewayPolicy(base, envUrl ? safeOrigin(envUrl) : undefined);
    if (!policy.allowed) {
        throw new Error(`Gateway blocked: ${policy.reason}`);
    }
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
