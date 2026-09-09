import type { ApiKey } from '../types/metrics-types';
import type { DebateSession, IDebateQueryEngine } from './debate-types';
import type { DebateStore } from './storage/debate-store';
import type { IQualityImpactCollector, IExperimentEngine } from './quality-impact';
import type { IDebateSessionStore, IDebateLiveStore } from './debate-store';

export interface DebateServiceDeps {
    database: {
        getKv: <T>(key: string) => Promise<T | undefined>;
        setKv: (key: string, value: unknown) => Promise<void>;
        keyValue: { delete: (key: string) => Promise<void> };
    };
    adapterRegistry: {
        getAdapter: (provider: string) =>
            | {
                  sendMessage: (
                      messages: unknown[],
                      modelId: string,
                      key: string,
                      signal: AbortSignal,
                      options?: unknown,
                  ) => Promise<{ content: string }>;
              }
            | undefined;
        resetCircuitBreaker: (provider: string) => void;
    };
    keyService: {
        getKeys: () => ApiKey[];
        getKey: (id: string) => ApiKey | undefined;
        getActiveKeys: () => ApiKey[];
        recordUsage: (
            keyId: string,
            latency: number,
            tokens: number,
            model: string,
            extra?: Record<string, unknown>,
        ) => void;
    };
    routerService: {
        getDebateProviders: (participantCount: number) => Array<{ provider: string; key: ApiKey }>;
        getRankedProviders: (
            mode: string,
            prompt: string,
            priority: string,
            provider?: string,
            modelId?: string,
            minBudget?: number,
            maxCost?: number,
            excludedKeys?: string[],
            sessionId?: string,
        ) => ApiKey[];
    };
    eventBus: import('../types/interfaces').IEventBus;
    workspaceService: {
        isAttached: () => boolean;
        getFileTreeSnapshot: () => Promise<string | null>;
    };
    sessionManager: {
        link: (fromId: string, toId: string, linkType: string, context?: string) => Promise<void>;
        updateMeta: (id: string, updates: Record<string, unknown>) => Promise<void>;
        getDebateHistory: () => DebateSession[];
        saveToDebateHistory: (session: DebateSession) => void;
        restoreDebateSession: (id: string) => DebateSession | null;
        archiveDebateSession: (id: string) => boolean;
        deleteDebateHistory: (id: string) => boolean;
        clearDebateHistory: () => void;
    };
    queryEngine: IDebateQueryEngine;
    debateStore: DebateStore;
    activeDebateStore: IDebateSessionStore;
    debateLiveStore: IDebateLiveStore;
    qualityCollector?: IQualityImpactCollector;
    experimentEngine?: IExperimentEngine;
}
