import type { IWikiQueryService, WikiQueryResult } from '../../contracts/wiki-brain/wiki-query.service';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';
import type { IWikiSearchAdapter } from '../../contracts/wiki-brain/wiki-search-adapter';
import type { IWikiGraphService } from '../../contracts/wiki-brain/wiki-graph.service';
import type { TWikiPage } from '../../contracts/wiki-brain/types';

function snippet(body: string, max = 180): string {
    const flat = body.replace(/\s+/g, ' ').trim();
    return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

export class WikiQueryService implements IWikiQueryService {
    constructor(
        private store: IWikiStore,
        private searchAdapter: IWikiSearchAdapter,
        private graph: IWikiGraphService | null = null,
    ) {}

    async search(query: string, opts: { topK?: number; mode?: string; filterByType?: string[]; readSourcesOnly?: boolean } = {}): Promise<WikiQueryResult[]> {
        const topK = opts.topK ?? 8;
        const exact = await this.store.getPageBySlug(query.trim().toLowerCase());
        const hits = await this.searchAdapter.bm25(query, topK);
        const results: WikiQueryResult[] = [];

        if (exact) {
            results.push({
                page: exact,
                score: 10,
                matchedOn: 'exact-slug',
                snippet: snippet(exact.body),
                sources: await this.loadSources(exact),
            });
        }

        for (const hit of hits) {
            const page = await this.store.getPage(hit.pageId);
            if (!page) continue;
            if (opts.filterByType && !opts.filterByType.includes(page.frontmatter.type)) continue;
            if (results.some((r) => r.page.id === page.id)) continue;
            results.push({
                page,
                score: hit.score,
                matchedOn: 'bm25',
                snippet: snippet(page.body),
                sources: await this.loadSources(page),
            });
            if (results.length >= topK) break;
        }

        return results;
    }

    async getBySlug(slug: string) {
        return this.store.getPageBySlug(slug);
    }

    async neighbors(slug: string, _opts: { depth?: number; maxNodes?: number } = {}) {
        const out = await this.store.linksFrom(slug);
        const inbound = await this.store.linksTo(slug);
        const slugs = [...new Set([...out.map((l) => l.toSlug), ...inbound.map((l) => l.fromSlug)])];
        const nodes: TWikiPage[] = [];
        for (const s of slugs.slice(0, 50)) {
            const page = await this.store.getPageBySlug(s);
            if (page) nodes.push(page);
        }
        return { nodes, links: [...out, ...inbound] };
    }

    private async loadSources(page: TWikiPage) {
        const sources = [];
        for (const ref of page.frontmatter.sources) {
            const source = await this.store.getSource(ref.sourceId);
            if (source) sources.push(source);
        }
        return sources;
    }
}
