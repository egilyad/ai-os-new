// Shared wiki article types. Kept in a leaf module so article catalogs can
// import them without creating a cycle through wiki-articles.ts.

export type WikiFreshness = 'verified' | 'documented' | 'needs-check' | 'not-implemented';

export interface WikiSection {
    id: string;
    title: string;
}

export interface WikiArticle {
    slug: string;
    title: string;
    section: string;
    tags: string[];
    freshness: WikiFreshness;
    sources: string[];
    related: string[];
    /** Who checked the article's claims against code and when (not just links). */
    reviewed?: { at: string; by: string };
    body: string;
}
