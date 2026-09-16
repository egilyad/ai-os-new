import type { ProbeResult } from './probe';

export type KeyStatus = 'ready' | 'limited' | 'broken' | 'degraded' | 'unknown';
export type LifecycleState = 'active' | 'probation' | 'degraded' | 'quarantined' | 'recovering';

export interface KeyProbeSnapshot {
    status: KeyStatus;
    latency: number;
    error?: string;
    errorCode?: number;
    timestamp: number;
}

export interface KeyHealthSnapshot {
    errorRate: number;
    successRate: number;
    consecutiveErrors: number;
    lastSuccessAt?: number;
}

export interface KeyQuotaSnapshot {
    usedTokens: number;
    limitTokens: number;
    usedRequests: number;
    limitRequests: number;
    resetAt?: number;
}

export interface KeyRoutingState {
    weight: number;
    blocked: boolean;
}

export const HEALTH_THRESHOLDS = {
    healthy: 75,
    warm: 50,
    degraded: 25,
    cooling: 10,
} as const;

export type HealthBand = 'healthy' | 'warm' | 'degraded' | 'cooling' | 'dead';

export function getHealthBand(score: number): HealthBand {
    if (score >= HEALTH_THRESHOLDS.healthy) return 'healthy';
    if (score >= HEALTH_THRESHOLDS.warm) return 'warm';
    if (score >= HEALTH_THRESHOLDS.degraded) return 'degraded';
    if (score >= HEALTH_THRESHOLDS.cooling) return 'cooling';
    return 'dead';
}

export const RECOVERY_RATE_PER_MIN = 5;

const KEY_STATUS_VALUES: KeyStatus[] = ['ready', 'limited', 'broken', 'degraded', 'unknown'];

export function toKeyStatus(input: string): KeyStatus {
    const s = input.toLowerCase().trim();
    if (KEY_STATUS_VALUES.includes(s as KeyStatus)) return s as KeyStatus;
    if (s === 'active' || s === 'checking') return 'ready';
    if (s === 'inactive' || s === 'pending') return 'unknown';
    if (s === 'quota_exhausted') return 'limited';
    if (s === 'quarantined' || s === 'probation') return 'degraded';
    if (s === 'error' || s === 'invalid' || s === 'duplicate' || s === 'compromised')
        return 'broken';
    return 'unknown';
}

export interface KeyState {
    id: string;
    status: KeyStatus;
    provider: string;
    label: string;
    model?: string;
    /** Per-model health from multi-model probe — 'ok' if model responded, 'failed' if it errored */
    modelHealth?: Record<string, 'ok' | 'failed'>;
    /** 0–100 health score derived from probe, errors, and passive recovery */
    healthScore: number;
    /** Timestamp when health was last >= 75 */
    lastHealthyAt?: number;
    /** Timestamp when health dropped below 75 */
    degradedSince?: number;
    lastProbe: KeyProbeSnapshot;
    health: KeyHealthSnapshot;
    quota: KeyQuotaSnapshot;
    routing: KeyRoutingState;
    flags: {
        circuitOpen: boolean;
        rateLimited: boolean;
        authFailed: boolean;
    };
    lifecycleState: LifecycleState;
    updatedAt: number;
}

export type KeyStateEvent = 'keystate:updated' | 'keystate:removed';

export interface IKeyStateStore {
    get(id: string): KeyState | undefined;
    getAll(): KeyState[];
    getReady(): KeyState[];
    getForRouting(): KeyState[];
    /** Filter availableModels to exclude models known to fail from last probe */
    getWorkingModels(keyId: string, availableModels: string[]): string[];
    update(id: string, patch: Partial<KeyState>): Promise<void>;
    remove(id: string): Promise<void>;
    ingestProbe(id: string, result: ProbeResult): void;
    on(cb: (event: { type: KeyStateEvent; id: string; state?: KeyState }) => void): () => void;
}
