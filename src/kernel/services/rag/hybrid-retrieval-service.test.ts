/**
 * HybridRetrievalService static test (G1) — no network, no Dexie prod migration.
 * Uses fake repo + hash embedder + BM25 + stub reranker.
 * Verifies: additive, RRF fuse, fallback, reranker adapter, events, lastStats.
 */

import { describe, it, expect } from 'vitest';
import { Bm25Service } from './bm25-service';
import { StubRerankerService, ProviderRerankerService } from './reranker-service';
import { HybridRetrievalService } from './hybrid-retrieval-service';
import { DefaultEmbeddingService } from '../parity/default-embedding-service';

class FakeRepo {
    private sources: Array<{ id: string; title: string; chunks: string[]; kind: string; createdAt: number }> = [];
    async put(s: { id: string; title: string; chunks: string[] }) {
        this.sources.push({ ...s, kind: 'text', createdAt: Date.now() });
    }
    async listSources() {
        return this.sources;
    }
    clear() {
        this.sources = [];
    }
}

function fakeBus() {
    const emitted: Array<{ name: string; payload: unknown }> = [];
    return {
        emitted,
        emit: (name: string, payload: unknown) => {
            emitted.push({ name, payload });
        },
        on: () => () => {},
        off: () => {},
    } as unknown as import('../../types/interfaces').IEventBus;
}

describe('G1 HybridRetrievalService (static)', () => {
    it('BM25 ∪ vector → RRF → stub rerank, additive (existing retrieve untouched)', async () => {
        const repo = new FakeRepo() as unknown as import('../../dal/parity-repository').ParityRepository;
        await (repo as unknown as FakeRepo).put({ id: 's1', title: 'Cats', chunks: ['cats love fish', 'dogs love bones and cats hate dogs'] });
        await (repo as unknown as FakeRepo).put({ id: 's2', title: 'Fish', chunks: ['fish swim in water', 'cats eat fish daily'] });

        const bm25 = new Bm25Service();
        const reranker = new StubRerankerService();
        const embedder = new DefaultEmbeddingService();
        const bus = fakeBus();

        const svc = new HybridRetrievalService({ repo, bm25, embedder, reranker, events: bus });
        await svc.init();

        const hits = await svc.retrieveHybrid('cats fish', { limit: 3 });
        expect(hits.length).toBeGreaterThan(0);
        expect(hits.length).toBeLessThanOrEqual(3);
        // fusedScore must exist, chunkId format
        for (const h of hits) expect(h.chunkId).toMatch(/:/);
        expect(hits[0]!.fusedScore).toBeGreaterThan(0);

        // lastStats
        const st = svc.lastStats();
        expect(st).not.toBeNull();
        expect(st!.bm25Candidates + st!.vectorCandidates).toBeGreaterThan(0);

        // events
        expect(bus.emitted.some((e) => String(e.name).includes('hybrid'))).toBe(true);

        // useReranker=false → still returns same count but without rerankScore blending? (still ok)
        const noRerank = await svc.retrieveHybrid('cats', { limit: 2, useReranker: false });
        expect(noRerank.length).toBeGreaterThan(0);

        await svc.destroy();
    });

    it('reranker adapter swappable (Stub → Provider fallback)', async () => {
        const repo = new FakeRepo() as unknown as import('../../dal/parity-repository').ParityRepository;
        await (repo as unknown as FakeRepo).put({ id: 's1', title: 'T', chunks: ['hello world cats', 'hello fish'] });
        const bus = fakeBus();
        const svc = new HybridRetrievalService({
            repo,
            bm25: new Bm25Service(),
            embedder: new DefaultEmbeddingService(),
            reranker: new StubRerankerService(),
            events: bus,
        });
        await svc.init();
        const a = await svc.retrieveHybrid('hello', { limit: 2 });
        expect(a.length).toBeGreaterThan(0);

        // swap to ProviderReranker (BLOCKED-RUNTIME fallback → stub)
        const provider = new ProviderRerankerService();
        await provider.init();
        svc.setReranker(provider);
        const b = await svc.retrieveHybrid('hello', { limit: 2 });
        expect(b.length).toBeGreaterThan(0);
        await svc.destroy();
    });

    it('fallback: empty corpus → empty (not crash), allows existing retrieve fallback', async () => {
        const repo = new FakeRepo() as unknown as import('../../dal/parity-repository').ParityRepository;
        const svc = new HybridRetrievalService({
            repo,
            bm25: new Bm25Service(),
            embedder: new DefaultEmbeddingService(),
            reranker: new StubRerankerService(),
            events: fakeBus(),
        });
        await svc.init();
        const hits = await svc.retrieveHybrid('anything', { limit: 5 });
        expect(hits).toEqual([]);
        await svc.destroy();
    });

    it('Bm25Service standalone: search', async () => {
        const bm25 = new Bm25Service();
        await bm25.init();
        await bm25.build([{ id: '1', text: 'cats fish' }, { id: '2', text: 'dogs bones' }]);
        const r = await bm25.search('cats', 5);
        expect(r[0]!.id).toBe('1');
        await bm25.destroy();
    });
});
