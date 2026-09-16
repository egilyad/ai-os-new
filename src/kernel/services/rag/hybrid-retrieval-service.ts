/**
 * HybridRetrievalService — G1 (STATIC GAP CLOSURE).
 *
 * Additive: does NOT replace KnowledgeService.retrieve().
 * Strategy: BM25 (k*mult) ∪ vector (k*mult) → RRF fuse (k=60) → StubReranker.
 * Fallback: if both retrievers return 0, fall back to token-overlap (existing behavior).
 * Vector via IEmbeddingPort (DefaultEmbeddingService hash 384 until provider embed = PROVIDER-PENDING).
 * Events: knowledge:hybrid:retrieved (count, reranked).
 */

import type { IEmbeddingPort } from '../../contracts/parity';
import type {
    HybridHit,
    HybridOptions,
    IHybridRetrievalService,
    IRerankerPort,
    IBM25Port,
} from '../../contracts/hybrid-retrieval';
import type { ParityRepository } from '../../dal/parity-repository';
import type { IEventBus } from '../../types/interfaces';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('HybridRetrieval');

function cosine(a: number[], b: number[]): number {
    let dot = 0;
    let na = 0;
    let nb = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
        dot += (a[i] ?? 0) * (b[i] ?? 0);
        na += (a[i] ?? 0) * (a[i] ?? 0);
        nb += (b[i] ?? 0) * (b[i] ?? 0);
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function rrfFuse(
    bm25: Array<{ id: string; score: number }>,
    vect: Array<{ id: string; score: number }>,
    bm25W: number,
    vectW: number,
): Map<string, number> {
    // RRF k=60 + weighted: score = w * 1/(k+rank)
    const k = 60;
    const fused = new Map<string, number>();
    bm25.forEach((h, rank) => {
        const cur = fused.get(h.id) ?? 0;
        fused.set(h.id, cur + bm25W * (1 / (k + rank + 1)));
    });
    vect.forEach((h, rank) => {
        const cur = fused.get(h.id) ?? 0;
        fused.set(h.id, cur + vectW * (1 / (k + rank + 1)));
    });
    // also blend raw normalized scores for tie-breaking (small)
    const maxB = Math.max(1, ...bm25.map((x) => x.score));
    const maxV = Math.max(1, ...vect.map((x) => x.score));
    for (const [id, f] of fused.entries()) {
        const b = (bm25.find((x) => x.id === id)?.score ?? 0) / maxB;
        const v = (vect.find((x) => x.id === id)?.score ?? 0) / maxV;
        fused.set(id, f + 0.05 * (bm25W * b + vectW * v));
    }
    return fused;
}

export class HybridRetrievalService implements IHybridRetrievalService {
    private reranker: IRerankerPort;
    private embedder: IEmbeddingPort;
    private vectorCache = new Map<string, number[]>();
    private last: { bm25Candidates: number; vectorCandidates: number; fused: number; reranked: number } | null = null;

    constructor(opts: {
        repo: ParityRepository;
        bm25: IBM25Port;
        embedder: IEmbeddingPort;
        reranker: IRerankerPort;
        events: IEventBus;
    }) {
        this.repo = opts.repo;
        this.bm25 = opts.bm25;
        this.embedder = opts.embedder;
        this.reranker = opts.reranker;
        this.events = opts.events;
    }

    private repo: ParityRepository;
    private bm25: IBM25Port;
    private events: IEventBus;

    async init(): Promise<void> {
        LOGGER.info('init', {});
        await this.bm25.init();
        await this.reranker.init();
    }

    async destroy(): Promise<void> {
        await this.bm25.destroy();
        await this.reranker.destroy();
    }

    setReranker(r: IRerankerPort): void {
        this.reranker = r;
    }

    lastStats(): { bm25Candidates: number; vectorCandidates: number; fused: number; reranked: number } | null {
        return this.last;
    }

    async retrieveHybrid(query: string, opts?: HybridOptions): Promise<HybridHit[]> {
        const limit = Math.max(1, opts?.limit ?? 5);
        const bm25W = opts?.bm25Weight ?? 0.5;
        const vectW = opts?.vectorWeight ?? 0.5;
        const useReranker = opts?.useReranker ?? true;
        const mult = Math.max(1, opts?.candidateMultiplier ?? 4);
        const cand = limit * mult;

        const sources = await this.repo.listSources();
        const chunkMeta = new Map<string, { sourceId: string; title: string; chunk: string }>();
        const chunks: Array<{ id: string; text: string }> = [];
        for (const s of sources) {
            for (let i = 0; i < s.chunks.length; i++) {
                const id = `${s.id}:${i}`;
                const chunk = s.chunks[i] as string;
                chunkMeta.set(id, { sourceId: s.id, title: s.title, chunk });
                chunks.push({ id, text: chunk });
            }
        }
        if (chunks.length === 0) {
            this.last = { bm25Candidates: 0, vectorCandidates: 0, fused: 0, reranked: 0 };
            return [];
        }

        // BM25
        let bm25Hits: Array<{ id: string; score: number }> = [];
        try {
            await this.bm25.build(chunks);
            bm25Hits = await this.bm25.search(query, cand);
        } catch (e) {
            LOGGER.warn('bm25 failed, continue vector-only', { error: e instanceof Error ? e.message : String(e) });
        }

        // Vector (via embedder, cached per chunk)
        let vectorHits: Array<{ id: string; score: number }> = [];
        try {
            const qVecs = await this.embedder.embed([query]);
            const qVec = qVecs[0];
            if (qVec) {
                const scored: Array<{ id: string; score: number }> = [];
                for (const { id, text } of chunks) {
                    let v = this.vectorCache.get(id);
                    if (!v) {
                        const vecs = await this.embedder.embed([text]);
                        v = vecs[0];
                        if (v) this.vectorCache.set(id, v);
                    }
                    if (v) scored.push({ id, score: cosine(qVec, v) });
                }
                scored.sort((a, b) => b.score - a.score);
                // filter 0 and take cand
                vectorHits = scored.filter((x) => x.score > 0).slice(0, cand);
            }
        } catch (e) {
            LOGGER.warn('vector retrieval failed, continue bm25-only', { error: e instanceof Error ? e.message : String(e) });
        }

        if (bm25Hits.length === 0 && vectorHits.length === 0) {
            // fallback-compatible: nothing retrieved — return empty (caller may fall back to token retrieve)
            this.last = { bm25Candidates: 0, vectorCandidates: 0, fused: 0, reranked: 0 };
            LOGGER.warn('hybrid: both retrievers empty — fallback to empty (existing retrieve() still available)', {});
            return [];
        }

        const fusedMap = rrfFuse(bm25Hits, vectorHits, bm25W, vectW);
        const fusedHits: HybridHit[] = [];
        for (const [id, fusedScore] of fusedMap.entries()) {
            const meta = chunkMeta.get(id);
            if (!meta) continue;
            fusedHits.push({
                sourceId: meta.sourceId,
                title: meta.title,
                chunk: meta.chunk,
                chunkId: id,
                bm25Score: bm25Hits.find((x) => x.id === id)?.score,
                vectorScore: vectorHits.find((x) => x.id === id)?.score,
                fusedScore,
            });
        }
        fusedHits.sort((a, b) => b.fusedScore - a.fusedScore);
        const preRerank = fusedHits.slice(0, cand);

        let final = preRerank;
        if (useReranker && preRerank.length > 1) {
            try {
                final = await this.reranker.rerank(query, preRerank);
            } catch (e) {
                LOGGER.warn('reranker failed, keep fused order', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        const out = final.slice(0, limit);
        this.last = {
            bm25Candidates: bm25Hits.length,
            vectorCandidates: vectorHits.length,
            fused: preRerank.length,
            reranked: out.length,
        };
        // Event is best-effort — do not fail retrieval if event validation fails
        try {
            (this.events as unknown as { emit: (n: string, p: unknown) => void }).emit(EVENTS.KNOWLEDGE_HYBRID_RETRIEVED as unknown as string, {
                query: query.slice(0, 200),
                count: out.length,
                bm25Candidates: bm25Hits.length,
                vectorCandidates: vectorHits.length,
                reranked: useReranker,
            });
        } catch {
            // ignore
        }
        return out;
    }
}
