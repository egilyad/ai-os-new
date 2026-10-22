import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheDecorator } from './cache-decorator';
import type { ChatMessage, ProviderResponse, LLMProviderAdapter } from '../core/types';

describe('CacheDecorator - Semantic Caching', () => {
    const mockResponse: ProviderResponse = {
        content: 'Paris',
        latency: 100,
        tokens: 15,
    };

    let innerAdapter: LLMProviderAdapter;

    beforeEach(() => {
        innerAdapter = {
            id: 'test-adapter',
            sendMessage: vi.fn(async () => mockResponse),
            checkHealth: async () => ({
                status: 'active' as const,
                latency: 50,
                models: ['gpt-4'],
            }),
            getAvailableModels: async () => ['gpt-4'],
        };
    });

    // ── getSimilarityScore diagnostics ───────────────────────────────────

    it('getSimilarityScore: identical texts have similarity = 1', () => {
        const d = new CacheDecorator(innerAdapter, 10000, 5, 0);
        const score = d.getSimilarityScore(
            'What is the capital of France?',
            'What is the capital of France?',
        );
        expect(score).toBeCloseTo(1.0, 5);
    });

    it('getSimilarityScore: very similar texts have high similarity (> 0.7)', () => {
        const d = new CacheDecorator(innerAdapter, 10000, 5, 0);
        const score = d.getSimilarityScore(
            'What is the capital city of France?',
            'What is the capital of France?',
        );
        expect(score).toBeGreaterThan(0.7);
    });

    it('getSimilarityScore: unrelated texts have low similarity (< 0.4)', () => {
        const d = new CacheDecorator(innerAdapter, 10000, 5, 0);
        const score = d.getSimilarityScore(
            'What is the capital of France?',
            'How is the weather today in Berlin?',
        );
        expect(score).toBeLessThan(0.4);
    });

    // ── Exact hash cache (threshold = 0) ─────────────────────────────────

    it('should cache and return exact match (semantic disabled)', async () => {
        const d = new CacheDecorator(innerAdapter, 10000, 5, 0);
        const msgs: ChatMessage[] = [{ role: 'user', content: 'What is the capital of France?' }];

        const r1 = await d.sendMessage(msgs, 'gpt-4', 'key-1');
        const r2 = await d.sendMessage(msgs, 'gpt-4', 'key-1');

        expect(r1.content).toBe('Paris');
        expect(r2.content).toBe('Paris');
        expect(innerAdapter.sendMessage).toHaveBeenCalledTimes(1);
    });

    // ── Semantic cache (threshold > 0) ───────────────────────────────────

    it('should return semantic match when similarity exceeds threshold', async () => {
        const d = new CacheDecorator(innerAdapter, 10000, 5, 0.7);

        // Pre-compute the score to confirm the test is valid
        const score = d.getSimilarityScore(
            'What is the capital city of France?',
            'What is the capital of France?',
        );
        expect(score).toBeGreaterThan(0.7); // guard: validates our threshold is reachable

        const msgs1: ChatMessage[] = [
            { role: 'user', content: 'What is the capital city of France?' },
        ];
        await d.sendMessage(msgs1, 'gpt-4', 'key-1');

        const msgs2: ChatMessage[] = [{ role: 'user', content: 'What is the capital of France?' }];
        const res = await d.sendMessage(msgs2, 'gpt-4', 'key-1');

        expect(res.content).toBe('Paris');
        expect(innerAdapter.sendMessage).toHaveBeenCalledTimes(1); // semantic HIT
    });

    it('should NOT match when similarity is below threshold', async () => {
        const d = new CacheDecorator(innerAdapter, 10000, 5, 0.8);

        const msgs1: ChatMessage[] = [{ role: 'user', content: 'What is the capital of France?' }];
        await d.sendMessage(msgs1, 'gpt-4', 'key-1');

        const msgs2: ChatMessage[] = [
            { role: 'user', content: 'How is the weather today in Berlin?' },
        ];
        await d.sendMessage(msgs2, 'gpt-4', 'key-1');

        expect(innerAdapter.sendMessage).toHaveBeenCalledTimes(2); // MISS
    });

    // ── LRU eviction ─────────────────────────────────────────────────────

    it('should evict oldest entry when maxEntries is exceeded', async () => {
        const d = new CacheDecorator(innerAdapter, 10000, 2, 0); // semantic off

        await d.sendMessage([{ role: 'user', content: 'question one' }], 'gpt-4', 'key-1');
        await d.sendMessage([{ role: 'user', content: 'question two' }], 'gpt-4', 'key-1');
        await d.sendMessage([{ role: 'user', content: 'question three' }], 'gpt-4', 'key-1'); // evicts q1

        // q1 must be re-fetched (evicted)
        await d.sendMessage([{ role: 'user', content: 'question one' }], 'gpt-4', 'key-1');
        expect(innerAdapter.sendMessage).toHaveBeenCalledTimes(4);
    });

    // ── B-20: cacheScope isolation ─────────────────────────────────────────

    it('B-20: exact cache key differs by cacheScope (no cross-agent contamination)', async () => {
        const d = new CacheDecorator(innerAdapter, 10000, 5, 0); // semantic off
        const msgs: ChatMessage[] = [{ role: 'user', content: 'What is your opening statement?' }];

        const a = await d.sendMessage(msgs, 'gpt-4', 'key-1', undefined, {
            cacheScope: { agentId: 'agent-A', sessionId: 's1' },
        });
        const b = await d.sendMessage(msgs, 'gpt-4', 'key-1', undefined, {
            cacheScope: { agentId: 'agent-B', sessionId: 's1' },
        });

        expect(a.content).toBe('Paris');
        expect(b.content).toBe('Paris');
        // Two distinct agents -> two distinct cache entries -> inner called twice.
        expect(innerAdapter.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('B-20: semantic cache bucket differs by cacheScope', async () => {
        const d = new CacheDecorator(innerAdapter, 10000, 5, 0.7);
        const msgs1: ChatMessage[] = [{ role: 'user', content: 'What is the capital of France?' }];
        const msgs2: ChatMessage[] = [
            { role: 'user', content: 'What is the capital city of France?' },
        ];

        await d.sendMessage(msgs1, 'gpt-4', 'key-1', undefined, {
            cacheScope: { agentId: 'agent-A', sessionId: 's1' },
        });
        // Same near-duplicate prompt but a DIFFERENT agent -> must NOT share the cached answer.
        const res = await d.sendMessage(msgs2, 'gpt-4', 'key-1', undefined, {
            cacheScope: { agentId: 'agent-B', sessionId: 's1' },
        });

        expect(res.content).toBe('Paris');
        expect(innerAdapter.sendMessage).toHaveBeenCalledTimes(2); // scoped MISS
    });

    // Tool turns are state, not a repeatable question. Caching them silently
    // ended the assistant loop: the follow-up replayed an empty cached answer
    // and the tool calls were lost.

    it('does not cache a streamed turn that answered with tool calls', async () => {
        const stream = vi.fn(
            async (
                _m: ChatMessage[],
                _model: string,
                _key: string,
                onChunk: (chunk: string, meta?: unknown) => void,
            ) => {
                onChunk('', {
                    toolCalls: [
                        {
                            id: 'c1',
                            type: 'function',
                            function: { name: 'agents.list', arguments: '{}' },
                        },
                    ],
                });
            },
        );
        innerAdapter.streamMessage = stream;
        const d = new CacheDecorator(innerAdapter, 10000, 5, 0);
        const msgs: ChatMessage[] = [
            { role: 'system', content: 's' },
            { role: 'user', content: 'кто есть в системе?' },
        ];

        await d.streamMessage(msgs, 'gpt-4', 'key-1', () => undefined);
        await d.streamMessage(msgs, 'gpt-4', 'key-1', () => undefined);

        expect(stream).toHaveBeenCalledTimes(2);
    });

    it('never replays the semantic cache into a tool continuation', async () => {
        const stream = vi.fn(
            async (
                messages: ChatMessage[],
                _model: string,
                _key: string,
                onChunk: (chunk: string, meta?: unknown) => void,
            ) => {
                const toolTurn = messages.some((m) => m.role === 'tool');
                onChunk(toolTurn ? 'Панель памяти открыта.' : 'Это панель памяти.');
            },
        );
        innerAdapter.streamMessage = stream;
        const d = new CacheDecorator(innerAdapter, 10000, 5, 0.5);
        const question: ChatMessage[] = [
            { role: 'system', content: 's' },
            { role: 'user', content: 'где панель памяти?' },
        ];
        await d.streamMessage(question, 'gpt-4', 'key-1', () => undefined);

        const followUp: ChatMessage[] = [
            ...question,
            {
                role: 'assistant',
                content: '',
                toolCalls: [
                    {
                        id: 'c1',
                        type: 'function',
                        function: { name: 'ui.openPanel', arguments: '{}' },
                    },
                ],
            },
            { role: 'tool', content: 'OK', toolCallId: 'c1' },
        ];
        const chunks: string[] = [];
        await d.streamMessage(followUp, 'gpt-4', 'key-1', (chunk) => chunks.push(chunk));

        expect(stream).toHaveBeenCalledTimes(2);
        expect(chunks.join('')).toContain('Панель памяти открыта');
    });
});
