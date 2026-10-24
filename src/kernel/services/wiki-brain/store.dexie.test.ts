// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { createWikiBrainDB, getWikiBrainDB, wikiId } from './wiki-brain-dexie';
import { WikiDexieStore } from './store.dexie';
import type { TWikiSource, TWikiPage, TWikiLogEntry } from '../../contracts/wiki-brain/types';

const now = () => new Date().toISOString();

beforeEach(async () => {
    createWikiBrainDB('aios-wiki-brain-test');
    const db = getWikiBrainDB();
    await db.delete();
    await db.open();
});

describe('wiki dexie store', () => {
    it('round-trips sources and dedupes by sha256', async () => {
        const store = new WikiDexieStore();
        const source: TWikiSource = {
            id: wikiId('src'),
            kind: 'markdown',
            title: 'Guide',
            origin: 'guide.md',
            sha256: 'abc123',
            sizeBytes: 10,
            language: 'en',
            contentText: 'hello',
            meta: {},
            importedAt: now(),
        };
        await store.putSource(source);
        expect((await store.getSourceBySha256('abc123'))?.id).toBe(source.id);
        expect((await store.listSources()).length).toBe(1);
    });

    it('stores pages and finds them by slug', async () => {
        const store = new WikiDexieStore();
        const page: TWikiPage = {
            id: wikiId('pg'),
            slug: 'guide',
            frontmatter: {
                slug: 'guide',
                title: 'Guide',
                type: 'source-summary',
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
            body: '# Guide',
            sha256: 'x',
            rawMarkdown: '---\nslug: guide\n---\n# Guide',
        };
        await store.putPage(page);
        expect((await store.getPageBySlug('guide'))?.id).toBe(page.id);
    });

    it('appends log entries newest first', async () => {
        const store = new WikiDexieStore();
        for (const i of [1, 2, 3]) {
            const entry: TWikiLogEntry = {
                id: wikiId('log'),
                ts: new Date(Date.now() + i * 1000).toISOString(),
                op: 'ingest',
                actor: 'system',
                sourceId: `s${i}`,
                pageIds: [],
                summary: `run ${i}`,
                details: {},
            };
            await store.appendLog(entry);
        }
        const log = await store.listLog({ limit: 2 });
        expect(log[0].summary).toBe('run 3');
    });
});
