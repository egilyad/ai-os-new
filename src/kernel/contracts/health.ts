/**
 * Canonical system-level health status. Single source of truth.
 * Used across all observability contracts, state, events, and services.
 */
export type CanonicalHealthStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

/**
 * Map binary check results (active/error) to CanonicalHealthStatus.
 */
export function checkToHealth(ok: boolean): CanonicalHealthStatus {
    return ok ? 'healthy' : 'critical';
}

export function normalizeHealthStatus(
    status: string | boolean | null | undefined,
): CanonicalHealthStatus {
    if (typeof status === 'boolean') return checkToHealth(status);
    const value = String(status ?? '').toLowerCase();
    if (value === 'unknown') return 'unknown';
    if (
        value === 'healthy' ||
        value === 'active' ||
        value === 'online' ||
        value === 'ok' ||
        value === 'ready'
    ) {
        return 'healthy';
    }
    if (
        value === 'degraded' ||
        value === 'unstable' ||
        value === 'warning' ||
        value === 'checking'
    ) {
        return 'degraded';
    }
    return 'critical';
}
