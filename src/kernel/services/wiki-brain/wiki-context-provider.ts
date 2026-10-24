import type { IWikiBrainContextProvider } from '../../contracts/wiki-brain/wiki-context-provider';
import type { IWikiQueryService } from '../../contracts/wiki-brain/wiki-query.service';
import type { TWikiPage } from '../../contracts/wiki-brain/types';

export class WikiBrainContextProvider implements IWikiBrainContextProvider {
    readonly id = 'wiki-brain' as const;

    constructor(private query: IWikiQueryService) {}

    async retrieve(
        query: string,
        opts: { topK?: number; maxTokens?: number } = {},
    ): Promise<{
        snippets: Array<{ pageSlug: string; title: string; markdown: string; sources: string[] }>;
        totalTokens: number;
    }> {
        const results = await this.query.search(query, { topK: opts.topK ?? 5 });
        const snippets = results.map((r) => ({
            pageSlug: r.page.slug,
            title: r.page.frontmatter.title,
            markdown: r.page.body,
            sources: r.sources.map((s) => s.origin),
        }));
        let totalTokens = 0;
        const capped: typeof snippets = [];
        const budget = opts.maxTokens;
        for (const s of snippets) {
            const sTokens = Math.ceil((s.title.length + s.markdown.length) / 4);
            if (budget && totalTokens + sTokens > budget) break;
            capped.push(s);
            totalTokens += sTokens;
        }
        return { snippets: capped, totalTokens };
    }

    async retrieveBySlugs(slugs: string[]): Promise<TWikiPage[]> {
        const pages: TWikiPage[] = [];
        for (const slug of slugs) {
            const page = await this.query.getBySlug(slug);
            if (page) pages.push(page);
        }
        return pages;
    }
}
