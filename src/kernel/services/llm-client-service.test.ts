import { describe, it, expect, vi } from 'vitest';
import { LLMClientService } from './llm-client-service';
import type {
    IProviderAdapter,
    IAdapterRegistry,
    ProviderRuntimeStatus,
} from '../contracts/provider-adapter';

function mockAdapter(overrides?: Partial<IProviderAdapter>): IProviderAdapter {
    return {
        id: 'mock',
        sendMessage: vi.fn().mockResolvedValue({ content: 'hi', latency: 100, tokens: 10 }),
        streamMessage: undefined,
        checkHealth: vi.fn(),
        getAvailableModels: vi.fn(),
        ...overrides,
    };
}

function mockRuntimeStatus(): ProviderRuntimeStatus {
    return { circuitOpen: false, rateLimited: false };
}

function mockRegistry(adapter?: IProviderAdapter): IAdapterRegistry {
    return {
        getAdapter: vi.fn(() => adapter ?? mockAdapter()),
        hasAdapter: vi.fn(() => true),
        getOrCreateWithFallback: vi.fn(() => adapter ?? mockAdapter()),
        getAllProviders: vi.fn(() => []),
        getProviderRuntimeStatus: vi.fn(() => mockRuntimeStatus()),
        getCircuitBreakerState: vi.fn(() => 'closed' as const),
        resetCircuitBreaker: vi.fn(),
        syncCircuitBreakerState: vi.fn(),
        syncRateLimitState: vi.fn(),
        clearAllCaches: vi.fn(),
    };
}

