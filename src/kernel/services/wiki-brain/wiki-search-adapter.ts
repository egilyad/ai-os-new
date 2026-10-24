import type { IWikiSearchAdapter, WikiSearchHit } from '../../contracts/wiki-brain/wiki-search-adapter';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';

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

/**
 * MVP search: a small in-memory BM25 computed on demand over stored pages.
 * The "index" is only the pages table; semantic reranking is a later phase.
 */
export class WikiSearchAdapter implements IWikiSearchAdapter {
    constructor(private store: IWikiStore) {}

    async upsertPages() {
        // BM25 is computed on demand; nothing to prebuild.
    }

    async removeBySlugs() {
        // Nothing to prebuild.
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

    async semantic() {
        // Not implemented in the MVP — hybrid search falls back to BM25.
        return [] as WikiSearchHit[];
    }
}
