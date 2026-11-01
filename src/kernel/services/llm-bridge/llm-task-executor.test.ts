import { describe, expect, it, vi } from 'vitest';
import {
    LlmCouncilPort,
    LlmCrewExecutor,
    LlmFrontierExecutor,
    LlmGraphPort,
    LlmPersonaPort,
    type LlmBridgeOptions,
} from './llm-task-executor';

function makeClient(overrides: { content?: string; error?: string; throwIt?: boolean } = {}) {
    return {
        chat: vi.fn(async () => {
            if (overrides.throwIt) throw new Error('llm down');
            return { content: overrides.content ?? 'ok', error: overrides.error };
        }),
    } as unknown as LlmBridgeOptions['client'];
}

function makeOpts(
    client: LlmBridgeOptions['client'],
    extra: Partial<LlmBridgeOptions> = {},
): LlmBridgeOptions {
    return { client, defaultModel: 'm', ...extra };
}

const crewInput = {
    crew: { id: 'c1', name: 'Crew' },
    task: { id: 't1', description: 'Research X', expectedOutput: 'summary' },
    role: { id: 'r1', name: 'Analyst', role: 'analyst', goal: 'analyze', backstory: 'expert' },
    context: 'ctx',
};

describe('LlmCrewExecutor', () => {
    it('вызывает LLM и возвращает контент', async () => {
        const client = makeClient({ content: 'done' });
        const exec = new LlmCrewExecutor(makeOpts(client));
        await expect(exec.execute(crewInput)).resolves.toBe('done');
        expect(client.chat).toHaveBeenCalledTimes(1);
    });

    it('пробрасывает ошибку LLM (без echo-fallback)', async () => {
        const client = makeClient({ throwIt: true });
        const exec = new LlmCrewExecutor(makeOpts(client));
        await expect(exec.execute(crewInput)).rejects.toThrow('llm down');
    });

    it('echo-fallback при недоступности LLM', async () => {
        const client = makeClient({ throwIt: true });
        const exec = new LlmCrewExecutor(makeOpts(client, { echoFallback: true }));
        const out = await exec.execute(crewInput);
        expect(out).toContain('[echo fallback]');
    });
});

describe('LlmCouncilPort', () => {
    it('draftStance возвращает контент', async () => {
        const client = makeClient({ content: 'stance' });
        const port = new LlmCouncilPort(makeOpts(client));
        await expect(
            port.draftStance({ topic: 'X', participant: { id: 'p', name: 'P', kind: 'pro' } }),
        ).resolves.toBe('stance');
    });

    it('judgeRound парсит JSON и возвращает winner', async () => {
        const client = makeClient({
            content: '{"winnerId":"p1","scores":{"p1":8},"rationale":"good"}',
        });
        const port = new LlmCouncilPort(makeOpts(client));
        const res = await port.judgeRound({
            topic: 'X',
            messages: [{ authorId: 'p1', body: 'a' }],
            judgeName: 'J',
            dimensions: ['clarity'],
        });
        expect(res.winnerId).toBe('p1');
        expect(res.scores).toEqual({ p1: 8 });
    });

    it('judgeRound при битом JSON возвращает draw', async () => {
        const client = makeClient({ content: 'not json' });
        const port = new LlmCouncilPort(makeOpts(client));
        const res = await port.judgeRound({
            topic: 'X',
            messages: [],
            judgeName: 'J',
            dimensions: ['clarity'],
        });
        expect(res.winnerId).toBe('draw');
    });
});

describe('LlmGraphPort', () => {
    it('runTask вызывает LLM', async () => {
        const client = makeClient({ content: 'step' });
        const port = new LlmGraphPort(makeOpts(client));
        await expect(port.runTask({ label: 'L', state: {} })).resolves.toBe('step');
    });

    it('reflect вызывает LLM', async () => {
        const client = makeClient({ content: 'reflection' });
        const port = new LlmGraphPort(makeOpts(client));
        await expect(port.reflect({ visited: ['a'], state: {} })).resolves.toBe('reflection');
    });
});

describe('LlmFrontierExecutor', () => {
    it('execute возвращает контент', async () => {
        const client = makeClient({ content: 'answer' });
        const exec = new LlmFrontierExecutor(makeOpts(client));
        await expect(exec.execute('task')).resolves.toBe('answer');
    });
});

describe('LlmPersonaPort', () => {
    it('distillStyle парсит JSON', async () => {
        const client = makeClient({
            content: '{"styleNotes":["formal"],"judgments":["clear"]}',
        });
        const port = new LlmPersonaPort(makeOpts(client));
        const res = await port.distillStyle(['sample text']);
        expect(res.styleNotes).toEqual(['formal']);
        expect(res.judgments).toEqual(['clear']);
    });

    it('distillStyle при битом JSON возвращает heuristic split', async () => {
        const client = makeClient({ content: 'line1\nline2' });
        const port = new LlmPersonaPort(makeOpts(client));
        const res = await port.distillStyle(['sample']);
        expect(res.styleNotes).toContain('line1');
    });

    it('summarizeMemories возвращает компактный профиль', async () => {
        const client = makeClient({ content: 'profile' });
        const port = new LlmPersonaPort(makeOpts(client));
        await expect(port.summarizeMemories([{ tier: 'stable', content: 'fact' }])).resolves.toBe(
            'profile',
        );
    });

    it('summarizeMemories без памяти возвращает заглушку', async () => {
        const port = new LlmPersonaPort(makeOpts(makeClient()));
        await expect(port.summarizeMemories([])).resolves.toBe('No long-term memories.');
    });
});
