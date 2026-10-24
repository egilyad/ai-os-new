import type { TWikiPage } from './types';

export interface WikiSearchHit {
    pageId: string;
    score: number;
}

export interface IWikiSearchAdapter {
    upsertPages(pages: TWikiPage[]): Promise<void>;
    removeBySlugs(slugs: string[]): Promise<void>;
    bm25(query: string, topK: number): Promise<WikiSearchHit[]>;
    semantic(query: string, topK: number): Promise<WikiSearchHit[]>;
}
