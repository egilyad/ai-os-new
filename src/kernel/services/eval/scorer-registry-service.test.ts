/**
 * ScorerRegistry + LlmJudge static test (G8) — no LLM required.
 * Verifies: builtins, custom scorer, llm judge stub PROVIDER-PENDING.
 */

import { describe, it, expect } from 'vitest';
import { ScorerRegistryService } from './scorer-registry-service';
import { LlmJudgeService } from './llm-judge-service';

function fakeBus() {
    return { emit: () => {}, on: () => () => {}, off: () => {} } as unknown as import('../../types/interfaces').IEventBus;
}

describe('G8 ScorerRegistry + LlmJudge (static)', () => {
    it('builtins contains/exact/token_f1', async () => {
        const reg = new ScorerRegistryService(fakeBus());
        await reg.init();
        expect(reg.list()).toEqual(expect.arrayContaining(['contains','exact','token_f1']));
        const c1: import('../../types/frontier-types').Benchmark['cases'][number] = { id: 'c1', task: 't', expectContains: 'hello', maxScore: 10 };
        expect((await reg.score(c1, 'hello world')).passed).toBe(true);
        expect((await reg.score({ ...c1, expectContains: 'bye' }, 'hello world')).passed).toBe(false);
        expect((await reg.score({ ...c1, metric: 'exact', reference: 'hello' } as unknown as import('../../types/frontier-types').Benchmark['cases'][number], 'hello')).passed).toBe(true);
        expect((await reg.score({ ...c1, metric: 'token_f1', reference: 'cats dogs' } as unknown as import('../../types/frontier-types').Benchmark['cases'][number], 'cats love dogs')).score).toBeGreaterThan(0.5);
        await reg.destroy();
    });

    it('custom scorer registry', async () => {
        const reg = new ScorerRegistryService(fakeBus());
        await reg.init();
        reg.register('always_zero', () => ({ score: 0, passed: false }));
        expect(reg.has('always_zero')).toBe(true);
        const c: import('../../types/frontier-types').Benchmark['cases'][number] = { id: 'c1', task: 't', maxScore: 10 };
        const r = await reg.score(c as unknown as import('../../types/frontier-types').Benchmark['cases'][number], 'anything', 'always_zero');
        expect(r.score).toBe(0);
        await reg.destroy();
    });

    it('LlmJudge stub PROVIDER-PENDING when no LLM', async () => {
        const judge = new LlmJudgeService({ events: fakeBus() });
        await judge.init();
        const r = await judge.judge('summarize cats', 'cats dogs birds', 'cats dogs');
        expect(r.via).toBe('stub');
        expect(r.reasoning).toContain('PROVIDER-PENDING');
        expect(r.score).toBeGreaterThan(0);
        await judge.destroy();
    });

    it('LlmJudge with fake LLM via=llm', async () => {
        const fakeLlm = {
            chat: async () => ({ content: '{"score":0.9,"passed":true,"reasoning":"great"}', error: undefined, toolCalls: [] }),
        } as unknown as import('../../contracts/provider-adapter').ILLMClientService;
        const judge = new LlmJudgeService({ events: fakeBus(), llm: fakeLlm });
        await judge.init();
        const r = await judge.judge('task', 'output', 'reference');
        expect(r.via).toBe('llm');
        expect(r.score).toBe(0.9);
        await judge.destroy();
    });

    it('LlmJudge malformed LLM JSON → fallback stub via llm', async () => {
        const fakeLlm = {
            chat: async () => ({ content: 'not json', error: undefined, toolCalls: [] }),
        } as unknown as import('../../contracts/provider-adapter').ILLMClientService;
        const judge = new LlmJudgeService({ events: fakeBus(), llm: fakeLlm });
        await judge.init();
        const r = await judge.judge('t', 'hi cats', 'cats');
        expect(r.via).toBe('llm');
        expect(r.reasoning).toContain('fallback');
        await judge.destroy();
    });
});
