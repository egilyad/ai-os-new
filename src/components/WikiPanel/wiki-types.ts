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
    body: string;
}
