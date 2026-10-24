import type { IWikiSearchAdapter, WikiSearchHit } from '../../contracts/wiki-brain/wiki-search-adapter';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';
import type { IEmbeddingPort } from '../../contracts/parity';
import type { TWikiPage } from '../../contracts/wiki-brain/types';

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'for', 'on', 'with', 'is', 'are', 'was', 'were', 'be', 'it', 'this', 'that']);

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9а-яё\s]/gi, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1 && !STOP.has(t));
}

function bm25Score(queryTerms: string[], docTerms: string[]): number {
    const k1 = 1.2;
    const b = 0.75;
    const docLen = docTerms.length || 1;
    const avgDocLen = 100;
    const termFreq = new Map<string, number>();
    for (const term of docTerms) termFreq.set(term, (termFreq.get(term) ?? 0) + 1);
    let score = 0;
    for (const term of queryTerms) {
        const tf = termFreq.get(term) ?? 0;
        if (tf === 0) continue;
        score += (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLen / avgDocLen)));
    }
    return score;
}

function cosine(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < len; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    if (na === 0 || nb === 0) return 0;
    return dot / Math.sqrt(na * nb);
}

/**
 * BM25 + optional embedding-retrieval search over stored wiki pages.
 *
 * Semantic retrieval uses an optional IEmbeddingPort; when absent it degrades
 * to BM25 so the contract stays stable. Page vectors are cached in memory and
 * invalidated on upsert/removal.
 */
export class WikiSearchAdapter implements IWikiSearchAdapter {
    private vecs = new Map<string, number[]>();

    constructor(
        private store: IWikiStore,
        private embedder?: IEmbeddingPort,
    ) {}

    async upsertPages(pages: TWikiPage[]) {
        if (!this.embedder) return;
        try {
            const texts = pages.map((p) => `${p.frontmatter.title}\n${p.body}`);
            const vectors = await this.embedder.embed(texts);
            pages.forEach((p, index) => this.vecs.set(p.id, vectors[index]));
        } catch {
            // embedder failure is non-fatal — fall back to BM25 only
            for (const p of pages) this.vecs.delete(p.id);
        }
    }

    async removeBySlugs(slugs: string[]) {
        const pages = await this.store.listPages({ limit: 10000 });
        const slugSet = new Set(slugs);
        for (const page of pages) {
            if (slugSet.has(page.slug)) this.vecs.delete(page.id);
        }
    }

    async bm25(query: string, topK: number): Promise<WikiSearchHit[]> {
        const queryTerms = tokenize(query);
        if (queryTerms.length === 0) return [];
        const pages = await this.store.listPages({ limit: 10000 });
        const scored: WikiSearchHit[] = [];
        for (const page of pages) {
            const docTerms = tokenize(`${page.frontmatter.title} ${page.body}`);
            const score = bm25Score(queryTerms, docTerms);
            if (score > 0) scored.push({ pageId: page.id, score });
        }
        return scored.sort((a, b) => b.score - a.score).slice(0, topK);
    }

    async semantic(query: string, topK: number): Promise<WikiSearchHit[]> {
        if (!this.embedder) return this.bm25(query, topK);
        const pages = await this.store.listPages({ limit: 10000 });
        const missing = pages.filter((p) => !this.vecs.has(p.id));
        if (missing.length > 0) {
            try {
                const texts = missing.map((p) => `${p.frontmatter.title}\n${p.body}`);
                const vectors = await this.embedder.embed(texts);
                missing.forEach((p, index) => this.vecs.set(p.id, vectors[index]));
            } catch {
                return this.bm25(query, topK);
            }
        }
        let queryVec: number[];
        try {
            [queryVec] = await this.embedder.embed([query]);
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
