/**
 * Phase 54 — Hybrid RAG (GAP G1, STATIC GAP CLOSURE).
 *
 * Registers (additive, no migration):
 *   - bm25Service (in-memory BM25)
 *   - rerankerService (StubReranker, NOT production cross-encoder)
 *   - hybridRetrievalService (BM25 ∪ vector → RRF → rerank)
 *
 * Existing KnowledgeService.retrieve() untouched — hybrid is separate.
 * Vector via IEmbeddingPort (DefaultEmbeddingService hash 384) — provider embed = PROVIDER-PENDING.
 * Real cross-encoder reranker = BLOCKED-RUNTIME (ProviderRerankerService available but not default).
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import { ParityRepository } from '../dal/parity-repository';
import { Bm25Service } from '../services/rag/bm25-service';
import { StubRerankerService } from '../services/rag/reranker-service';
import { HybridRetrievalService } from '../services/rag/hybrid-retrieval-service';
import { DefaultEmbeddingService } from '../services/parity/default-embedding-service';
import type { IEmbeddingPort } from '../contracts/parity';

export const registerPhase54: Phase = ({ register }) => {
    register('bm25Service', () => new Bm25Service());

    register('rerankerService', () => new StubRerankerService());

    register('hybridRetrievalService', (c: IContainer) => {
        const repo = c.get<ParityRepository>('parityRepository');
        // hash embedder (offline) — provider embed = PROVIDER-PENDING / BLOCKED-RUNTIME
        const embedder: IEmbeddingPort = new DefaultEmbeddingService();
        return new HybridRetrievalService({
            repo,
            bm25: c.get<Bm25Service>('bm25Service'),
            embedder,
            reranker: c.get<StubRerankerService>('rerankerService'),
            events: c.get<IEventBus>('eventBus'),
        });
    });
};
