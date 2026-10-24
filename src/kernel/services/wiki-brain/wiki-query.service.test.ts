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
        await store.putPage(page('quantum', 'Quantum theory', 'About quantum mechanics and superposition.'));
        await store.putPage(page('gardening', 'Gardening', 'About soil and compost.'));

        const query = new WikiQueryService(store, new WikiSearchAdapter(store));
        const results = await query.search('quantum');

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
});
