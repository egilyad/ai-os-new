// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { createWikiBrainDB, getWikiBrainDB, wikiId } from './wiki-brain-dexie';
import { WikiDexieStore } from './store.dexie';
import { WikiGraphService } from './wiki-graph.service';
import type { TWikiPage } from '../../contracts/wiki-brain/types';

const now = () => new Date().toISOString();

function page(slug: string, type = 'concept'): TWikiPage {
    return {
        id: wikiId('pg'),
        slug,
        frontmatter: {
            slug,
            title: slug,
            type,
            sources: [],
            aliases: [],
            tags: [],
            language: 'en',
            createdAt: now(),
            updatedAt: now(),
            reviewState: 'auto',
            graphIn: 0,
            graphOut: 0,
        },
        body: `# ${slug}`,
        sha256: '',
        rawMarkdown: `# ${slug}`,
    };
}

beforeEach(async () => {
    createWikiBrainDB('aios-wiki-brain-graph-test');
    const db = getWikiBrainDB();
    await db.delete();
    await db.open();
});

describe('wiki graph service', () => {
    it('computes 4-signal similarity between two pages', async () => {
        const store = new WikiDexieStore();
        await store.putPage(page('a'));
        await store.putPage(page('b'));
        await store.putLink({ id: wikiId('lnk'), fromSlug: 'a', toSlug: 'b', weight: 1 });
        await store.putLink({ id: wikiId('lnk'), fromSlug: 'b', toSlug: 'a', weight: 1 });

        const graph = new WikiGraphService(store);
        const sim = await graph.similarity('a', 'b');
        expect(sim.signals.direct).toBe(1);
        expect(sim.total).toBeGreaterThan(0);
    });

    it('detects communities with valid cohesion values', async () => {
        const store = new WikiDexieStore();
        // Two disconnected pairs → two communities.
        for (const slug of ['a', 'b', 'c', 'd']) await store.putPage(page(slug));
        await store.putLink({ id: wikiId('lnk'), fromSlug: 'a', toSlug: 'b', weight: 1 });
        await store.putLink({ id: wikiId('lnk'), fromSlug: 'b', toSlug: 'a', weight: 1 });
        await store.putLink({ id: wikiId('lnk'), fromSlug: 'c', toSlug: 'd', weight: 1 });
        await store.putLink({ id: wikiId('lnk'), fromSlug: 'd', toSlug: 'c', weight: 1 });

        const graph = new WikiGraphService(store);
        const communities = await graph.detectCommunities();
        expect(communities.length).toBeGreaterThanOrEqual(2);
        for (const community of communities) {
            expect(community.cohesion).toBeGreaterThanOrEqual(0);
            expect(community.cohesion).toBeLessThanOrEqual(1);
        }
    });

    it('builds a flow graph from pages and links', async () => {
        const store = new WikiDexieStore();
        await store.putPage(page('a'));
        await store.putPage(page('b'));
        await store.putLink({ id: wikiId('lnk'), fromSlug: 'a', toSlug: 'b', weight: 1 });

        const graph = new WikiGraphService(store);
        const flow = await graph.toFlowGraph();
        expect(flow.nodes.length).toBe(2);
        expect(flow.edges.length).toBe(1);
    });
});
