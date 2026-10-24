// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { createWikiBrainDB, getWikiBrainDB, wikiId } from './wiki-brain-dexie';
import { WikiDexieStore } from './store.dexie';
import { WikiLogService } from './wiki-log.service';
import { WikiIndexService } from './wiki-index.service';
import { WikiSearchAdapter } from './wiki-search-adapter';
import { WikiIngestService } from './wiki-ingest.service';
import type { WikiLlmClient } from '../../contracts/wiki-brain/wiki-llm';
import type { TWikiSource } from '../../contracts/wiki-brain/types';

const now = () => new Date().toISOString();

beforeEach(async () => {
    createWikiBrainDB('aios-wiki-brain-ingest-test');
    const db = getWikiBrainDB();
    await db.delete();
    await db.open();
});

function makeSource(): TWikiSource {
    return {
        id: wikiId('src'),
        kind: 'markdown',
        title: 'The Guide',
        origin: 'guide.md',
        sha256: 'sha-1',
        sizeBytes: 20,
        language: 'en',
        contentText: 'A short guide about the thing.',
        meta: {},
        importedAt: now(),
    };
}

function fakeLlm(): WikiLlmClient {
    let calls = 0;
    return {
        chat: async () => {
            calls += 1;
            if (calls === 1) {
                return {
                    content: JSON.stringify({
                        entities: [{ name: 'Thing', type: 'concept' }],
                        concepts: [{ name: 'Thing', summary: 'A thing.' }],
                        arguments: [],
                        crossLinks: [],
                        contradictions: [],
                        wikiStructureHint: { sections: ['intro'], suggestedPages: ['thing'] },
                    }),
                };
            }
            return {
                content: JSON.stringify({
                    pages: [
                        {
                            frontmatter: {
                                slug: 'thing',
                                title: 'Thing',
                                type: 'entity',
                                sources: [{ sourceId: 'src-0', title: 'The Guide', sha256: 'sha-1' }],
                                aliases: ['the thing'],
                                tags: [],
                                language: 'en',
                                createdAt: now(),
                                updatedAt: now(),
                                reviewState: 'auto',
                                graphIn: 0,
                                graphOut: 0,
                            },
                            body: '# Thing\nAbout the thing. See [[index]].',
                        },
                    ],
                    links: [{ fromSlug: 'thing', toSlug: 'index' }],
                    logEntry: {
                        op: 'ingest',
                        actor: 'llm',
                        summary: 'compiled The Guide',
                        details: {},
                    },
                }),
            };
        },
    };
}

describe('wiki ingest service', () => {
    it('runs analyze → generate → persist and records the log', async () => {
        const store = new WikiDexieStore();
        const log = new WikiLogService(store);
        const index = new WikiIndexService(store);
        const search = new WikiSearchAdapter(store);
        const ingest = new WikiIngestService(store, fakeLlm(), null, index, log, search);

        const result = await ingest.ingest(makeSource());

        expect(result.pages.length).toBe(1);
        const page = await store.getPageBySlug('thing');
        expect(page?.frontmatter.title).toBe('Thing');

        const indexPage = await store.getPageBySlug('index');
        expect(indexPage?.body).toContain('[[thing]]');

        const entries = await store.listLog();
        expect(entries.length).toBe(1);
        expect(entries[0].summary).toBe('compiled The Guide');
    });

    it('skips a re-ingest of the same sha256', async () => {
        const store = new WikiDexieStore();
        const log = new WikiLogService(store);
        const index = new WikiIndexService(store);
        const search = new WikiSearchAdapter(store);
        const ingest = new WikiIngestService(store, fakeLlm(), null, index, log, search);

        await ingest.ingest(makeSource());
        await ingest.ingest(makeSource());

        const sources = await store.listSources();
        expect(sources.length).toBe(1);
    });
});
