// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { createWikiBrainDB, getWikiBrainDB, wikiId } from './wiki-brain-dexie';
import { WikiDexieStore } from './store.dexie';
import { WikiLintService } from './wiki-lint.service';
import type { IWikiGraphService } from '../../contracts/wiki-brain/wiki-graph.service';
import type { TWikiPage } from '../../contracts/wiki-brain/types';

const now = () => new Date().toISOString();

function page(slug: string, title: string, aliases: string[] = [], body = ''): TWikiPage {
    return {
        id: wikiId('pg'),
        slug,
        frontmatter: {
            slug,
            title,
            type: 'entity',
            sources: [],
            aliases,
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
    createWikiBrainDB('aios-wiki-brain-lint-test');
    const db = getWikiBrainDB();
    await db.delete();
    await db.open();
});

describe('wiki lint service', () => {
    it('finds dead links and duplicate entities', async () => {
        const store = new WikiDexieStore();
        await store.putPage(page('a', 'Thing A', ['thing'], '# A\nSee [[missing]].'));
        await store.putPage(page('b', 'Thing B', ['thing'], '# B'));

        const lint = new WikiLintService(store);
        const issues = await lint.runAll();

        expect(issues.some((i) => i.rule === 'dead-wikilink')).toBe(true);
        expect(issues.some((i) => i.rule === 'duplicate-entity')).toBe(true);
    });

    it('flags stale and missing sources', async () => {
        const store = new WikiDexieStore();
        const ts = now();
        await store.putSource({
            id: 'src-1',
            kind: 'markdown',
            title: 'Old guide',
            origin: 'guide.md',
            sha256: 'sha-new',
            sizeBytes: 10,
            language: 'en',
            contentText: 'x',
            meta: {},
            importedAt: ts,
        });
        await store.putPage({
            id: 'pg-1',
            slug: 'guide',
            frontmatter: {
                slug: 'guide',
                title: 'Guide',
                type: 'source-summary',
                sources: [
                    { sourceId: 'src-1', title: 'Old guide', sha256: 'sha-old' },
                    { sourceId: 'src-missing', title: 'Gone', sha256: 'x' },
                ],
                aliases: [],
                tags: [],
                language: 'en',
                createdAt: ts,
                updatedAt: ts,
                reviewState: 'auto',
                graphIn: 0,
                graphOut: 0,
            },
            body: '# Guide',
            sha256: '',
            rawMarkdown: '',
        });

        const lint = new WikiLintService(store);
        const issues = await lint.runAll();
        const stale = issues.filter((i) => i.rule === 'stale-source');
        expect(stale.length).toBe(2);
    });

    it('flags low-cohesion clusters when a graph is available', async () => {
        const store = new WikiDexieStore();
        await store.putPage(page('a', 'Thing A'));
        await store.putPage(page('b', 'Thing B'));

        const graph: IWikiGraphService = {
            similarity: async () => ({ signals: {}, total: 0 }),
            detectCommunities: async () => [
                { id: 'community-0', slugs: ['a', 'b'], cohesion: 0.1 },
            ],
            toFlowGraph: async () => ({ nodes: [], edges: [] }),
        };

        const lint = new WikiLintService(store, graph);
        const issues = await lint.runAll();
        const cluster = issues.filter((i) => i.rule === 'low-cohesion-cluster');
        expect(cluster.length).toBe(1);
    });
});
