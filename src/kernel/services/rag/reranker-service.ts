/**
 * Reranker services for G1.
 *
 * StubReranker — deterministic heuristic (token-overlap + length/coverage prior).
 * It is NOT a production cross-encoder. Production reranker (e.g. Cohere
 * rerank / cross-encoder) = PROVIDER-PENDING — marked BLOCKED-RUNTIME until
 * wired and evaled on real data. The IRerankerPort adapter lets us swap it
 * without touching HybridRetrievalService.
 */

import type { HybridHit, IRerankerPort } from '../../contracts/hybrid-retrieval';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Reranker');

function tokenize(s: string): Set<string> {
    return new Set(s.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 2));
}

function heuristicScore(query: string, chunk: string): number {
    const q = tokenize(query);
    if (q.size === 0) return 0;
    const c = tokenize(chunk);
    let hit = 0;
    for (const t of q) if (c.has(t)) hit += 1;
    const coverage = hit / q.size;
    // length prior: prefer 80-400 char chunks (not too short/long)
    const len = chunk.length;
    const lenPrior = len < 40 ? 0.6 : len > 800 ? 0.85 : 1.0;
    // position prior: earlier mention of query terms slightly boosted (already via BM25, keep small)
    return coverage * lenPrior;
}

export class StubRerankerService implements IRerankerPort {
    async init(): Promise<void> {
        LOGGER.info('Reranker', 'init (stub — NOT production cross-encoder)', {});
    }
    async destroy(): Promise<void> {}

    async rerank(query: string, hits: HybridHit[]): Promise<HybridHit[]> {
        // Preserve fusedScore, add rerankScore = 0.7*fused + 0.3*heuristic
        const scored = hits.map((h) => {
            const heur = heuristicScore(query, h.chunk);
            // normalize heuristic 0..1, fused already 0..~2, blend
            const rerankScore = 0.7 * h.fusedScore + 0.3 * heur;
            return { ...h, rerankScore };
        });
        scored.sort((a, b) => (b.rerankScore ?? 0) - (a.rerankScore ?? 0));
        return scored;
    }
}

/**
 * ProviderReranker — placeholder for production cross-encoder.
 * BLOCKED-RUNTIME: not wired. Emits warning and falls back to stub behavior.
 */
export class ProviderRerankerService implements IRerankerPort {
    private stub = new StubRerankerService();
    async init(): Promise<void> {
        LOGGER.warn('Reranker', 'ProviderReranker — PROVIDER-PENDING (BLOCKED-RUNTIME): no model wired, fallback to stub', {});
    }
    async destroy(): Promise<void> {}
    async rerank(query: string, hits: HybridHit[]): Promise<HybridHit[]> {
        LOGGER.warn('Reranker', 'ProviderReranker fallback → StubReranker (BLOCKED-RUNTIME)', {});
        return this.stub.rerank(query, hits);
    }
}
