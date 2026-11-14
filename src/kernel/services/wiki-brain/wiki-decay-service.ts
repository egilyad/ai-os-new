import type { TWikiKnowledgeUnit } from '../../contracts/wiki-brain/types';

/**
 * WikiDecayService — F7: importance-weighted retention (forgetting/decay).
 *
 * Retention score = base(0.5..1 by kind) * exp(-λ * ageDays). No schema
 * changes: score is computed on the fly; consumers may filter low-score units
 * out of retrieval. Conservative baseline keeps old claims visible unless
 * explicitly below threshold.
 */

const KIND_BASE: Partial<Record<TWikiKnowledgeUnit['kind'], number>> = {
    claim: 0.9,
    hypothesis: 0.6,
    concept: 0.8,
    entity: 0.8,
    observation: 0.7,
    decision: 0.85,
    note: 0.5,
};

const DEFAULT_BASE = 0.6;
const DECAY_LAMBDA = 0.01; // per day
const DEFAULT_MAX_AGE_DAYS = 180;
const DEFAULT_THRESHOLD = 0.35;

function ageDays(createdAt: string, now = Date.now()): number {
    const t = new Date(createdAt).getTime();
    if (Number.isNaN(t)) return 0;
    return Math.max(0, (now - t) / 86_400_000);
}

export class WikiDecayService {
    score(unit: TWikiKnowledgeUnit, now = Date.now()): number {
        const base = KIND_BASE[unit.kind] ?? DEFAULT_BASE;
        const age = ageDays(unit.createdAt, now);
        return base * Math.exp(-DECAY_LAMBDA * age);
    }

    /**
     * Units whose retention dropped below threshold — candidates to deprioritize.
     */
    candidates(
        units: TWikiKnowledgeUnit[],
        opts: { maxAgeDays?: number; threshold?: number; now?: number } = {},
    ): TWikiKnowledgeUnit[] {
        const maxAge = opts.maxAgeDays ?? DEFAULT_MAX_AGE_DAYS;
        const threshold = opts.threshold ?? DEFAULT_THRESHOLD;
        const now = opts.now ?? Date.now();
        return units.filter((u) => {
            if (ageDays(u.createdAt, now) < maxAge) return false;
            return this.score(u, now) < threshold;
        });
    }

    summarize(
        units: TWikiKnowledgeUnit[],
        now = Date.now(),
    ): {
        total: number;
        decayed: number;
        avgScore: number;
    } {
        if (units.length === 0) return { total: 0, decayed: 0, avgScore: 0 };
        const scores = units.map((u) => this.score(u, now));
        const decayed = scores.filter((s) => s < DEFAULT_THRESHOLD + 0.1).length;
        return {
            total: units.length,
            decayed,
            avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        };
    }
}
