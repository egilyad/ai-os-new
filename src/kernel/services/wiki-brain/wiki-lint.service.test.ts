// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { createWikiBrainDB, getWikiBrainDB, wikiId } from './wiki-brain-dexie';
import { WikiDexieStore } from './store.dexie';
import { WikiLintService } from './wiki-lint.service';
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
});
