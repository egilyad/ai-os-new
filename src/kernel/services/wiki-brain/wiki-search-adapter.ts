import type {
    IWikiSearchAdapter,
    WikiSearchHit,
} from '../../contracts/wiki-brain/wiki-search-adapter';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';
import type { IEmbeddingPort } from '../../contracts/parity';
import type { TWikiEmbedding, TWikiPage } from '../../contracts/wiki-brain/types';
import { Bm25Service } from '../rag/bm25-service';
import { getWikiBrainDB } from './wiki-brain-dexie';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('WikiSearch');

const STOP = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'of',
    'to',
    'in',
    'for',
    'on',
    'with',
    'is',
    'are',
    'was',
    'were',
    'be',
    'it',
    'this',
    'that',
]);

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9а-яё\s]/gi, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1 && !STOP.has(t));
}

function cosine(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
        const ai = a[i]!;
        const bi = b[i]!;
        dot += ai * bi;
        na += ai * ai;
        nb += bi * bi;
    }
    if (na === 0 || nb === 0) return 0;
    return dot / Math.sqrt(na * nb);
}

/**
 * BM25 (with IDF) + persistent embedding-retrieval search over wiki pages.
 *
 * BM25 uses the shared Bm25Service (k1=1.2, b=0.75, IDF). The index is built
 * lazily and invalidated on upsert/removal. Semantic vectors are persisted in
 * the wiki Dexie DB (wikiEmbeddings) so they survive reloads.
 */
export class WikiSearchAdapter implements IWikiSearchAdapter {
    private vecs = new Map<string, number[]>();
    private vecModel = '';
    private vecDim = 0;
    private bm25Service = new Bm25Service();
    private bm25Dirty = true;

    constructor(
        private store: IWikiStore,
        private embedder?: IEmbeddingPort,
    ) {}

    private async loadPersistedVectors(): Promise<void> {
        if (this.vecs.size > 0) return;
        try {
            const db = getWikiBrainDB();
            const rows = (await db.wikiEmbeddings.toArray()) as unknown as TWikiEmbedding[];
            for (const r of rows) {
                this.vecs.set(r.pageId, r.vector);
                if (!this.vecModel) this.vecModel = r.model;
                if (!this.vecDim) this.vecDim = r.dim;
            }
        } catch {
            /* no persistence — fall back to memory-only */
        }
    }

    private async persistVectors(
        entries: Array<{ pageId: string; vector: number[] }>,
    ): Promise<void> {
        try {
            const db = getWikiBrainDB();
            const now = new Date().toISOString();
            const model = this.embedder?.describe?.().model ?? 'unknown';
            const rows: TWikiEmbedding[] = entries.map((e) => ({
                pageId: e.pageId,
                model,
                dim: e.vector.length,
                vector: e.vector,
                createdAt: now,
            }));
            await db.wikiEmbeddings.bulkPut(rows as never);
        } catch {
            /* persistence is best-effort */
        }
    }

    private async ensureEmbeddingSpace(): Promise<void> {
        if (!this.embedder) return;
        const desc = this.embedder.describe?.();
        if (desc?.model) this.vecModel = desc.model;
        if (desc?.dimensions) this.vecDim = desc.dimensions;
    }

    async upsertPages(pages: TWikiPage[]) {
        this.bm25Dirty = true;
        if (!this.embedder) return;
        await this.ensureEmbeddingSpace();
        try {
            const texts = pages.map((p) => `${p.frontmatter.title}\n${p.body}`);
            const vectors = await this.embedder.embed(texts);
            const entries: Array<{ pageId: string; vector: number[] }> = [];
            pages.forEach((p, index) => {
                const v = vectors[index]!;
                this.vecs.set(p.id, v);
                entries.push({ pageId: p.id, vector: v });
            });
            await this.persistVectors(entries);
        } catch (e) {
            LOGGER.warn('WikiSearch', 'upsert embed failed', { error: e });
            for (const p of pages) this.vecs.delete(p.id);
        }
    }

    async removeBySlugs(slugs: string[]) {
        this.bm25Dirty = true;
        const pages = await this.store.listPages({ limit: 10000 });
        const slugSet = new Set(slugs);
        const removed: string[] = [];
        for (const page of pages) {
            if (slugSet.has(page.slug)) {
                this.vecs.delete(page.id);
                removed.push(page.id);
            }
        }
        if (removed.length > 0) {
            try {
                const db = getWikiBrainDB();
                await db.wikiEmbeddings.where('pageId').anyOf(removed).delete();
            } catch {
                /* best-effort */
            }
        }
    }

    private async ensureBm25Index(): Promise<void> {
        if (!this.bm25Dirty) return;
        const pages = await this.store.listPages({ limit: 10000 });
        await this.bm25Service.build(
            pages.map((p) => ({
                id: p.id,
                text: `${p.frontmatter.title}\n${p.body}`,
            })),
        );
        this.bm25Dirty = false;
    }

    async bm25(query: string, topK: number): Promise<WikiSearchHit[]> {
        const queryTerms = tokenize(query);
        if (queryTerms.length === 0) return [];
        await this.ensureBm25Index();
        const hits = await this.bm25Service.search(query, topK);
        return hits.map((h) => ({ pageId: h.id, score: h.score }));
    }

    async semantic(query: string, topK: number): Promise<WikiSearchHit[]> {
        if (!this.embedder) return this.bm25(query, topK);
        await this.loadPersistedVectors();
        await this.ensureEmbeddingSpace();
        const pages = await this.store.listPages({ limit: 10000 });
        const missing = pages.filter((p) => !this.vecs.has(p.id));
        if (missing.length > 0) {
            try {
                const texts = missing.map((p) => `${p.frontmatter.title}\n${p.body}`);
                const vectors = await this.embedder.embed(texts);
                const entries: Array<{ pageId: string; vector: number[] }> = [];
                missing.forEach((p, index) => {
                    const v = vectors[index]!;
                    this.vecs.set(p.id, v);
                    entries.push({ pageId: p.id, vector: v });
                });
                await this.persistVectors(entries);
            } catch (e) {
                LOGGER.warn('WikiSearch', 'semantic embed failed', { error: e });
                return this.bm25(query, topK);
            }
        }
        let queryVec: number[];
        try {
            const [first] = await this.embedder.embed([query]);
            if (!first) return this.bm25(query, topK);
            queryVec = first;
        } catch {
            return this.bm25(query, topK);
        }
        const scored: WikiSearchHit[] = [];
        for (const page of pages) {
            const vec = this.vecs.get(page.id);
            if (!vec) continue;
            const score = cosine(queryVec, vec);
            if (score > 0) scored.push({ pageId: page.id, score });
        }
        return scored.sort((a, b) => b.score - a.score).slice(0, topK);
    }
}
