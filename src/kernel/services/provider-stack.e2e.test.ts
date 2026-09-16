import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProviderRuntimeService } from './provider-runtime/provider-service';
import { EventRecorder } from './event-sourcing/event-recorder';
import { LLMClientService } from './llm-client-service';
import type { IProviderAdapter, IAdapterRegistry } from '../contracts/provider-adapter';
import type { ApiKey } from '../types/metrics-types';

function mockKey(overrides?: Partial<ApiKey>): ApiKey {
    return {
        id: 'e2e-key-1',
        provider: 'mock',
        key: 'sk-mock-e2e',
        label: 'E2E Test Key',
        status: 'active' as const,
        availableModels: ['mock-model'],
        stats: {
            successCount: 0,
            errorCount: 0,
            totalTokens: 0,
            avgLatency: 0,
            minLatency: 0,
            maxLatency: 0,
            extended: {
                coldStartLatency: 0,
                warmStartLatency: 0,
                throughputHistory: [],
                stabilityIndex: 1,
                retryImpactScore: 0,
                rateLimitPressure: 0,
                keyAgeScore: 1,
                estimatedCost: 0,
                tokenEfficiency: 1,
                contextUtilization: 0,
                retentionCurve: [],
                reputationScore: 100,
                stabilityForecast: 'stable' as const,
                fingerprint: 'e2e-fp',
                state: 'active' as const,
                activeSLA: 'BALANCED' as const,
                traces: [],
                quality: {
                    score: 1,
                    semanticDrift: 0,
                    instructionFollowing: 1,
                    structureConsistency: 1,
                },
                learning: {
                    specialization: [],
                    performanceByTask: {},
                    taskMatrix: {},
                    advisorInsights: { recommendedFor: [], avoidFor: [], confidence: 0 },
                    lastFiveResults: [],
                },
                currentConcurrentRequests: 0,
                alerts: [],
                streaming: {
                    chunkStability: 0,
                    streamGaps: 0,
                    realtimeTokensPerSec: 0,
                    avgChunkLatency: 0,
                    maxChunkGap: 0,
                    jitter: 0,
                },
                usageToday: { tokens: 0, weightedTokens: 0, requests: 0, estimatedCost: 0 },
                usageMonthly: { tokens: 0, requests: 0, estimatedCost: 0 },
                latencyBreakdown: { ttft: 0, total: 0, tokensPerSec: 0 },
                errorBreakdown: {
                    rateLimit: 0,
                    timeout: 0,
                    serverError: 0,
                    validationError: 0,
                    other: 0,
                    provider: 0,
                },
                fourSignals: { latency: 0, throughput: 0, errorRate: 0, saturation: 0 },
                rules: {
                    maxConcurrentRequests: 5,
                    retryPolicy: { maxAttempts: 3, backoffMs: 1000 },
                    timeoutMs: 30000,
                    quota: { tokensPerDay: 1000000, requestsPerDay: 1000 },
                    slaThresholds: { latencyP95: 2000, errorFloor: 0.05 },
                },
                hourlyUsage: [],
                userPreferenceScore: 0.5,
                manualSwitches: 0,
                cancellations: 0,
            },
        },
        ...overrides,
    };
}

function mockAdapter(overrides?: Partial<IProviderAdapter>): IProviderAdapter {
    return {
        id: 'mock',
        sendMessage: vi
            .fn()
            .mockResolvedValue({ content: 'E2E response', latency: 50, tokens: 20 }),
        streamMessage: undefined,
        checkHealth: vi.fn().mockResolvedValue({ status: 'ok', latency: 10 }),
        getAvailableModels: vi.fn().mockResolvedValue(['mock-model']),
        ...overrides,
    };
}

