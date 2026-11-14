// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { createWikiBrainDB, getWikiBrainDB, wikiId } from './wiki-brain-dexie';
import { WikiDexieStore } from './store.dexie';
import { WikiSearchAdapter } from './wiki-search-adapter';
import { WikiQueryService } from './wiki-query.service';
import type { TWikiPage } from '../../contracts/wiki-brain/types';

const now = () => new Date().toISOString();

function page(slug: string, title: string, body: string): TWikiPage {
    return {
        id: wikiId('pg'),
        slug,
        frontmatter: {
            slug,
            title,
            type: 'concept',
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
        body,
        sha256: '',
        rawMarkdown: body,
    };
}

beforeEach(async () => {
    createWikiBrainDB('aios-wiki-brain-query-test');
    const db = getWikiBrainDB();
    await db.delete();
    await db.open();
});

describe('wiki query service', () => {
    it('returns the page that best matches the query', async () => {
        const store = new WikiDexieStore();
        await store.putPage(
            page('quantum', 'Quantum theory', 'About quantum mechanics and superposition.'),
        );
        await store.putPage(page('gardening', 'Gardening', 'About soil and compost.'));

        const query = new WikiQueryService(store, new WikiSearchAdapter(store));
        const results = await query.search('mechanics');

        expect(results.length).toBeGreaterThan(0);
        expect(results[0].page.slug).toBe('quantum');
        expect(results[0].matchedOn).toBe('bm25');
    });

    it('finds a page by exact slug', async () => {
        const store = new WikiDexieStore();
        await store.putPage(page('quantum', 'Quantum theory', 'Body.'));
        const query = new WikiQueryService(store, new WikiSearchAdapter(store));
        const results = await query.search('quantum');
        expect(results[0].matchedOn).toBe('exact-slug');
    });

    it('semantic mode falls back to bm25 and tags the match', async () => {
        const store = new WikiDexieStore();
        await store.putPage(page('gardening', 'Gardening', 'About soil and compost.'));
        const query = new WikiQueryService(store, new WikiSearchAdapter(store));
        const results = await query.search('compost', { mode: 'semantic-only' });
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].matchedOn).toBe('semantic');
    });

    it('traverse walks multi-hop links (M1.5)', async () => {
        const store = new WikiDexieStore();
        await store.putPage(page('a', 'A', 'body'));
        await store.putPage(page('b', 'B', 'body'));
        await store.putPage(page('c', 'C', 'body'));
        await store.putLink({ id: 'l1', fromSlug: 'a', toSlug: 'b', kind: 'wikilink', weight: 1 });
        await store.putLink({ id: 'l2', fromSlug: 'b', toSlug: 'c', kind: 'wikilink', weight: 1 });

        const query = new WikiQueryService(store, new WikiSearchAdapter(store));
        const { nodes, links } = await query.traverse('a', { depth: 2 });

        const slugs = nodes.map((n) => n.slug).sort();
        expect(slugs).toEqual(['a', 'b', 'c']);
        expect(links.length).toBeGreaterThanOrEqual(2);
    });
});