describe('LLMClientService', () => {
    it('should throw when no provider specified and no default', async () => {
        const registry = mockRegistry();
        const client = new LLMClientService({ resolveApiKey: () => 'sk-test' }, registry);
        await expect(client.chat([{ role: 'user', content: 'hi' }])).rejects.toThrow(
            'No provider specified',
        );
    });

    it('should use default provider and model', async () => {
        const adapter = mockAdapter();
        const registry = mockRegistry(adapter);
        const client = new LLMClientService(
            { resolveApiKey: () => 'sk-test', defaultProvider: 'openai', defaultModel: 'gpt-4' },
            registry,
        );
        const result = await client.chat([{ role: 'user', content: 'hi' }]);
        expect(result.content).toBe('hi');
        expect(adapter.sendMessage).toHaveBeenCalledWith(
            [{ role: 'user', content: 'hi' }],
            'gpt-4',
            'sk-test',
            undefined,
            undefined,
        );
    });

    it('should pass explicit provider and model', async () => {
        const adapter = mockAdapter();
        const registry = mockRegistry(adapter);
        const client = new LLMClientService({ resolveApiKey: () => 'sk-test' }, registry);
        await client.chat([{ role: 'user', content: 'hi' }], {
            provider: 'gemini',
            model: 'gemini-pro',
        });
        expect(registry.getAdapter).toHaveBeenCalledWith('gemini');
        expect(adapter.sendMessage).toHaveBeenCalledWith(
            [{ role: 'user', content: 'hi' }],
            'gemini-pro',
            'sk-test',
            undefined,
            undefined,
        );
    });

    it('should throw when adapter not found', async () => {
        const registry = mockRegistry();
        vi.mocked(registry.getAdapter).mockReturnValue(undefined);
        const client = new LLMClientService(
            { resolveApiKey: () => 'sk-test', defaultProvider: 'unknown' },
            registry,
        );
        await expect(client.chat([{ role: 'user', content: 'hi' }])).rejects.toThrow(
            'No adapter found',
        );
    });

    it('should throw when no API key', async () => {
        const client = new LLMClientService({ resolveApiKey: () => '' }, mockRegistry());
        await expect(
            client.chat([{ role: 'user', content: 'hi' }], { provider: 'openai' }),
        ).rejects.toThrow('No API key');
    });

    it('should use apiKeyOverride when provided', async () => {
        const adapter = mockAdapter();
        const registry = mockRegistry(adapter);
        const client = new LLMClientService({ resolveApiKey: () => 'sk-from-pool' }, registry);
        await client.chat([{ role: 'user', content: 'hi' }], {
            provider: 'openai',
            apiKeyOverride: 'sk-override',
        });
        expect(adapter.sendMessage).toHaveBeenCalledWith(
            expect.any(Array),
            'auto',
            'sk-override',
            undefined,
            undefined,
        );
    });

    it('should pass temperature and maxTokens as SendMessageOptions', async () => {
        const adapter = mockAdapter();
        const registry = mockRegistry(adapter);
        const client = new LLMClientService({ resolveApiKey: () => 'sk-test' }, registry);
        await client.chat([{ role: 'user', content: 'hi' }], {
            provider: 'openai',
            temperature: 0.5,
            maxTokens: 500,
        });
        expect(adapter.sendMessage).toHaveBeenCalledWith(
            expect.any(Array),
            'auto',
            'sk-test',
            undefined,
            { temperature: 0.5, maxOutputTokens: 500 },
        );
    });

    it('should stream via streamMessage when adapter supports it', async () => {
        const onChunk = vi.fn();
        const streamMock = vi.fn(
            async (_msgs: unknown[], _model: string, _key: string, cb: (chunk: string) => void) => {
                cb('Hel');
                cb('Lo');
            },
        );
        const adapter = mockAdapter({ streamMessage: streamMock });
        const client = new LLMClientService(
            { resolveApiKey: () => 'sk-test', defaultProvider: 'openai' },
            mockRegistry(adapter),
        );
        const result = await client.chat([{ role: 'user', content: 'hi' }], { onChunk });
        expect(streamMock).toHaveBeenCalled();
        expect(onChunk).toHaveBeenCalledTimes(2);
        expect(onChunk).toHaveBeenNthCalledWith(1, 'Hel', undefined);
        expect(onChunk).toHaveBeenNthCalledWith(2, 'Lo', undefined);
        expect(result.content).toBe('HelLo');
    });

    it('should pass priority through adapterOptions', async () => {
        const adapter = mockAdapter();
        const registry = mockRegistry(adapter);
        const client = new LLMClientService(
            { resolveApiKey: () => 'sk-test', defaultProvider: 'openai' },
            registry,
        );
        await client.chat([{ role: 'user', content: 'urgent' }], { priority: 'high' });
        expect(adapter.sendMessage).toHaveBeenCalledWith(
            expect.any(Array),
            'auto',
            'sk-test',
            undefined,
            { priority: 'high' },
        );
    });

    it('should forward tool role messages to adapter', async () => {
        const adapter = mockAdapter();
        const registry = mockRegistry(adapter);
        const client = new LLMClientService({ resolveApiKey: () => 'sk-test' }, registry);
        await client.chat(
            [
                { role: 'user', content: 'what is the weather?' },
                {
                    role: 'assistant',
                    content: '',
                    toolCalls: [
                        {
                            id: '1',
                            type: 'function',
                            function: { name: 'get_weather', arguments: '{}' },
                        },
                    ],
                },
                { role: 'tool', name: 'get_weather', toolCallId: '1', content: 'sunny' },
            ],
            { provider: 'openai' },
        );
        expect(adapter.sendMessage).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ role: 'tool', toolCallId: '1', content: 'sunny' }),
            ]),
            'auto',
            'sk-test',
            undefined,
            undefined,
        );
    });

    it('should forward toolCalls in response', async () => {
        const toolCalls = [
            { id: '1', type: 'function' as const, function: { name: 'test', arguments: '{}' } },
        ];
        const adapter = mockAdapter({
            sendMessage: vi.fn().mockResolvedValue({
                content: '',
                latency: 100,
                tokens: 5,
                toolCalls,
                finishReason: 'TOOL_CALLS',
            }),
        });
        const registry = mockRegistry(adapter);
        const client = new LLMClientService({ resolveApiKey: () => 'sk-test' }, registry);
        const result = await client.chat([{ role: 'user', content: 'hi' }], { provider: 'openai' });
        expect(result.toolCalls).toEqual(toolCalls);
        expect(result.finishReason).toBe('TOOL_CALLS');
    });

    describe('sendMessage alias', () => {
        it('should return simplified response shape', async () => {
            const adapter = mockAdapter({
                sendMessage: vi.fn().mockResolvedValue({
                    content: 'hello',
                    latency: 50,
                    tokens: 5,
                    finishReason: 'STOP',
                }),
            });
            const registry = mockRegistry(adapter);
            const client = new LLMClientService({ resolveApiKey: () => 'sk-test' }, registry);
            const result = await client.sendMessage([{ role: 'user', content: 'hi' }], {
                provider: 'openai',
            });
            expect(result.content).toBe('hello');
            expect(result.tokens).toBe(5);
            expect(result.finishReason).toBe('STOP');
        });

        it('should forward temperature and maxTokens', async () => {
            const adapter = mockAdapter();
            const registry = mockRegistry(adapter);
            const client = new LLMClientService({ resolveApiKey: () => 'sk-test' }, registry);
            await client.sendMessage([{ role: 'user', content: 'hi' }], {
                provider: 'openai',
                temperature: 0.3,
                maxTokens: 100,
            });
            expect(adapter.sendMessage).toHaveBeenCalledWith(
                expect.any(Array),
                'auto',
                'sk-test',
                undefined,
                { temperature: 0.3, maxOutputTokens: 100 },
            );
        });
    });
});
