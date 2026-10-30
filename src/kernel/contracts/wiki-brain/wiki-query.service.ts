import type { TWikiPage, TWikiSource, TWikiLink } from './types';

export interface WikiQueryResult {
    page: TWikiPage;
    score: number;
    matchedOn: 'bm25' | 'semantic' | 'exact-slug';
    snippet: string;
    sources: TWikiSource[];
}

export interface IWikiQueryService {
    search(
        query: string,
        opts?: {
            topK?: number;
            mode?: 'hybrid' | 'bm25-only' | 'semantic-only';
            filterByType?: TWikiPage['frontmatter']['type'][];
        },
    ): Promise<WikiQueryResult[]>;
    getBySlug(slug: string): Promise<TWikiPage | undefined>;
    neighbors(
        slug: string,
        opts?: { depth?: number; maxNodes?: number },
    ): Promise<{ nodes: TWikiPage[]; links: TWikiLink[] }>;
}
