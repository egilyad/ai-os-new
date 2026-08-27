import { EVENT_REGISTRY, type EventMap } from './event-registry';
import type { ScoringComponents } from '../types/metrics-types';
export type { ScoringComponents };

export const SystemEvents = {
    NAVIGATE: EVENT_REGISTRY.NAVIGATE.name,
    NOTIFICATION: EVENT_REGISTRY.NOTIFICATION.name,
    DECISION: EVENT_REGISTRY.DECISION.name,
    KERNEL_UPDATED: EVENT_REGISTRY.KERNEL_UPDATED.name,
    KERNEL_HEARTBEAT: EVENT_REGISTRY.KERNEL_HEARTBEAT.name,
    KERNEL_STATE_RESET: EVENT_REGISTRY.KERNEL_STATE_RESET.name,
    RUNTIME_READY: EVENT_REGISTRY.RUNTIME_READY.name,
    RUNTIME_FAILED: EVENT_REGISTRY.RUNTIME_FAILED.name,
    EVENTBUS_BACKPRESSURE: EVENT_REGISTRY.EVENTBUS_BACKPRESSURE.name,
    CLEAR_DATA: EVENT_REGISTRY.CLEAR_DATA.name,
    RELOAD: EVENT_REGISTRY.RELOAD.name,
    KERNEL_LOAD_FAILED: EVENT_REGISTRY.KERNEL_LOAD_FAILED.name,
    KERNEL_PERSIST_FAILED: EVENT_REGISTRY.KERNEL_PERSIST_FAILED.name,
    SYSTEM_RUNTIME_METRICS: EVENT_REGISTRY.SYSTEM_RUNTIME_METRICS.name,
} as const;

export type SystemEventMap = Pick<
    EventMap,
    | 'system:navigate'
    | 'system:notification'
    | 'system:decision'
    | 'kernel:updated'
    | 'kernel:heartbeat'
    | 'kernel:state:reset'
    | 'system:runtime:ready'
    | 'system:runtime:failed'
    | 'system:eventbus:backpressure'
    | 'system:data:clear'
    | 'system:reload'
    | 'kernel:load:failed'
    | 'kernel:persist:failed'
    | 'system:runtime:metrics'
>;

export interface NotificationPayload {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    source?: string;
    savings?: { latency?: number; cost?: number };
}

export interface SkippedEntry {
    provider: string;
    keyLabel: string;
    keyId?: string;
    reason: string;
    stage:
        | 'status'
        | 'policy'
        | 'quota'
        | 'score'
        | 'budget'
        | 'unavailable'
        | 'circuit'
        | 'ratelimit'
        | 'backoff'
        | 'normalization'
        | 'exclusion';
}

export interface DecisionPayload {
    requestId: string;
    strategy: string;
    classification?: {
        complexity: 'simple' | 'medium' | 'complex';
        isCode: boolean;
        isLong: boolean;
        isMultimodal: boolean;
        intent?: string;
        language?: string;
    };
    weights: unknown;
    selected: string;
    secondBest: string | null;
    scores: Array<{ p: string; s: string; c?: ScoringComponents }>;
    skipped?: SkippedEntry[];
    timestamp: number;
    profile?: string;
    isExperiment?: boolean;
}
