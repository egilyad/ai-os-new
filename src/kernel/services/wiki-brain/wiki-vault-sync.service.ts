import type {
    IWikiVaultSyncService,
    WikiVaultSyncResult,
    WikiVaultAttachOptions,
} from '../../contracts/wiki-brain/wiki-vault-sync.service';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';
import type { TWikiSource, TWikiLogEntry } from '../../contracts/wiki-brain/types';
import { wikiId } from './wiki-brain-dexie';

type FSDirHandle = FileSystemDirectoryHandle & {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
};

interface ParsedMarkdown {
    frontmatter: Record<string, unknown>;
    body: string;
}

function parseFrontmatter(text: string): ParsedMarkdown {
    const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
    if (!match) return { frontmatter: {}, body: text };
    const frontmatter: Record<string, unknown> = {};
    for (const line of match[1]!.split('\n')) {
        const idx = line.indexOf(':');
        if (idx < 0) continue;
        const key = line.slice(0, idx).trim();
        let value: string = line.slice(idx + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        frontmatter[key] = value;
    }
    return { frontmatter, body: match[2]! };
}

function safeFileName(name: string): string {
    const clean = name.replace(/[^\w\s\-.]/g, '-').trim();
    return clean || 'untitled';
}

export class WikiVaultSyncService implements IWikiVaultSyncService {
    private root: FileSystemDirectoryHandle | null = null;

    constructor(
        private store: IWikiStore,
        private picker?: (opts?: { mode?: string }) => Promise<FileSystemDirectoryHandle>,
    ) {}

    isAttached(): boolean {
        return this.root !== null;
    }

    getVaultName(): string | null {
        return this.root?.name ?? null;
    }

    async attachVault(opts: WikiVaultAttachOptions = {}): Promise<WikiVaultSyncResult> {
        if (!this.picker && (typeof window === 'undefined' || !('showDirectoryPicker' in window))) {
            throw new Error('File System Access API not supported in this browser');
        }
        const mode = opts.mode ?? 'readwrite';
        try {
            const handle = this.picker
                ? await this.picker({ mode })
                : await (
                      window as unknown as {
                          showDirectoryPicker: (opts?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
                      }
                  ).showDirectoryPicker({ mode });
            this.root = handle;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                // user cancelled — keep current state
            } else {
                this.root = null;
                throw error;
            }
        }
        return this.result();
    }

    async detachVault(): Promise<void> {
        this.root = null;
    }

    async exportToVault(): Promise<WikiVaultSyncResult> {
        const root = this.requireRoot();
        const pages = await this.store.listPages({ limit: 10000 });
        const sources = await this.store.listSources({ limit: 10000 });

        const wikiDir = await root.getDirectoryHandle('wiki', { create: true });
        const rawDir = await root.getDirectoryHandle('raw', { create: true });

        let exported = 0;
        for (const page of pages) {
            await this.writeText(wikiDir, `${safeFileName(page.slug)}.md`, page.rawMarkdown);
            exported += 1;
        }
        for (const source of sources) {
            await this.writeText(rawDir, `${safeFileName(source.title)}.md`, this.sourceToMarkdown(source));
            exported += 1;
        }

        await this.appendLog('export', { pages: pages.length, sources: sources.length });
        return { ...this.result(), exported, imported: 0, skipped: 0 };
    }

    async importFromVault(): Promise<WikiVaultSyncResult> {
        const root = this.requireRoot();
        let rawDir: FileSystemDirectoryHandle;
        try {
            rawDir = await root.getDirectoryHandle('raw', { create: false });
        } catch {
            return { ...this.result(), exported: 0, imported: 0, skipped: 0 };
        }

        let imported = 0;
        let skipped = 0;
        for await (const [name, entry] of (rawDir as FSDirHandle).entries()) {
            if (entry.kind !== 'file') continue;
            if (!name.toLowerCase().endsWith('.md')) continue;

            const fileHandle = entry as FileSystemFileHandle;
            const content = await (await fileHandle.getFile()).text();
            const sha256 = await this.sha256(content);

            const existing = await this.store.getSourceBySha256(sha256);
            if (existing) {
                skipped += 1;
                continue;
            }

            const { frontmatter, body } = parseFrontmatter(content);
            const title =
                typeof frontmatter.title === 'string' && frontmatter.title
                    ? frontmatter.title
                    : name.replace(/\.md$/i, '');
            const language =
                typeof frontmatter.language === 'string' ? frontmatter.language : 'auto';

            const source: TWikiSource = {
                id: wikiId('src'),
                kind: 'markdown',
                title,
                origin: `vault:raw/${name}`,
                sha256,
                sizeBytes: content.length,
                language: language as TWikiSource['language'],
                contentText: body.trim() || content,
                meta: { vault: this.getVaultName() ?? '', fileName: name },
                importedAt: new Date().toISOString(),
            };

            await this.store.putSource(source);
            await this.store.enqueue({
                id: wikiId('task'),
                sourceId: source.id,
                status: 'pending',
                attempts: 0,
                priority: 0,
            });
            imported += 1;
        }

        await this.appendLog('import', { imported, skipped });
        return { ...this.result(), exported: 0, imported, skipped };
    }

    private result(): WikiVaultSyncResult {
        return {
            attached: this.isAttached(),
            name: this.getVaultName(),
            exported: 0,
            imported: 0,
            skipped: 0,
        };
    }

    private requireRoot(): FileSystemDirectoryHandle {
        if (!this.root) throw new Error('No vault attached — call attachVault() first');
        return this.root;
    }

    private async writeText(
        dir: FileSystemDirectoryHandle,
        name: string,
        content: string,
    ): Promise<void> {
        const fileHandle = await dir.getFileHandle(name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    }

    private sourceToMarkdown(source: TWikiSource): string {
        const lines = [
            '---',
            `title: ${source.title}`,
            `kind: ${source.kind}`,
            `origin: ${source.origin}`,
            `language: ${source.language}`,
            `importedAt: ${source.importedAt}`,
            '---',
            '',
            source.contentText,
        ];
        return lines.join('\n');
    }

    private async sha256(text: string): Promise<string> {
        const encoder = new TextEncoder();
        const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(text));
        return Array.from(new Uint8Array(buffer))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }

    private async appendLog(op: TWikiLogEntry['op'], details: Record<string, unknown>): Promise<void> {
        const entry: TWikiLogEntry = {
            id: wikiId('log'),
            ts: new Date().toISOString(),
            op,
            actor: 'user',
            pageIds: [],
            summary: `vault ${op} (${this.getVaultName() ?? 'unknown'})`,
            details,
        };
        await this.store.appendLog(entry);
    }
}
