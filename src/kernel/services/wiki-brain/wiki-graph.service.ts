import type {
    IWikiGraphService,
    WikiGraphSimilarity,
    WikiCommunity,
    WikiGraphNode,
    WikiGraphEdge,
} from '../../contracts/wiki-brain/wiki-graph.service';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';
import {
    buildLouvainGraph,
    louvainCommunities,
    communityEdgeBalance,
} from './wiki-louvain';

export class WikiGraphService implements IWikiGraphService {
    constructor(private store: IWikiStore) {}

    async similarity(slugA: string, slugB: string): Promise<WikiGraphSimilarity> {
        const a = await this.store.getPageBySlug(slugA);
        const b = await this.store.getPageBySlug(slugB);
        if (!a || !b) return { signals: {}, total: 0 };

        const aOut = new Set((await this.store.linksFrom(a.slug)).map((l) => l.toSlug));
        const bOut = new Set((await this.store.linksFrom(b.slug)).map((l) => l.toSlug));
        const direct = aOut.has(b.slug) || bOut.has(a.slug) ? 1 : 0;

        const aSrc = new Set(a.frontmatter.sources.map((s) => s.sourceId));
        const bSrc = new Set(b.frontmatter.sources.map((s) => s.sourceId));
        let overlap = 0;
        for (const id of aSrc) if (bSrc.has(id)) overlap += 1;
        const union = aSrc.size + bSrc.size - overlap;
        const sourceOverlap = union > 0 ? overlap / union : 0;

        const neighborsOf = async (slug: string) => {
            const out = await this.store.linksFrom(slug);
            const inc = await this.store.linksTo(slug);
            return new Set([...out.map((l) => l.toSlug), ...inc.map((l) => l.fromSlug)]);
        };
        const na = await neighborsOf(a.slug);
        const nb = await neighborsOf(b.slug);
        let adamicAdar = 0;
        for (const n of na) {
            if (!nb.has(n)) continue;
            const deg =
                (await this.store.linksFrom(n)).length + (await this.store.linksTo(n)).length;
            if (deg > 1) adamicAdar += 1 / Math.log(deg);
        }

        const typeAffinity = a.frontmatter.type === b.frontmatter.type ? 1 : 0;
        const signals = { direct, sourceOverlap, adamicAdar, typeAffinity };
        const total = direct * 2 + sourceOverlap + adamicAdar + typeAffinity;
        return { signals, total };
    }

    async detectCommunities(): Promise<WikiCommunity[]> {
        const pages = await this.store.listPages({ limit: 10000 });
        const slugIndex = new Map(pages.map((p, i) => [p.slug, i]));

        const edges: Array<[number, number, number]> = [];
        const seen = new Set<string>();
        for (const page of pages) {
            const from = slugIndex.get(page.slug);
            if (from === undefined) continue;
            const out = await this.store.linksFrom(page.slug);
            for (const link of out) {
                const to = slugIndex.get(link.toSlug);
                if (to === undefined || to === from) continue;
                const key = from < to ? `${from}:${to}` : `${to}:${from}`;
                if (seen.has(key)) continue;
                seen.add(key);
                edges.push([from, to, link.weight || 1]);
            }
        }

        const graph = buildLouvainGraph(edges, pages.length);
        const labels = louvainCommunities(graph);
        const balance = communityEdgeBalance(graph, labels);

        const buckets = new Map<number, number[]>();
        labels.forEach((label, i) => {
            const list = buckets.get(label) ?? [];
            list.push(i);
            buckets.set(label, list);
        });
        const common = new Map<number, string>();
        for (let i = 0; i < pages.length; i++) common.set(i, pages[i]!.slug);

        const communities: WikiCommunity[] = [];
        for (const [label, members] of buckets) {
            const { internal, external } = balance.get(label) ?? { internal: 0, external: 0 };
            const cohesion = internal + external > 0 ? internal / (internal + external) : 0;
            communities.push({
                id: `community-${label}`,
                slugs: members.map((i) => common.get(i)!),
                cohesion: Number(cohesion.toFixed(4)),
            });
        }
        return communities;
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
