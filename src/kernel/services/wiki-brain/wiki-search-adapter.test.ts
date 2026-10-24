// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { createWikiBrainDB, getWikiBrainDB, wikiId } from './wiki-brain-dexie';
import { WikiDexieStore } from './store.dexie';
import { WikiSearchAdapter } from './wiki-search-adapter';
import { DefaultEmbeddingService } from '../parity/default-embedding-service';
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
    createWikiBrainDB('aios-wiki-brain-search-test');
    const db = getWikiBrainDB();
    await db.delete();
    await db.open();
});

describe('wiki search adapter', () => {
    it('ranks by BM25 without an embedder', async () => {
        const store = new WikiDexieStore();
        await store.putPage(page('quantum', 'Quantum theory', 'About quantum mechanics and superposition.'));
        await store.putPage(page('gardening', 'Gardening', 'About soil and compost.'));

        const adapter = new WikiSearchAdapter(store);
        const hits = await adapter.bm25('quantum', 5);
        expect(hits.length).toBe(1);
        expect(hits[0].pageId).toBe((await store.getPageBySlug('quantum'))!.id);
    });

    it('supports semantic retrieval with an embedder', async () => {
        const store = new WikiDexieStore();
        await store.putPage(page('gardening', 'Gardening', 'About soil and compost.'));
        await store.putPage(page('cooking', 'Cooking', 'About recipes and ingredients.'));

        const adapter = new WikiSearchAdapter(store, new DefaultEmbeddingService());
        await adapter.upsertPages(await store.listPages());
        const hits = await adapter.semantic('compost', 5);
        expect(hits.length).toBeGreaterThan(0);
        expect(hits[0].pageId).toBe((await store.getPageBySlug('gardening'))!.id);
    });
});
