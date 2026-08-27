import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { QueuedRequest, ChatResponse } from '../types/chat-types';

const mockEmit = vi.fn();

const mockLogger = vi.hoisted(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
    getBuffer: vi.fn().mockReturnValue([]),
    query: vi.fn().mockReturnValue([]),
    clear: vi.fn(),
    setTraceContext: vi.fn(),
    exportLogs: vi.fn().mockReturnValue(''),
}));

vi.mock('../instances', () => ({
    rootLogger: mockLogger,
    promptSecurityService: {
        scan: vi.fn().mockReturnValue({ safe: true, score: 0, summary: '', details: [] }),
        getConfig: vi.fn().mockReturnValue({ enabled: false, blockOnScore: 7 }),
        addEvent: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('../config-registry', () => ({
    CONFIG: {
        keys: { defaultRules: { timeoutMs: 15000 } },
        featureFlags: { memory: { enabled: false } },
    },
}));

vi.mock('../events/event-names', () => ({
    EVENTS: {
        MESSAGE_RESPONSE: 'chat:response',
        STREAM_START: 'chat:stream:start',
        STREAM_CHUNK: 'chat:stream:chunk',
        STREAM_END: 'chat:stream:end',
        STREAM_ERROR: 'chat:stream:error',
        NOTIFICATION: 'notification',
    },
}));

import { ChatExecutor } from './chat-executor';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { ChatServiceDeps } from '../contracts/chat';

function makeMockSendMessage(opts?: {
    resolveWith?: { content: string | null; tokens: number; finishReason: string | null };
    rejectWith?: Error;
    signal?: AbortSignal;
}) {
    const response = opts?.resolveWith ?? {
        content: 'Hello from LLM',
        tokens: 42,
        finishReason: 'stop',
    };
    const rejectErr = opts?.rejectWith ?? null;
    return vi
        .fn()
        .mockImplementation((_messages: unknown[], options?: { signal?: AbortSignal }) => {
            const signal = options?.signal;
            if (rejectErr) return Promise.reject(rejectErr);
            if (signal?.aborted) {
                return Promise.reject(new DOMException('The operation was aborted', 'AbortError'));
            }
            return new Promise((resolve, reject) => {
                if (signal) {
                    signal.addEventListener(
                        'abort',
                        () => {
                            reject(new DOMException('The operation was aborted', 'AbortError'));
                        },
                        { once: true },
                    );
                }
                resolve(response);
            });
        });
}

function createMockDeps(overrides: Partial<ChatServiceDeps> = {}): ChatServiceDeps {
    return {
        eventBus: {
            on: vi.fn(),
            onSafe: vi.fn(),
            emit: mockEmit,
            emitOnce: vi.fn().mockReturnValue(true),
        },
        promptSecurityService: {
            scan: vi.fn().mockReturnValue({ safe: true, score: 0, findings: [], summary: '' }),
            getConfig: vi.fn().mockReturnValue({ enabled: false, blockOnScore: 7, rules: [] }),
            updateConfig: vi.fn(),
            addEvent: vi.fn().mockResolvedValue(undefined),
            getHistory: vi.fn().mockResolvedValue([]),
            clearHistory: vi.fn().mockResolvedValue(undefined),
        },
        keyService: {
            selectFromPool: vi.fn(),
            selectWithBurst: vi.fn(),
            getKeys: vi.fn().mockReturnValue([]),
            getKey: vi.fn(),
            recordUsage: vi.fn(),
            handleProviderError: vi.fn(),
            updateKeyStatus: vi.fn(),
        },
        virtualKeyService: { resolve: vi.fn() },
        settingsService: { getSettings: vi.fn().mockReturnValue({ streamingEnabled: false }) },
        routerService: {
            getRankedProviders: vi.fn().mockReturnValue([]),
            getRaceCandidateDetails: vi.fn().mockReturnValue([]),
            getDeepDowngradedModel: vi.fn(),
            getDowngradedModel: vi.fn(),
            resolveWithFallback: vi.fn(),
        },
        cacheService: {
            generateKey: vi.fn().mockResolvedValue('cache-key-123'),
            get: vi.fn(),
            set: vi.fn(),
        },
        policyService: {
            checkAgentPolicy: vi.fn().mockReturnValue({ allowed: true }),
        },
        budgetService: { recordSpend: vi.fn() },
        freeTierLimits: {},
        logger: mockLogger,
        llmClient: {
            sendMessage: makeMockSendMessage(),
        } as unknown as ILLMClientService,
        ...overrides,
    } as ChatServiceDeps;
}

function makeRequest(overrides: Partial<QueuedRequest> = {}): QueuedRequest {
    return {
        requestId: 'req-1',
        provider: 'openai',
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
        keyId: 'key-1',
        options: { temperature: 0.7, maxTokens: 100 },
        priority: 'normal',
        ...overrides,
    };
}

describe('ChatExecutor', () => {
    let deps: ChatServiceDeps;
    let executor: ChatExecutor;

    beforeEach(() => {
        vi.clearAllMocks();
        deps = createMockDeps();
        executor = new ChatExecutor(deps, deps.llmClient);
    });

    afterEach(() => {
        executor.destroy();
    });

    describe('lifecycle', () => {
        it('should construct without errors', () => {
            expect(executor).toBeInstanceOf(ChatExecutor);
        });

        it('should destroy and clean up active state', () => {
            const req = makeRequest();
            executor.handleMessage(req);
            executor.destroy();
            mockEmit.mockClear();
            executor.handleMessage(req);
            expect(mockEmit).not.toHaveBeenCalled();
        });

        it('should be safe to destroy twice', () => {
            executor.destroy();
            expect(() => executor.destroy()).not.toThrow();
        });
    });

    describe('handleMessage', () => {
        it('should emit done response on successful LLM call', async () => {
            const req = makeRequest();
            executor.handleMessage(req);
            await vi.waitFor(() => {
                expect(mockEmit).toHaveBeenCalledWith(
                    'chat:response',
                    expect.objectContaining({ requestId: 'req-1', status: 'done' }),
                );
            });
        });

        it('should assign random requestId when empty', async () => {
            const req = makeRequest({ requestId: '' });
            executor.handleMessage(req);
            await vi.waitFor(() => {
                expect(mockEmit).toHaveBeenCalledWith(
                    'chat:response',
                    expect.objectContaining({ status: 'done' }),
                );
            });
        });

        it('should be a no-op after destroy', () => {
            executor.destroy();
            expect(() => executor.handleMessage(makeRequest())).not.toThrow();
        });
    });

    describe('cancelRequest', () => {
        it('should cancel an in-flight request and emit cancelled status', async () => {
            let capturedSignal: AbortSignal | undefined;
            let resolveSend!: (v: unknown) => void;
            deps.llmClient.sendMessage = vi
                .fn()
                .mockImplementation((_msgs: unknown[], opts?: { signal?: AbortSignal }) => {
                    capturedSignal = opts?.signal;
                    return new Promise((resolve, reject) => {
                        resolveSend = resolve;
                        if (opts?.signal) {
                            opts.signal.addEventListener(
                                'abort',
                                () => {
                                    reject(
                                        new DOMException('The operation was aborted', 'AbortError'),
                                    );
                                },
                                { once: true },
                            );
                        }
                    });
                });
            const localExecutor = new ChatExecutor(deps, deps.llmClient);
            localExecutor.handleMessage(makeRequest());
            await vi.waitFor(() => expect(capturedSignal).toBeDefined());
            mockEmit.mockClear();
            localExecutor.cancelRequest('req-1');
            await vi.waitFor(() => {
                expect(mockEmit).toHaveBeenCalledWith(
                    'chat:response',
                    expect.objectContaining({ status: 'cancelled' }),
                );
            });
            resolveSend(undefined);
            localExecutor.destroy();
        });

        it('should be a no-op for unknown requestId', () => {
            expect(() => executor.cancelRequest('nonexistent')).not.toThrow();
        });
    });

    describe('policy checks', () => {
        it('should not emit any response when policy blocks provider', async () => {
            deps.policyService.checkAgentPolicy = vi.fn().mockReturnValue({
                allowed: false,
                reason: 'Provider not allowed',
            });
            const req = makeRequest({
                options: { ...makeRequest().options, metadata: { agentId: 'agent-1' } },
            });
            executor.handleMessage(req);
            await new Promise((r) => setTimeout(r, 200));
            expect(mockEmit).not.toHaveBeenCalled();
        });
    });

    describe('auto-routing', () => {
        it('should emit error when no providers available', async () => {
            deps.routerService.getRankedProviders = vi.fn().mockReturnValue([]);
            const req = makeRequest({ provider: 'auto' });
            executor.handleMessage(req);
            await vi.waitFor(() => {
                expect(mockEmit).toHaveBeenCalledWith(
                    'chat:response',
                    expect.objectContaining({
                        status: 'error',
                        error: 'No providers available for auto-routing',
                    }),
                );
            });
        });

        it('should route to the first ranked provider', async () => {
            deps.routerService.getRankedProviders = vi
                .fn()
                .mockReturnValue([{ provider: 'anthropic', key: { id: 'key-2' }, score: 0.9 }]);
            executor.handleMessage(makeRequest({ provider: 'auto' }));
            await vi.waitFor(() => {
                expect(deps.llmClient.sendMessage).toHaveBeenCalledWith(
                    expect.any(Array),
                    expect.objectContaining({ provider: 'anthropic' }),
                );
            });
        });
    });

    describe('caching', () => {
        it('should return cached response on cache hit', async () => {
            deps.cacheService.generateKey = vi.fn().mockResolvedValue('ck-1');
            deps.cacheService.get = vi.fn().mockReturnValue({
                response: 'Cached response',
                model: 'gpt-4',
                promptTokens: 10,
                completionTokens: 5,
            });
            executor.handleMessage(makeRequest());
            await vi.waitFor(() => {
                const calls = mockEmit.mock.calls.filter(
                    (c: unknown[]) => c[0] === 'chat:response',
                );
                expect(calls.length).toBeGreaterThanOrEqual(2);
                expect(
                    calls.some((c: unknown[]) => (c[1] as ChatResponse).status === 'cached'),
                ).toBe(true);
                expect(
                    calls.some(
                        (c: unknown[]) => (c[1] as ChatResponse).content === 'Cached response',
                    ),
                ).toBe(true);
            });
            expect(deps.llmClient.sendMessage).not.toHaveBeenCalled();
        });

        it('should skip cache when generateKey returns null', async () => {
            deps.cacheService.generateKey = vi.fn().mockResolvedValue(null);
            executor.handleMessage(makeRequest());
            await vi.waitFor(() => {
                expect(deps.llmClient.sendMessage).toHaveBeenCalled();
            });
        });
    });

    describe('LLM response handling', () => {
        it('should emit STREAM_START and STREAM_END events', async () => {
            executor.handleMessage(makeRequest());
            await vi.waitFor(() => {
                expect(mockEmit).toHaveBeenCalledWith('chat:stream:start', expect.anything());
                expect(mockEmit).toHaveBeenCalledWith('chat:stream:end', expect.anything());
            });
        });

        it('should record key usage after success', async () => {
            executor.handleMessage(makeRequest());
            await vi.waitFor(() => {
                expect(deps.keyService.recordUsage).toHaveBeenCalled();
            });
        });

        it('should emit error on null content from LLM', async () => {
            deps.llmClient.sendMessage = makeMockSendMessage({
                resolveWith: { content: null, tokens: 0, finishReason: null },
            });
            executor.handleMessage(makeRequest());
            await vi.waitFor(() => {
                expect(mockEmit).toHaveBeenCalledWith(
                    'chat:response',
                    expect.objectContaining({
                        status: 'error',
                        error: 'Empty or invalid response from provider',
                    }),
                );
            });
        });

        it('should emit error on unexpected finish reason', async () => {
            deps.llmClient.sendMessage = makeMockSendMessage({
                resolveWith: { content: null, tokens: 0, finishReason: 'SAFETY' },
            });
            executor.handleMessage(makeRequest());
            await vi.waitFor(() => {
                expect(mockEmit).toHaveBeenCalledWith(
                    'chat:response',
                    expect.objectContaining({
                        status: 'error',
                        error: 'Unexpected finish reason: SAFETY',
                    }),
                );
            });
        });
    });

    describe('error handling and retries', () => {
        it('should retry with fallback provider on 429 rate limit', async () => {
            let attempt = 0;
            deps.llmClient.sendMessage = vi.fn().mockImplementation(() => {
                attempt++;
                if (attempt === 1) {
                    return Promise.reject(
                        Object.assign(new Error('429 Too Many Requests'), { statusCode: 429 }),
                    );
                }
                return Promise.resolve({
                    content: 'Fallback success',
                    tokens: 10,
                    finishReason: 'stop',
                });
            });
            deps.routerService.resolveWithFallback = vi.fn().mockReturnValue({
                provider: 'anthropic',
                key: { id: 'key-2' },
            });
            executor.handleMessage(makeRequest());
            await vi.waitFor(() => {
                expect(mockEmit).toHaveBeenCalledWith(
                    'chat:response',
                    expect.objectContaining({ status: 'done', content: 'Fallback success' }),
                );
            });
            expect(attempt).toBe(2);
        });

        it('should emit rate-limited error after exhausting retries', async () => {
            deps.llmClient.sendMessage = vi
                .fn()
                .mockRejectedValue(
                    Object.assign(new Error('429 Too Many Requests'), { statusCode: 429 }),
                );
            deps.routerService.resolveWithFallback = vi.fn().mockReturnValue(null);
            executor.handleMessage(makeRequest());
            await vi.waitFor(() => {
                expect(mockEmit).toHaveBeenCalledWith(
                    'chat:response',
                    expect.objectContaining({
                        status: 'error',
                        error: 'Rate limited. Please try again later.',
                    }),
                );
            });
        });
    });

    describe('race execution', () => {
        it('should emit done response from race winner', async () => {
            deps.raceExecutor = {
                race: vi.fn().mockResolvedValue({
                    winner: { provider: 'openai', model: 'gpt-4', keyId: 'key-1' },
                    response: { content: 'Race winner', tokens: 30, finishReason: 'stop' },
                    latency: 100,
                    failures: [],
                    aborted: [],
                }),
                destroy: vi.fn(),
            };
            deps.routerService.getRaceCandidateDetails = vi.fn().mockReturnValue([
                { provider: 'openai', model: 'gpt-4', keyId: 'key-1' },
                { provider: 'anthropic', model: 'claude-3', keyId: 'key-2' },
            ]);
            deps.keyService.getKey = vi.fn().mockReturnValue({
                id: 'key-1',
                key: 'sk-xxx',
                provider: 'openai',
                status: 'active',
            });
            executor.handleMessage(
                makeRequest({
                    options: { ...makeRequest().options, strategy: 'race' },
                }),
            );
            await vi.waitFor(() => {
                expect(mockEmit).toHaveBeenCalledWith(
                    'chat:response',
                    expect.objectContaining({
                        content: 'Race winner',
                        status: 'done',
                        strategy: 'race',
                    }),
                );
            });
        });

        it('should fall through to normal execution when fewer than 2 candidates', async () => {
            deps.raceExecutor = { race: vi.fn(), destroy: vi.fn() };
            deps.routerService.getRaceCandidateDetails = vi
                .fn()
                .mockReturnValue([{ provider: 'openai', model: 'gpt-4', keyId: 'key-1' }]);
            executor.handleMessage(
                makeRequest({
                    options: { ...makeRequest().options, strategy: 'race' },
                }),
            );
            await vi.waitFor(() => {
                expect(deps.llmClient.sendMessage).toHaveBeenCalled();
            });
        });
    });

    describe('stale request cleanup', () => {
        it('should abort requests older than TTL', async () => {
            vi.useFakeTimers();
            const baseTime = Date.now();
            vi.setSystemTime(baseTime);
            let capturedSignal: AbortSignal | undefined;
            let resolveSend!: (v: unknown) => void;
            deps.llmClient.sendMessage = vi
                .fn()
                .mockImplementation((_msgs: unknown[], opts?: { signal?: AbortSignal }) => {
                    capturedSignal = opts?.signal;
                    return new Promise((resolve, reject) => {
                        resolveSend = resolve;
                        if (opts?.signal) {
                            opts.signal.addEventListener(
                                'abort',
                                () => {
                                    reject(
                                        Object.assign(new DOMException('Aborted', 'AbortError'), {
                                            name: 'AbortError',
                                        }),
                                    );
                                },
                                { once: true },
                            );
                        }
                    });
                });
            const localExecutor = new ChatExecutor(deps, deps.llmClient);
            localExecutor.handleMessage(makeRequest());
            await vi.waitFor(() => expect(capturedSignal).toBeDefined());
            expect(capturedSignal!.aborted).toBe(false);
            vi.setSystemTime(baseTime + 11 * 60 * 1000);
            vi.advanceTimersByTime(61000);
            await vi.waitFor(() => {
                expect(capturedSignal!.aborted).toBe(true);
            });
            resolveSend(undefined);
            vi.useRealTimers();
            localExecutor.destroy();
        });
    });
});
