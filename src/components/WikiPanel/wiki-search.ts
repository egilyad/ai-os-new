import { Bm25Service } from '../../kernel/services/rag/bm25-service';
import { filterOptions } from '../../kernel/utils/filter-options';
import { WIKI_ARTICLES } from './wiki-articles';

export interface WikiHit {
    slug: string;
    score: number;
}

/**
 * Synchronous prefix/title fallback for very short queries (1 character)
 * where BM25 has too little signal. Reuses the relevance scorer.
 */
export function searchWikiQuick(query: string, limit = 10): WikiHit[] {
    const q = query.trim();
    if (!q) return [];
    return filterOptions(WIKI_ARTICLES, q, ['title'], limit).map(({ item }) => ({
        slug: item.slug,
        score: 0.5,
    }));
}

let cached: Bm25Service | null = null;
let builtFor = -1;

async function index(): Promise<Bm25Service> {
    if (!cached || builtFor !== WIKI_ARTICLES.length) {
        cached = new Bm25Service();
        await cached.init();
        await cached.build(
            WIKI_ARTICLES.map((a) => ({
                id: a.slug,
                text: `${a.title}\n${a.tags.join(' ')}\n${a.body}`,
            })),
        );
        builtFor = WIKI_ARTICLES.length;
    }
    return cached;
}

export async function searchWiki(query: string, limit = 10): Promise<WikiHit[]> {
    const q = query.trim();
    if (!q) return [];
    if (q.length < 2) return searchWikiQuick(q, limit);
    const svc = await index();
    const hits = await svc.search(q, limit);
    return hits.map((h) => ({ slug: h.id, score: h.score }));
}

export function searchSnippet(body: string, query: string): string {
    const qTokens = query
        .toLowerCase()
        .split(/[^a-zа-яё0-9]+/u)
        .filter((t) => t.length > 2);
    for (const line of body.split('\n')) {
        const low = line.toLowerCase();
        if (qTokens.some((t) => low.includes(t)) && line.trim().length > 0) {
            return line.trim().slice(0, 160);
        }
    }
    return body.split('\n').find((l) => l.trim().length > 0)?.trim().slice(0, 160) ?? '';
}
