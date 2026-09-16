/**
 * Hybrid Retrieval contracts — GAP G1 (STATIC GAP CLOSURE).
 *
 * Additive, contracts-first. No existing retrieve() is changed.
 * Real provider embed/rerank marked PROVIDER-PENDING / BLOCKED-RUNTIME.
 */

import type { ILifecycle } from './lifecycle';

export interface HybridHit {
    sourceId: string;
    title: string;
    chunk: string;
    chunkId: string; // `${sourceId}:${idx}`
    bm25Score?: number;
    vectorScore?: number;
    fusedScore: number;
    rerankScore?: number;
}

export interface HybridOptions {
    limit?: number;
    bm25Weight?: number; // default 0.5
    vectorWeight?: number; // default 0.5
    useReranker?: boolean; // default true (stub reranker)
    candidateMultiplier?: number; // default 4 — pull N*multiplier before fuse/rerank
}

export interface IBM25Port extends ILifecycle {
    /** Index chunks; called per retrieveHybrid (in-memory, no persistence). */
    build(chunks: Array<{ id: string; text: string }>): Promise<void>;
    search(query: string, limit: number): Promise<Array<{ id: string; score: number }>>;
}

export interface IRerankerPort extends ILifecycle {
    /**
     * Rerank hits. Stub impl is heuristic (token-overlap + length prior).
     * Production cross-encoder = PROVIDER-PENDING (BLOCKED-RUNTIME until
     * a real reranker model is wired and evaluated on real data).
     */
    rerank(query: string, hits: HybridHit[]): Promise<HybridHit[]>;
}

export interface IHybridRetrievalService extends ILifecycle {
    /** Additive hybrid: BM25 ∪ vector → RRF fuse → rerank (stub). Falls back to token-only if both empty. */
    retrieveHybrid(query: string, opts?: HybridOptions): Promise<HybridHit[]>;
    setReranker(reranker: IRerankerPort): void;
    /** For introspection / evidence. */
    lastStats(): { bm25Candidates: number; vectorCandidates: number; fused: number; reranked: number } | null;
}
