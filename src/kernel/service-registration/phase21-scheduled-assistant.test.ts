/**
 * A scheduled task addressed to the assistant must run through the assistant's
 * own brain (knowledge + actions + permission gate), not through the generic
 * director scenario that knows nothing about those actions.
 */
import { describe, it, expect, vi } from 'vitest';
import { InvocationExecutionDelegate } from './invocation-execution-delegate';

function make(
    assistant?: () => { ask(input: { text: string }): Promise<{ content: string }> } | undefined,
    diary?: () => { write(input: Record<string, unknown>): Promise<unknown> } | undefined,
) {
    const repo = { create: vi.fn(async () => ({ id: 'sc-1' })) };
    const director = {
        loadScenario: vi.fn(async () => undefined),
        run: vi.fn(async () => undefined),
    };
    const debate = { startDebate: vi.fn() };
    const delegate = new InvocationExecutionDelegate(
        repo as never,
        director as never,
        debate as never,
        assistant,
        diary,
    );
    return { delegate, repo, director };
}

const assistantAgent = [{ id: 'assistant', role: 'assistant' }] as never;
const coder = [{ id: 'coder', role: 'coder' }] as never;

describe('scheduled assistant tasks', () => {
    it('runs through the assistant brain and records the run in the diary', async () => {
        const ask = vi.fn(async () => ({ content: 'Здоровье в норме' }));
        const write = vi.fn(async () => ({}));
        const { delegate, repo } = make(() => ({ ask }), () => ({ write }));

        const { target, completed } = await delegate.start(
            assistantAgent,
            { type: 'scheduled', ref: 'Проверь здоровье системы' } as never,
            'chat',
            'inv-1',
        );
        await completed;

        expect(target).toEqual({ kind: 'conversation', ref: 'assistant:inv-1' });
        expect(ask).toHaveBeenCalledWith({ text: 'Проверь здоровье системы' });
        expect(write).toHaveBeenCalledWith(
            expect.objectContaining({
                kind: 'action',
                outcome: 'success',
                tags: ['schedule'],
            }),
        );
        const entry = write.mock.calls[0]?.[0] as { text?: string } | undefined;
        expect(entry?.text).toContain('Здоровье в норме');
        // No director scenario: the assistant is not a conversation participant.
        expect(repo.create).not.toHaveBeenCalled();
    });

    it('records a failure and rethrows so the invocation fails honestly', async () => {
        const ask = vi.fn(async () => {
            throw new Error('Ключ не настроен');
        });
        const write = vi.fn(async () => ({}));
        const { delegate } = make(() => ({ ask }), () => ({ write }));

        const { completed } = await delegate.start(
            assistantAgent,
            { type: 'scheduled', ref: 'Проверь здоровье' } as never,
            'chat',
        );

        await expect(completed).rejects.toThrow('Ключ не настроен');
        expect(write).toHaveBeenCalledWith(
            expect.objectContaining({ outcome: 'failure', tags: ['schedule'] }),
        );
    });

    it('keeps other agents on the director path', async () => {
        const { delegate, repo } = make();

        const { completed } = await delegate.start(
            coder,
            { type: 'scheduled', ref: 'Сделай отчёт' } as never,
            'chat',
            'inv-2',
        );
        await completed;

        expect(repo.create).toHaveBeenCalled();
    });

    it('falls back to the director path when the assistant is not registered', async () => {
        const { delegate, repo } = make();

        const { completed } = await delegate.start(
            assistantAgent,
            { type: 'scheduled', ref: 'Проверь здоровье' } as never,
            'chat',
        );
        await completed;

        expect(repo.create).toHaveBeenCalled();
    });
});
