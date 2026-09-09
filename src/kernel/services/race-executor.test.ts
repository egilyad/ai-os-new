import { describe, it, expect, vi } from 'vitest';
import type { ChatMessage, ProviderResponse } from '../types/llm-types';

import { RaceExecutor } from './race-executor';
import type { IAdapterRegistry } from '../contracts/provider-adapter';

function makeResponse(overrides: Partial<ProviderResponse> = {}): ProviderResponse {
    return { content: 'response', latency: 0, tokens: 10, finishReason: 'STOP', ...overrides };
}

function makeAdapter(sendMessage?: ReturnType<typeof vi.fn>) {
    return { sendMessage: sendMessage ?? vi.fn().mockResolvedValue(makeResponse()) };
}

function makeRegistry(
    adapters: Record<string, ReturnType<typeof makeAdapter>> = {},
): IAdapterRegistry {
    return {
        getAdapter: vi.fn().mockImplementation((p: string) => adapters[p] ?? null),
    } as unknown as IAdapterRegistry;
}

describe('RaceExecutor', () => {
    const msgs: ChatMessage[] = [{ role: 'user' as const, content: 'hi' }];
    const keyResolver = () => 'sk-xxx';

    describe('constructor and destroy', () => {
        it('should construct', () => {
            expect(new RaceExecutor(makeRegistry())).toBeInstanceOf(RaceExecutor);
        });

        it('should be safe to destroy', () => {
            expect(() => new RaceExecutor(makeRegistry()).destroy()).not.toThrow();
        });
    });

    describe('race', () => {
        it('returns first successful response', async () => {
            const e = new RaceExecutor(makeRegistry({ p: makeAdapter() }));
            const r = await e.race(msgs, [{ provider: 'p', model: 'm', keyId: 'k' }], {
                keyResolver,
            });
            expect(r.winner.provider).toBe('p');
            expect(r.failures).toHaveLength(0);
        });

        it('rejects if no adapter for provider', async () => {
            const e = new RaceExecutor(makeRegistry({}));
            await expect(
                e.race(msgs, [{ provider: 'x', model: 'm', keyId: 'k' }], {
                    keyResolver,
                    timeoutMs: 50,
                }),
            ).rejects.toThrow('No adapter for x');
        });

        it('rejects if no API key resolved', async () => {
            const e = new RaceExecutor(makeRegistry({ p: makeAdapter() }));
            await expect(
                e.race(msgs, [{ provider: 'p', model: 'm', keyId: 'k' }], {
                    keyResolver: () => undefined,
                    timeoutMs: 50,
                }),
            ).rejects.toThrow('No API key resolved');
        });

        it('returns winner from multiple candidates (fastest wins)', async () => {
            const slow = makeAdapter(vi.fn().mockImplementation(() => new Promise(() => {})));
            const fast = makeAdapter(vi.fn().mockResolvedValue(makeResponse({ content: 'fast' })));
            const e = new RaceExecutor(makeRegistry({ slow, fast }));
            const r = await e.race(
                msgs,
                [
                    { provider: 'slow', model: 'm', keyId: 'k1' },
                    { provider: 'fast', model: 'm', keyId: 'k2' },
                ],
                { keyResolver },
            );
            expect(r.winner.provider).toBe('fast');
        });

        it('reports failures for losers', async () => {
            const fail = makeAdapter(vi.fn().mockRejectedValue(new Error('err')));
            const win = makeAdapter(vi.fn().mockResolvedValue(makeResponse()));
            const e = new RaceExecutor(makeRegistry({ fail, win }));
            const r = await e.race(
                msgs,
                [
                    { provider: 'fail', model: 'm', keyId: 'k1' },
                    { provider: 'win', model: 'm', keyId: 'k2' },
                ],
                { keyResolver },
            );
            expect(r.failures).toHaveLength(1);
            expect(r.failures[0].candidate.provider).toBe('fail');
        });

        it('aborts loser controllers when winner found', async () => {
            let abortCalled = false;
            const loser = makeAdapter(
                vi
                    .fn()
                    .mockImplementation(
                        (_: unknown, __: unknown, ___: unknown, signal: AbortSignal) => {
                            signal.addEventListener('abort', () => {
                                abortCalled = true;
                            });
                            return new Promise(() => {});
                        },
                    ),
            );
            const win = makeAdapter(vi.fn().mockResolvedValue(makeResponse()));
            const e = new RaceExecutor(makeRegistry({ loser, win }));
            await e.race(
                msgs,
                [
                    { provider: 'loser', model: 'm', keyId: 'k1' },
                    { provider: 'win', model: 'm', keyId: 'k2' },
                ],
                { keyResolver },
            );
            expect(abortCalled).toBe(true);
        });

        it('handles parent abort signal (all pending → all candidates failed)', async () => {
            const p = makeAdapter(vi.fn().mockImplementation(() => new Promise(() => {})));
            const e = new RaceExecutor(makeRegistry({ p }));
            const parent = new AbortController();
            const race = e.race(msgs, [{ provider: 'p', model: 'm', keyId: 'k' }], {
                signal: parent.signal,
                keyResolver,
                timeoutMs: 5000,
            });
            parent.abort();
            await expect(race).rejects.toThrow('All race candidates failed');
        });

        it('rejects with timeout error when candidates never resolve', async () => {
            const p = makeAdapter(vi.fn().mockImplementation(() => new Promise(() => {})));
            const e = new RaceExecutor(makeRegistry({ p }));
            await expect(
                e.race(msgs, [{ provider: 'p', model: 'm', keyId: 'k' }], {
                    timeoutMs: 10,
                    keyResolver,
                }),
            ).rejects.toThrow('All race candidates failed');
        });

        it('throws when all candidates fail', async () => {
            const a = makeAdapter(vi.fn().mockRejectedValue(new Error('A fail')));
            const b = makeAdapter(vi.fn().mockRejectedValue(new Error('B fail')));
            const e = new RaceExecutor(makeRegistry({ a, b }));
            await expect(
                e.race(
                    msgs,
                    [
                        { provider: 'a', model: 'm', keyId: 'k1' },
                        { provider: 'b', model: 'm', keyId: 'k2' },
                    ],
                    { keyResolver, timeoutMs: 50 },
                ),
            ).rejects.toThrow('All race candidates failed');
        });

        it('strips tool messages before sending to adapter', async () => {
            const a = makeAdapter();
            const e = new RaceExecutor(makeRegistry({ p: a }));
            const messages: ChatMessage[] = [
                { role: 'user' as const, content: 'hi' },
                { role: 'tool' as const, content: 'result' },
            ];
            await e.race(messages, [{ provider: 'p', model: 'm', keyId: 'k' }], { keyResolver });
            const sent = a.sendMessage.mock.calls[0][0];
            expect(sent).toHaveLength(1);
            expect(sent[0].role).toBe('user');
        });

        it('records latency on the response', async () => {
            const a = makeAdapter(
                vi
                    .fn()
                    .mockImplementation(
                        () => new Promise((r) => setTimeout(() => r(makeResponse()), 20)),
                    ),
            );
            const e = new RaceExecutor(makeRegistry({ p: a }));
            const r = await e.race(msgs, [{ provider: 'p', model: 'm', keyId: 'k' }], {
                keyResolver,
            });
            expect(r.latency).toBeGreaterThanOrEqual(20);
        });
    });
});