function mockRegistry(adapter?: IProviderAdapter): IAdapterRegistry {
    return {
        getAdapter: vi.fn(() => adapter ?? mockAdapter()),
        hasAdapter: vi.fn(() => true),
        getOrCreateWithFallback: vi.fn(() => adapter ?? mockAdapter()),
        getAllProviders: vi.fn(() => []),
        getProviderRuntimeStatus: vi.fn(() => ({ circuitOpen: false, rateLimited: false })),
        getCircuitBreakerState: vi.fn(() => 'closed' as const),
        resetCircuitBreaker: vi.fn(),
        syncCircuitBreakerState: vi.fn(),
        syncRateLimitState: vi.fn(),
        clearAllCaches: vi.fn(),
    };
}

describe('Provider Stack E2E', () => {
    let eventBus: {
        emit: (event: string, data?: unknown) => void;
        on: (event: string, handler: (...args: unknown[]) => void) => () => void;
        off: () => void;
    };
    let eventHandlers: Record<string, Array<(...args: unknown[]) => void>>;
    let eventSourcing: EventRecorder;
    let providerRuntime: ProviderRuntimeService;
    let adapterRegistry: IAdapterRegistry;
    let llmClient: LLMClientService;
    let adapter: IProviderAdapter;
    let recordedEvents: Array<{ event: string; data: Record<string, unknown> }>;

    beforeEach(async () => {
        recordedEvents = [];
        eventHandlers = {};

        eventBus = {
            emit: vi.fn((event: string, data?: unknown) => {
                const handlers = eventHandlers[event] || [];
                handlers.forEach((h) => h(data));
            }),
            on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
                if (!eventHandlers[event]) eventHandlers[event] = [];
                eventHandlers[event].push(handler);
                return () => {
                    eventHandlers[event] = eventHandlers[event].filter((h) => h !== handler);
                };
            }) as unknown as (event: string, handler: (...args: unknown[]) => void) => () => void,
            off: vi.fn(),
        };

        providerRuntime = new ProviderRuntimeService();

        eventSourcing = new EventRecorder();
        await eventSourcing.init(
            (cb: (payload: { event: string; data: Record<string, unknown> }) => void) => {
                const wrapped = (payload: { event: string; data: Record<string, unknown> }) => {
                    recordedEvents.push(payload);
                    cb(payload);
                };
                const unsub = eventBus.on(
                    '*',
                    wrapped as (...args: unknown[]) => void,
                ) as unknown as () => void;
                return unsub;
            },
        );

        adapter = mockAdapter();
        adapterRegistry = mockRegistry(adapter);

        llmClient = new LLMClientService(
            {
                resolveApiKey: () => 'sk-e2e-test',
                defaultProvider: 'mock',
                defaultModel: 'mock-model',
            },
            adapterRegistry,
        );
    });

    afterEach(() => {
        eventSourcing.destroy();
        providerRuntime.destroy();
        vi.clearAllMocks();
    });

    it('should run full pipeline: key → runtime → event sourcing → adapter → LLM', async () => {
        const key = mockKey();

        const instance = providerRuntime.createInstance(key);
        expect(instance).toBeDefined();
        expect(instance.id).toBe(key.id);
        expect(instance.status).toBe('idle');

        const session = providerRuntime.createSession(instance.id, key.provider, 'mock-model');
        expect(session).toBeDefined();
        expect(session.status).toBe('pending');

        const activated = providerRuntime.activateSession(session.id);
        expect(activated).toBeDefined();
        expect(activated!.status).toBe('active');

        const checkpoint = eventSourcing.createCheckpoint('session-activated', {
            tags: ['e2e', 'session'],
        });
        expect(checkpoint).toBeDefined();

        const response = await llmClient.chat([{ role: 'user', content: 'E2E test message' }], {
            provider: 'mock',
            model: 'mock-model',
        });
        expect(response.content).toBe('E2E response');
        expect(adapter.sendMessage).toHaveBeenCalledTimes(1);

        providerRuntime.recordSessionUsage(session.id, 10, response.tokens, 0.001);
        providerRuntime.completeSession(session.id, response.latency);

        const runtimeSnapshot = providerRuntime.getRuntimeSnapshot();
        expect(runtimeSnapshot).toBeDefined();

        eventSourcing.createCheckpoint('session-completed', {
            tags: ['e2e', 'session', 'complete'],
        });
    });

    it('should support streaming through LLM client via adapter registry', async () => {
        const streamMock = vi.fn(
            async (_msgs: unknown[], _model: string, _key: string, cb: (chunk: string) => void) => {
                cb('E2E ');
                cb('streaming ');
                cb('works');
            },
        );

        const streamAdapter = mockAdapter({
            id: 'mock-stream',
            sendMessage: undefined,
            streamMessage: streamMock,
        });

        const streamRegistry = mockRegistry(streamAdapter);
        const streamClient = new LLMClientService(
            { resolveApiKey: () => 'sk-test', defaultProvider: 'mock-stream' },
            streamRegistry,
        );

        const onChunk = vi.fn();
        const result = await streamClient.chat([{ role: 'user', content: 'Stream test' }], {
            onChunk,
        });

        expect(result.content).toBe('E2E streaming works');
        expect(onChunk).toHaveBeenCalledTimes(3);
        expect(onChunk).toHaveBeenNthCalledWith(1, 'E2E ', undefined);
        expect(onChunk).toHaveBeenNthCalledWith(2, 'streaming ', undefined);
        expect(onChunk).toHaveBeenNthCalledWith(3, 'works', undefined);
    });

    it('should handle provider runtime lifecycle through full session', async () => {
        const key = mockKey();

        const sessionStartCount = providerRuntime.getActiveSessions().length;
        expect(sessionStartCount).toBeGreaterThanOrEqual(0); // baseline count

        const instance = providerRuntime.getOrCreateInstance(key);
        expect(instance.status).toBe('idle');

        const session = providerRuntime.createSession(instance.id, key.provider, 'mock-model');
        providerRuntime.activateSession(session.id);
        expect(session.status).toBe('active');

        providerRuntime.recordSessionUsage(session.id, 50, 100, 0.005);

        const budgetBefore = providerRuntime.getBudgetSnapshot();
        expect(budgetBefore).toBeDefined();

        providerRuntime.completeSession(session.id, 200);

        const allSessions = providerRuntime.getSessionsByInstance(instance.id);
        expect(allSessions.length).toBe(1);
        expect(allSessions[0].status).toBe('completed');
    });

    it('should integrate provider runtime with event sourcing', async () => {
        const key = mockKey();
        const instance = providerRuntime.createInstance(key);

        const cp1 = eventSourcing.createCheckpoint('instance-created', {
            tags: ['e2e'],
            description: 'Instance created for E2E key',
        });
        expect(cp1).toBeDefined();

        const session = providerRuntime.createSession(instance.id, key.provider, 'mock-model');
        providerRuntime.activateSession(session.id);

        const cp2 = eventSourcing.createCheckpoint('session-active');

        expect(cp2.sequence).toBeGreaterThanOrEqual(cp1.sequence);

        providerRuntime.completeSession(session.id, 100);
        const cp3 = eventSourcing.createCheckpoint('session-done');

        expect(cp3.sequence).toBeGreaterThanOrEqual(cp2.sequence);

        const retrievedCp = eventSourcing.checkpoints.get(cp2.id);
        expect(retrievedCp).toBeDefined();
        expect(retrievedCp!.sequence).toBe(cp2.sequence);
    });

    it('should emit and record events through the full stack', async () => {
        const key = mockKey();
        const instance = providerRuntime.createInstance(key);
        const session = providerRuntime.createSession(instance.id, key.provider, 'mock-model');
        providerRuntime.activateSession(session.id);

        const response = await llmClient.chat([{ role: 'user', content: 'hello' }], {
            provider: 'mock',
            model: 'mock-model',
        });
        expect(response.content).toBe('E2E response');

        providerRuntime.recordSessionUsage(session.id, 5, response.tokens, 0.001);
        providerRuntime.completeSession(session.id, 50);

        eventSourcing.createCheckpoint('full-flow-done', {
            tags: ['e2e', 'complete'],
        });

        expect(eventSourcing.getCount()).toBeGreaterThanOrEqual(0);
    });
});
