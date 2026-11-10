import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EVENTS } from '../instances';

vi.mock('../utils/tokenEstimate', () => ({ estimateTokens: vi.fn(() => 100) }));

const mockKeyObj = {
    id: 'test-key-1',
    provider: 'Gemini',
    key: 'mock-key-value',
    label: 'Test Key',
    status: 'active',
    availableModels: ['gemini-3.1-flash-lite'],
    stats: { avgLatency: 200 },
};

const mockLLMResponse = {
    content: 'Test response',
    latency: 100,
    tokens: 50,
    ttft: 40,
    tps: 500,
    cost: 0.001,
    model: 'gemini-3.1-flash-lite',
    provider: 'Gemini',
    finishReason: 'stop',
};

const mockSettings = {
    streamingEnabled: false,
};

const eventHandlers: Record<string, Array<(...args: unknown[]) => void>> = {};
const mockEventBus = {
    emit: vi.fn((event: string, data: unknown) => {
        const handlers = eventHandlers[event] || [];
        handlers.forEach((h) => h(data));
    }),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        if (!eventHandlers[event]) eventHandlers[event] = [];
        eventHandlers[event].push(handler);
        return () => {
            eventHandlers[event] = eventHandlers[event].filter((h) => h !== handler);
        };
    }),
    onSafe: vi.fn(<T>(event: string, handler: (data: T) => void) => {
        if (!eventHandlers[event]) eventHandlers[event] = [];
        eventHandlers[event].push(handler as (...args: unknown[]) => void);
        return () => {
            eventHandlers[event] = eventHandlers[event].filter((h) => h !== handler);
        };
    }),
    off: vi.fn(),
    emitOnce: vi.fn(() => true),
};

const mockKeyService = {
    selectFromPool: vi.fn(() => mockKeyObj),
    selectWithBurst: vi.fn(() => mockKeyObj),
    getKeys: vi.fn(() => [mockKeyObj]),
    recordUsage: vi.fn(),
    updateKeyStatus: vi.fn(),
    handleProviderError: vi.fn(),
    getPoolKeys: vi.fn(() => [mockKeyObj]),
    canUseKey: vi.fn(() => ({ can: true, reason: null })),
};

const mockRouterService = {
    getRankedProviders: vi.fn(() => [mockKeyObj]),
    resolveWithFallback: vi.fn(() => null),
    getDowngradedModel: vi.fn(() => null),
    getDeepDowngradedModel: vi.fn(() => null),
    getRaceCandidateDetails: vi.fn(() => []),
};

const mockSettingsService = {
    getSettings: vi.fn(() => mockSettings),
};

const mockCacheService = {
    generateKey: vi.fn(async () => 'test-cache-key'),
    get: vi.fn(() => null),
    set: vi.fn(),
};

const mockLLMClient = {
    chat: vi.fn().mockResolvedValue(mockLLMResponse),
    sendMessage: vi.fn().mockResolvedValue(mockLLMResponse),
    buildRequestBody: vi.fn().mockResolvedValue({ model: 'test-model', messages: [] }),
};

