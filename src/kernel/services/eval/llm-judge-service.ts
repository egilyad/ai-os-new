/**
 * LlmJudgeService — G8 (STATIC GAP CLOSURE, stub).
 *
 * Provider-based LLM judge: if ILLMClientService wired, use real LLM;
 * otherwise stub heuristic (token_f1 + reasoning note) — marked PROVIDER-PENDING / via='stub'.
 * BLOCKED-RUNTIME until real LLM judge evaluated on real benchmarks.
 */

import type { ILlmJudgeService, ScorerResult } from '../../contracts/eval-scorer';
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('LlmJudge');

function tok(s: string): string[] {
    return s.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 0);
}

function stubScore(output: string, reference?: string): ScorerResult & { reasoning: string } {
    const ref = tok(reference ?? '');
    const out = tok(output);
    if (ref.length === 0) {
        const hasOutput = out.length > 0;
        return { score: hasOutput ? 0.7 : 0, passed: hasOutput, reasoning: `stub: no reference, output ${out.length} tokens → ${hasOutput ? 'pass' : 'fail'} (PROVIDER-PENDING)` };
    }
    const refSet = new Set(ref);
    let hit = 0;
    for (const t of out) if (refSet.has(t)) hit += 1;
    const p = out.length > 0 ? hit / out.length : 0;
    const r = hit / ref.length;
    const f1 = p + r > 0 ? (2 * p * r) / (p + r) : 0;
    return {
        score: f1,
        passed: f1 >= 0.5,
        reasoning: `stub: token_f1=${f1.toFixed(2)} p=${p.toFixed(2)} r=${r.toFixed(2)} vs reference (${ref.length} toks) — PROVIDER-PENDING (real LLM judge not wired)`,
    };
}

export class LlmJudgeService implements ILlmJudgeService {
    constructor(private deps: { events: IEventBus; llm?: ILLMClientService }) {}

    async init(): Promise<void> {
        LOGGER.info('LlmJudge', 'init', { via: this.deps.llm ? 'llm' : 'stub (PROVIDER-PENDING)' });
    }

    async destroy(): Promise<void> {}

    async judge(task: string, output: string, reference?: string): Promise<ScorerResult & { reasoning: string; via: 'stub'|'llm' }> {
        if (this.deps.llm) {
            try {
                const res = await this.deps.llm.chat(
                    [
                        { role: 'system', content: 'You are an evaluator. Score the output 0..1 vs reference. Reply JSON {"score":0..1,"passed":bool,"reasoning":"..."} only.' },
                        { role: 'user', content: `Task: ${task.slice(0, 800)}\nReference: ${(reference ?? '').slice(0, 1200)}\nOutput: ${output.slice(0, 2000)}\nScore:` },
                    ],
                    { temperature: 0.2, maxTokens: 300 },
                );
                if (!res.error) {
                    try {
                        const parsed = JSON.parse(res.content.trim().slice(res.content.indexOf('{'), res.content.lastIndexOf('}') + 1)) as { score?: number; passed?: boolean; reasoning?: string };
                        const score = typeof parsed.score === 'number' ? Math.max(0, Math.min(1, parsed.score)) : 0.5;
                        return {
                            score,
                            passed: typeof parsed.passed === 'boolean' ? parsed.passed : score >= 0.5,
                            reasoning: parsed.reasoning ?? 'llm judge (no reasoning)',
                            via: 'llm',
                        };
                    } catch {
                        // fall through to stub scoring but via=llm with note
                        const stub = stubScore(output, reference);
                        return { ...stub, reasoning: `llm parse failed, fallback stub: ${stub.reasoning}`, via: 'llm' };
                    }
                }
            } catch (e) {
                LOGGER.warn('LlmJudge', 'llm judge failed, fallback stub', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        const stub = stubScore(output, reference);
        try {
            (this.deps.events as unknown as { emit: (n: string, p: unknown) => void }).emit(
                (EVENTS as unknown as Record<string, string>).EVAL_JUDGE_DONE ?? ('eval:judge:done' as unknown as string),
                { task: task.slice(0, 100), score: stub.score, via: 'stub' },
            );
        } catch { /* ignore */ }
        return { ...stub, via: 'stub' };
    }
}
