import type { WikiArticle } from './wiki-types';

/**
 * User-created wiki articles (P2-5). Stored locally (localStorage) so the
 * static corpus in wiki-articles.ts is never mutated; they are merged on top
 * of the static articles via getAllArticles() in wiki-articles.ts.
 */

const STORAGE_KEY = 'wiki.userArticles.v1';
let cached: WikiArticle[] | null = null;

export function loadUserArticles(): WikiArticle[] {
    if (cached) return cached;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        cached = raw ? (JSON.parse(raw) as WikiArticle[]) : [];
    } catch {
        cached = [];
    }
    return cached;
}

export function saveUserArticles(articles: WikiArticle[]): void {
    cached = articles;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    } catch {
        /* storage unavailable */
    }
}

export function addUserArticle(article: WikiArticle): void {
    saveUserArticles([...loadUserArticles(), article]);
}

export function removeUserArticle(slug: string): void {
    saveUserArticles(loadUserArticles().filter((a) => a.slug !== slug));
}

export function getUserArticles(): WikiArticle[] {
    return loadUserArticles();
}
