import { EVENT_REGISTRY, type EventMap } from './event-registry';

export const ProviderEvents = {
    KEYS_LOADED: EVENT_REGISTRY.KEYS_LOADED.name,
    KEY_ADDED: EVENT_REGISTRY.KEY_ADDED.name,
    KEY_REMOVED: EVENT_REGISTRY.KEY_REMOVED.name,
    KEY_UPDATED: EVENT_REGISTRY.KEY_UPDATED.name,
    KEY_STATE_CHANGED: EVENT_REGISTRY.KEY_STATE_CHANGED.name,
    KEY_COMPROMISED: EVENT_REGISTRY.KEY_COMPROMISED.name,
    KEY_HEALTH_CHECK_STARTED: EVENT_REGISTRY.KEY_HEALTH_CHECK_STARTED.name,
    KEY_HEALTH_CHECK_COMPLETED: EVENT_REGISTRY.KEY_HEALTH_CHECK_COMPLETED.name,
    KEY_HEALTH_CHECK_FAILED: EVENT_REGISTRY.KEY_HEALTH_CHECK_FAILED.name,
    KEY_LATENCY_BURST: EVENT_REGISTRY.KEY_LATENCY_BURST.name,
    KEY_QUOTA_EXCEEDED: EVENT_REGISTRY.KEY_QUOTA_EXCEEDED.name,
    KEY_REPUTATION_THRESHOLD_CROSSED: EVENT_REGISTRY.KEY_REPUTATION_THRESHOLD_CROSSED.name,
    COMPROMISE_SIGNAL: EVENT_REGISTRY.COMPROMISE_SIGNAL.name,
    GROUP_SYNC: EVENT_REGISTRY.GROUP_SYNC.name,
    CHECK_HEALTH: EVENT_REGISTRY.CHECK_HEALTH.name,
    CHECK_ALL_HEALTH: EVENT_REGISTRY.CHECK_ALL_HEALTH.name,
    KEY_PROBE_RESULT: EVENT_REGISTRY.KEY_PROBE_RESULT.name,
    PROVIDER_STATE_CHANGED: EVENT_REGISTRY.PROVIDER_STATE_CHANGED.name,
    PROVIDER_CIRCUIT_BREAKER_SYNCED: EVENT_REGISTRY.PROVIDER_CIRCUIT_BREAKER_SYNCED.name,
    PROVIDER_RATE_LIMIT_SYNCED: EVENT_REGISTRY.PROVIDER_RATE_LIMIT_SYNCED.name,
    PROVIDER_ERROR_SYNCED: EVENT_REGISTRY.PROVIDER_ERROR_SYNCED.name,
    KEY_ALERT_RESOLVED: EVENT_REGISTRY.KEY_ALERT_RESOLVED.name,
} as const;

export type ProviderEventMap = Pick<
    EventMap,
    | 'key:loaded'
    | 'key:added'
    | 'key:removed'
    | 'key:updated'
    | 'key:state:changed'
    | 'key:compromised'
    | 'key:health:check:started'
    | 'key:health:check:completed'
    | 'key:health:check:failed'
    | 'key:latency:burst'
    | 'key:quota:exceeded'
    | 'key:reputation:threshold:crossed'
    | 'key:compromise:signal'
    | 'key:group:sync'
    | 'key:health:check'
    | 'key:health:check:all'
    | 'key:probe:result'
    | 'provider:circuit:breaker:synced'
    | 'provider:rate:limit:synced'
    | 'provider:error:synced'
>;

import type { KeyStatus } from '../contracts/key-state';

export interface ProbeResultPayload {
    status: KeyStatus;
    provider: string;
    keyId: string;
    keyLabel: string;
    model: string;
    latency: number;
    quotaRemaining?: number;
    quotaLimit?: number;
    rateLimited: boolean;
    circuitOpen: boolean;
    error?: string;
    statusCode?: number;
    timestamp: number;
}

export interface ApiKeyPayload {
    id: string;
    provider: string;
    key: string;
    label: string;
    status: string;
    model?: string;
    availableModels?: string[];
    stats?: {
        totalTokens: number;
        totalCost: number;
        totalRequests: number;
        errors: number;
        avgLatency: number;
        avgTtft: number;
        avgTps: number;
        lastUsed: number;
        reputation: number;
        successRate: number;
    };
}

export interface QuotaExceededPayload {
    id: string;
    provider: string;
    quotaType: 'tokens' | 'requests';
    limit?: number;
    current?: number;
    resetAt?: number;
}
