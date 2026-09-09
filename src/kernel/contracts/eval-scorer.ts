/**
 * Eval Scorer contracts — GAP G8 (STATIC GAP CLOSURE).
 *
 * Scorer registry + LLM judge stub (provider-based).
 * Additive over EvalService (which keeps contains/exact/token_f1).
 * Real LLM judge = PROVIDER-PENDING until wired with real LLM client.
 */

import type { ILifecycle } from './lifecycle';
import type { Benchmark } from '../types/frontier-types';

export interface ScorerResult {
    score: number; // 0..1 (normalized, before *maxScore)
    passed: boolean;
}

export type ScorerFn = (c: Benchmark['cases'][number], output: string) => ScorerResult | Promise<ScorerResult>;

export interface IScorerRegistryService extends ILifecycle {
    register(name: string, fn: ScorerFn): void;
    score(c: Benchmark['cases'][number], output: string, scorer?: string): Promise<ScorerResult>;
    list(): string[];
    has(name: string): boolean;
}

export interface ILlmJudgeService extends ILifecycle {
    /** Judge output vs reference/task — stub heuristic unless real LLM wired. */
    judge(task: string, output: string, reference?: string): Promise<ScorerResult & { reasoning: string; via: 'stub'|'llm' }>;
}
