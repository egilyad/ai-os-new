import type { TWikiPage } from './types';

export interface IWikiBrainContextProvider {
    readonly id: 'wiki-brain';
    retrieve(
        query: string,
        opts?: { topK?: number; maxTokens?: number },
    ): Promise<{
        snippets: Array<{ pageSlug: string; title: string; markdown: string; sources: string[] }>;
        totalTokens: number;
    }>;
    retrieveBySlugs(slugs: string[]): Promise<TWikiPage[]>;
}
