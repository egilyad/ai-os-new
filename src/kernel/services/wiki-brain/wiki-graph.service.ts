import type {
    IWikiGraphService,
    WikiGraphSimilarity,
    WikiCommunity,
    WikiGraphNode,
    WikiGraphEdge,
} from '../../contracts/wiki-brain/wiki-graph.service';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';

export class WikiGraphService implements IWikiGraphService {
    constructor(private store: IWikiStore) {}

    async similarity(slugA: string, slugB: string): Promise<WikiGraphSimilarity> {
        const a = await this.store.getPageBySlug(slugA);
        const b = await this.store.getPageBySlug(slugB);
        if (!a || !b) return { signals: {}, total: 0 };
        const aSources = new Set(a.frontmatter.sources.map((s) => s.sourceId));
        const bSources = new Set(b.frontmatter.sources.map((s) => s.sourceId));
        let overlap = 0;
        for (const id of aSources) if (bSources.has(id)) overlap += 1;
        const signals = { sourceOverlap: overlap, direct: 0, adamicAdar: 0, typeAffinity: a.frontmatter.type === b.frontmatter.type ? 1 : 0 };
        return { signals, total: overlap + signals.typeAffinity + signals.direct };
    }

    async detectCommunities(): Promise<WikiCommunity[]> {
        // MVP: no Louvain yet; return a single community of everything.
        const pages = await this.store.listPages({ limit: 10000 });
        return [{
            id: 'all',
            slugs: pages.map((p) => p.slug),
            cohesion: 1,
        }];
    }

    async toFlowGraph(slugs?: string[]): Promise<{ nodes: WikiGraphNode[]; edges: WikiGraphEdge[] }> {
        const pages = await this.store.listPages({ limit: 10000 });
        const wanted = slugs ? new Set(slugs) : null;
        const nodes: WikiGraphNode[] = [];
        const edges: WikiGraphEdge[] = [];
        for (const page of pages) {
            if (wanted && !wanted.has(page.slug)) continue;
            nodes.push({ id: page.id, label: page.frontmatter.title });
        }
        const links = await Promise.all(
            pages.map(async (p) => ({ from: p, to: await this.store.linksFrom(p.slug) })),
        );
        for (const { from, to } of links) {
            for (const link of to) {
                if (wanted && (!wanted.has(from.slug) || !wanted.has(link.toSlug))) continue;
                const target = await this.store.getPageBySlug(link.toSlug);
                if (target) edges.push({ id: link.id, source: from.id, target: target.id });
            }
        }
        return { nodes, edges };
    }
}
