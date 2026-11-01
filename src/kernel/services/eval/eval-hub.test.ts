import { describe, expect, it, vi } from 'vitest';
import { EvalHub } from './eval-hub';
import type { EvalCase } from '../../contracts/eval-hub';

describe('EvalHub (SPEC_04)', () => {
    const basicCase: EvalCase = {
        id: 'c1',
        name: 'simple',
        prompt: 'Say hello',
        expected: 'hello world',
        metrics: ['task_completion'],
    };

    it('прогоняет кейс и возвращает отчёт', async () => {
        const deps = {
            runPrompt: vi.fn(async () => ({ output: 'hello world', latencyMs: 12 })),
        };
        const hub = new EvalHub(deps);
        const report = await hub.run([basicCase]);
        expect(report.summary.total).toBe(1);
        expect(report.summary.passed).toBe(1);
        expect(report.results[0].score).toBeGreaterThanOrEqual(0.5);
        expect(report.results[0].latencyMs).toBe(12);
    });

    it('учитывает repeat: берёт лучший скор', async () => {
        const outputs = ['bad', 'hello world'];
        const runPrompt = vi.fn(async () => ({ output: outputs.shift()!, latencyMs: 5 }));
        const hub = new EvalHub({ runPrompt });
        const report = await hub.run([{ ...basicCase, repeat: 2 }]);
        expect(runPrompt).toHaveBeenCalledTimes(2);
        expect(report.results[0].passed).toBe(true);
    });

    it('использует llm_rubric через judgeLLM, когда задан', async () => {
        const judgeLLM = vi.fn(async (output: string, rubric: string) => {
            expect(rubric).toBe('coherence');
            return { score: output.includes('good') ? 0.9 : 0.2, passed: output.includes('good') };
        });
        const deps = {
            runPrompt: vi.fn(async () => ({ output: 'good answer', latencyMs: 1 })),
            judgeLLM,
        };
        const hub = new EvalHub(deps);
        const report = await hub.run([
            { id: 'r1', name: 'rubric', prompt: 'x', rubric: 'coherence', metrics: ['llm_rubric'] },
        ]);
        expect(report.results[0].metrics['llm_rubric']).toBe(0.9);
        expect(report.results[0].passed).toBe(true);
    });

    it('ошибка прогона → failed с error', async () => {
        const hub = new EvalHub({
            runPrompt: async () => {
                throw new Error('provider down');
            },
        });
        const report = await hub.run([basicCase]);
        expect(report.results[0].passed).toBe(false);
        expect(report.results[0].error).toBe('provider down');
    });

    it('лимit latency → failed', async () => {
        const hub = new EvalHub({
            runPrompt: async () => ({ output: 'hello world', latencyMs: 500 }),
        });
        const report = await hub.run([{ ...basicCase, thresholds: { latencyMaxMs: 100 } }]);
        expect(report.results[0].passed).toBe(false);
    });

    it('учитывает стоимость в итоге', async () => {
        const hub = new EvalHub({
            runPrompt: async () => ({ output: 'hello world', latencyMs: 5, costUsd: 0.02 }),
        });
        const report = await hub.run([basicCase, basicCase]);
        expect(report.summary.totalCost).toBeCloseTo(0.04, 3);
        expect(report.results[0].costUsd).toBeCloseTo(0.02, 3);
    });

    it('порог стоимости → failed', async () => {
        const hub = new EvalHub({
            runPrompt: async () => ({ output: 'hello world', latencyMs: 5, costUsd: 1.0 }),
        });
        const report = await hub.run([{ ...basicCase, thresholds: { costMaxUsd: 0.5 } }]);
        expect(report.results[0].passed).toBe(false);
    });

    it('записывает результаты в metrics', async () => {
        const metrics = {
            inc: vi.fn(),
            record: vi.fn(),
        };
        const hub = new EvalHub({
            runPrompt: async () => ({ output: 'hello world', latencyMs: 5 }),
            metrics,
        });
        await hub.run([basicCase]);
        expect(metrics.inc).toHaveBeenCalledWith('eval.runs');
        expect(metrics.record).toHaveBeenCalledWith('eval.score', expect.any(Number));
    });

    it('abort останавливает цикл', async () => {
        const controller = new AbortController();
        const hub = new EvalHub({
            runPrompt: async () => ({ output: 'x', latencyMs: 1 }),
        });
        controller.abort();
        const report = await hub.run([basicCase, basicCase], { signal: controller.signal });
        expect(report.summary.total).toBe(0);
    });
});