describe('ChatExecutor auto-routing', () => {
    let chatService: { init: () => void; destroy: () => void };

    beforeEach(async () => {
        vi.clearAllMocks();
        Object.keys(eventHandlers).forEach((k) => delete eventHandlers[k]);
        mockKeyService.selectFromPool.mockReturnValue(mockKeyObj);
        mockKeyService.selectWithBurst.mockReturnValue(mockKeyObj);
        mockKeyService.getKeys.mockReturnValue([mockKeyObj]);
        mockRouterService.getRankedProviders.mockReturnValue([mockKeyObj]);
        mockLLMClient.chat.mockResolvedValue(mockLLMResponse);
        mockLLMClient.sendMessage.mockResolvedValue(mockLLMResponse);

        const { ChatExecutor } = await import('./chat-executor');

        const deps = {
            eventBus: mockEventBus,
            keyService: mockKeyService,
            virtualKeyService: {
                resolve: vi.fn(),
            },
            settingsService: mockSettingsService,
            routerService: mockRouterService,
            raceExecutor: undefined,
            cacheService: mockCacheService,
            policyService: {
                checkAgentPolicy: vi.fn(() => ({ allowed: true })),
            },
            freeTierLimits: {},
            promptSecurityService: {
                scan: vi.fn(() => ({ safe: true, score: 0, summary: '' })),
                getConfig: vi.fn(() => ({ enabled: false, blockOnScore: 9 })),
                updateConfig: vi.fn(),
                addEvent: vi.fn(async () => {}),
                getHistory: vi.fn(async () => []),
                clearHistory: vi.fn(async () => {}),
            },
            llmClient: mockLLMClient,
            logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chatService = new ChatExecutor(deps as any, (deps as any).llmClient);
        await chatService.init();
    });

    afterEach(() => {
        if (chatService) chatService.destroy();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function waitForResponse(timeoutMs = 3000): Promise<any> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                try {
                    unsub();
                } catch {
                    /* ignore */
                }
                reject(new Error('Timed out waiting for chat:response'));
            }, timeoutMs);
            const unsub = mockEventBus.on(EVENTS.MESSAGE_RESPONSE, (res: unknown) => {
                clearTimeout(timer);
                unsub();
                resolve(res);
            });
        });
    }

    it('should call getRankedProviders with content strategy when provider is auto', async () => {
        const resPromise = waitForResponse();
        mockEventBus.emit(EVENTS.SEND_MESSAGE, {
            provider: 'auto',
            model: 'gemini-3.1-flash-lite',
            messages: [{ role: 'user', content: 'Hello, how are you?' }],
            requestId: 'test-auto-1',
        });
        const res = await resPromise;
        expect(mockRouterService.getRankedProviders).toHaveBeenCalledWith(
            'content',
            'Hello, how are you?',
            undefined,
            undefined,
            undefined, undefined, undefined, undefined, undefined
        );
        expect(res.provider).toBe('Gemini');
        expect(res.status).toBe('done');
    });

    it('should call getRankedProviders when provider is undefined', async () => {
        const resPromise = waitForResponse();
        mockEventBus.emit(EVENTS.SEND_MESSAGE, {
            model: 'gemini-3.1-flash-lite',
            messages: [{ role: 'user', content: 'Write a poem' }],
            requestId: 'test-undefined-1',
        });
        const res = await resPromise;
        expect(mockRouterService.getRankedProviders).toHaveBeenCalled();
        expect(res.provider).toBe('Gemini');
    });

    it('should pass priority to getRankedProviders', async () => {
        const resPromise = waitForResponse();
        mockEventBus.emit(EVENTS.SEND_MESSAGE, {
            provider: 'auto',
            model: 'gemini-3.1-flash-lite',
            messages: [{ role: 'user', content: 'Urgent request' }],
            requestId: 'test-priority-1',
            priority: 'high',
        });
        await resPromise;
        expect(mockRouterService.getRankedProviders).toHaveBeenCalledWith(
            'content',
            'Urgent request',
            'high',
            undefined,
            undefined, undefined, undefined, undefined, undefined
        );
    });

    it('should use top-ranked provider for routing', async () => {
        const secondKey = { ...mockKeyObj, id: 'key-2', provider: 'Groq' };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mockRouterService.getRankedProviders as any).mockReturnValue([mockKeyObj, secondKey]);
        const resPromise = waitForResponse();
        mockEventBus.emit(EVENTS.SEND_MESSAGE, {
            provider: 'auto',
            model: 'llama-3.3-70b',
            messages: [{ role: 'user', content: 'Test' }],
            requestId: 'test-top-1',
        });
        const res = await resPromise;
        expect(res.provider).toBe('Gemini');
    });

    it('should emit error when getRankedProviders returns empty', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mockRouterService.getRankedProviders as any).mockReturnValue([]);
        const errorPromise = new Promise<{ error?: string }>((resolve) => {
            const unsub = mockEventBus.on(EVENTS.STREAM_ERROR, (res: unknown) => {
                unsub();
                resolve((res ?? {}) as { error?: string });
            });
        });
        mockEventBus.emit(EVENTS.SEND_MESSAGE, {
            provider: 'auto',
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'Hello?' }],
            requestId: 'test-empty-1',
        });
        const res = await errorPromise;
        expect(res.error).toContain('No providers available');
    });

    it('should NOT call getRankedProviders when provider is explicitly set', async () => {
        const resPromise = waitForResponse();
        mockEventBus.emit(EVENTS.SEND_MESSAGE, {
            provider: 'Groq',
            model: 'llama-3.3-70b',
            messages: [{ role: 'user', content: 'Hello' }],
            requestId: 'test-explicit-1',
        });
        await resPromise;
        expect(mockRouterService.getRankedProviders).not.toHaveBeenCalled();
    });

    it('should route to explicitly provided provider without auto-routing', async () => {
        const resPromise = waitForResponse();
        mockEventBus.emit(EVENTS.SEND_MESSAGE, {
            provider: 'OpenRouter',
            model: 'anthropic/claude-3.5-sonnet',
            messages: [{ role: 'user', content: 'Hello' }],
            requestId: 'test-explicit-provider-1',
        });
        const res = await resPromise;
        expect(res.provider).toBe('OpenRouter');
    });

    it('should concatenate all message contents for prompt text', async () => {
        const resPromise = waitForResponse();
        mockEventBus.emit(EVENTS.SEND_MESSAGE, {
            provider: 'auto',
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'Tell me a joke.' },
                { role: 'assistant', content: 'Sure!' },
            ],
            requestId: 'test-concat-1',
        });
        await resPromise;
        expect(mockRouterService.getRankedProviders).toHaveBeenCalledTimes(1);
        const args = mockRouterService.getRankedProviders.mock.calls[0] as unknown as unknown[];
        expect(args[0]).toBe('content');
        expect(args[1] as string).toContain('You are a helpful assistant.');
        expect(args[1] as string).toContain('Tell me a joke.');
        expect(args[1] as string).toContain('Sure!');
    });
});
