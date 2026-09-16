/**
 * ScorerRegistryService — G8 (STATIC GAP CLOSURE).
 *
 * Registry of scorer fns. Built-ins: contains, exact, token_f1 (same as EvalService).
 * Custom scorers can be registered (e.g. llm_judge stub). Additive — EvalService keeps fallback.
 */

import type { IScorerRegistryService, ScorerFn, ScorerResult } from '../../contracts/eval-scorer';
import type { Benchmark } from '../../types/frontier-types';
import type { IEventBus } from '../../types/interfaces';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('ScorerRegistry');

function tok(s: string): string[] {
    return s.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 0);
}

const BUILTINS: Record<string, ScorerFn> = {
    contains: (c, output) => {
        const passed = c.expectContains ? output.toLowerCase().includes(c.expectContains.toLowerCase()) : output.length > 0;
        return { score: passed ? 1 : 0, passed };
    },
    exact: (c, output) => {
        const ok = output.trim().toLowerCase() === (c.reference ?? c.expectContains ?? '').trim().toLowerCase();
        return { score: ok ? 1 : 0, passed: ok };
    },
    token_f1: (c, output) => {
        const ref = tok(c.reference ?? c.expectContains ?? '');
        const out = tok(output);
        if (ref.length === 0) return { score: out.length > 0 ? 1 : 0, passed: out.length > 0 };
        const refSet = new Set(ref);
        let hit = 0;
        for (const t of out) if (refSet.has(t)) hit += 1;
        const p = out.length > 0 ? hit / out.length : 0;
        const r = hit / ref.length;
        const f1 = p + r > 0 ? (2 * p * r) / (p + r) : 0;
        return { score: f1, passed: f1 >= 0.5 };
    },
};

export class ScorerRegistryService implements IScorerRegistryService {
    private scorers = new Map<string, ScorerFn>(Object.entries(BUILTINS));

    constructor(private events: IEventBus) {}

    async init(): Promise<void> {
        LOGGER.info('ScorerRegistry', 'init', { builtins: [...this.scorers.keys()] });
    }

    async destroy(): Promise<void> {}

    register(name: string, fn: ScorerFn): void {
        if (this.scorers.has(name)) LOGGER.warn('ScorerRegistry', 'overwrite scorer', { name });
        this.scorers.set(name, fn);
        try {
            (this.events as unknown as { emit: (n: string, p: unknown) => void }).emit(
                (EVENTS as unknown as Record<string, string>).EVAL_SCORER_REGISTERED ?? ('eval:scorer:registered' as unknown as string),
                { name },
            );
        } catch { /* ignore */ }
    }

    async score(c: Benchmark['cases'][number], output: string, scorer?: string): Promise<ScorerResult> {
        const name = scorer ?? c.metric ?? 'contains';
        const fn = this.scorers.get(name) ?? BUILTINS.contains!;
        const res = await fn(c, output);
        return { score: Math.max(0, Math.min(1, res.score)), passed: res.passed };
    }

    list(): string[] {
        return [...this.scorers.keys()];
    }

    has(name: string): boolean {
        return this.scorers.has(name);
    }
}
