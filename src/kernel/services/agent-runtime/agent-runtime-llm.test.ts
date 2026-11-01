import { describe, expect, it, vi } from 'vitest';
import { createAgentCallLlm } from './agent-runtime-llm';

describe('createAgentCallLlm', () => {
    it('вызывает адаптер с ключом и моделью', async () => {
        const sendMessage = vi.fn(async () => ({ content: 'hi' }));
        const callLlm = createAgentCallLlm({
            adapterRegistry: {
                getAdapter: (p) => (p === 'openrouter' ? ({ sendMessage } as never) : undefined),
            },
            keyService: {
                getKeys: () => [{ provider: 'openrouter', key: 'k', status: 'active' }],
            },
        });
        const res = await callLlm([{ role: 'user', content: 'x' }], []);
        expect(res.content).toBe('hi');
        expect(sendMessage).toHaveBeenCalledWith(
            expect.any(Array),
            expect.any(String),
            'k',
            undefined,
            expect.objectContaining({ temperature: 0.7 }),
        );
    });

    it('без ключа возвращает текст', async () => {
        const callLlm = createAgentCallLlm({
            adapterRegistry: { getAdapter: () => undefined },
            keyService: { getKeys: () => [] },
        });
        const res = await callLlm([], []);
        expect(res.content).toContain('No LLM key');
    });

    it('без адаптера возвращает текст', async () => {
        const callLlm = createAgentCallLlm({
            adapterRegistry: { getAdapter: () => undefined },
            keyService: {
                getKeys: () => [{ provider: 'unknown', key: 'k', status: 'active' }],
            },
        });
        const res = await callLlm([], []);
        expect(res.content).toContain('No adapter');
    });

    it('при ошибке адаптера возвращает текст вместо throw', async () => {
        const callLlm = createAgentCallLlm({
            adapterRegistry: {
                getAdapter: () =>
                    ({
                        sendMessage: async () => {
                            throw new Error('boom');
                        },
                    } as never),
            },
            keyService: {
                getKeys: () => [{ provider: 'openrouter', key: 'k', status: 'active' }],
            },
        });
        const res = await callLlm([], []);
        expect(res.content).toContain('boom');
    });
});
