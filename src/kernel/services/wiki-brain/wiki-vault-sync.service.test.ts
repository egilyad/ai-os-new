// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { createWikiBrainDB, getWikiBrainDB, wikiId } from './wiki-brain-dexie';
import { WikiDexieStore } from './store.dexie';
import { WikiVaultSyncService } from './wiki-vault-sync.service';
import type { TWikiPage, TWikiSource } from '../../contracts/wiki-brain/types';

const now = () => new Date().toISOString();

function page(slug: string, title: string): TWikiPage {
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
        body: `# ${title}`,
        sha256: '',
        rawMarkdown: `---\nslug: ${slug}\ntitle: ${title}\n---\n# ${title}`,
    };
}

function source(title: string): TWikiSource {
    return {
        id: wikiId('src'),
        kind: 'markdown',
        title,
        origin: 'guide.md',
        sha256: 'x',
        sizeBytes: 10,
        language: 'en',
        contentText: '# body',
        meta: {},
        importedAt: now(),
    };
}

class FakeFile {
    kind = 'file';
    content = '';
    constructor(public name: string) {}
    async getFile() {
        return { text: async () => this.content, size: this.content.length };
    }
    async createWritable() {
        return {
            write: async (c: unknown) => {
                this.content = String(c);
            },
            close: async () => {},
        };
    }
}

class FakeDir {
    kind = 'directory';
    children = new Map<string, FakeDir | FakeFile>();
    constructor(public name: string) {}
    getDirectoryHandle(name: string, opts?: { create?: boolean }) {
        const existing = this.children.get(name);
        if (existing instanceof FakeDir) return existing;
        if (!opts?.create) throw new Error(`dir not found: ${name}`);
        const dir = new FakeDir(name);
        this.children.set(name, dir);
        return dir;
    }
    getFileHandle(name: string, opts?: { create?: boolean }) {
        const existing = this.children.get(name);
        if (existing instanceof FakeFile) return existing;
        if (!opts?.create) throw new Error(`file not found: ${name}`);
        const file = new FakeFile(name);
        this.children.set(name, file);
        return file;
    }
    async *entries(): AsyncIterableIterator<[string, FakeDir | FakeFile]> {
        yield* [...this.children.entries()];
    }
}

beforeEach(async () => {
    createWikiBrainDB('aios-wiki-brain-vault-test');
    const db = getWikiBrainDB();
    await db.delete();
    await db.open();
});

describe('wiki vault sync service', () => {
    it('exports pages and sources into wiki/ and raw/', async () => {
        const store = new WikiDexieStore();
        await store.putPage(page('quantum', 'Quantum'));
        await store.putSource(source('Guide'));

        const root = new FakeDir('vault');
        const vault = new WikiVaultSyncService(store, async () => root as never);

        await vault.attachVault();
        const result = await vault.exportToVault();

        expect(result.exported).toBe(2);
        const wikiDir = root.children.get('wiki') as FakeDir;
        expect(wikiDir.children.has('quantum.md')).toBe(true);
        const rawDir = root.children.get('raw') as FakeDir;
        expect(rawDir.children.has('Guide.md')).toBe(true);
    });

    it('imports raw markdown and skips duplicate sources', async () => {
        const store = new WikiDexieStore();

        const root = new FakeDir('vault');
        const raw = new FakeDir('raw');
        const f1 = new FakeFile('a.md');
        f1.content = '# Alpha';
        const f2 = new FakeFile('b.md');
        f2.content = '---\ntitle: Beta\nlanguage: ru\n---\nBody beta';
        raw.children.set('a.md', f1);
        raw.children.set('b.md', f2);
        root.children.set('raw', raw);

        const vault = new WikiVaultSyncService(store, async () => root as never);
        await vault.attachVault();

        const first = await vault.importFromVault();
        expect(first.imported).toBe(2);
        expect((await store.listSources()).length).toBe(2);
        expect((await store.listQueue()).filter((t) => t.status === 'pending').length).toBe(2);

        const second = await vault.importFromVault();
        expect(second.imported).toBe(0);
        expect(second.skipped).toBe(2);
    });
});
