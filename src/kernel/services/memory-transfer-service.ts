import type {
    IMemoryTransferService,
    MemoryExport,
    MemoryImport,
    ExportFormat,
} from '../contracts/memory-transfer';
import type { IMemoryEngine } from '../contracts/memory';
import type { MemoryEntry } from '../types/memory-types';
import type { IDatabaseService } from '../types/interfaces';
import { rootLogger } from './logger-service';

const MAX_IMPORT_ENTRIES = 10_000;
const MAX_ENTRY_CONTENT_LENGTH = 100_000;
const VALID_IMPORT_TYPES = new Set([
    'fact',
    'claim',
    'observation',
    'summary',
    'imported',
    undefined,
]);

const LOGGER = rootLogger.child('MemoryTransferService');
const genId = () => crypto.randomUUID();
const EXPORT_HISTORY_KEY = 'memory_transfer_exports';
const IMPORT_HISTORY_KEY = 'memory_transfer_imports';
const MAX_HISTORY = 100;

export interface MemoryTransferServiceDeps {
    memoryService: IMemoryEngine;
    database: IDatabaseService;
}

function serializeEntryToJson(entry: MemoryEntry): string {
    return JSON.stringify({
        id: entry.id,
        content: entry.content,
        metadata: entry.metadata,
        vector: entry.vector,
    });
}

function serializeEntryToCsv(entry: MemoryEntry): string {
    const meta = entry.metadata;
    const content = entry.content.replace(/"/g, '""').replace(/\n/g, '\\n');
    const source = (meta.source ?? '').replace(/"/g, '""');
    const type = (meta.type ?? '').replace(/"/g, '""');
    return `"${content}","${source}","${type}","${meta.timestamp ?? 0}","${meta.importance ?? 0}"`;
}

const CSV_HEADER = '"content","source","type","timestamp","importance"';

function serializeEntryToMarkdown(entry: MemoryEntry): string {
    const meta = entry.metadata;
    const section = meta.source && meta.type ? `${meta.source}:${meta.type}` : 'General';
    return `## ${section}\n> *Source: ${meta.source ?? 'unknown'} | Type: ${meta.type ?? 'unknown'} | Timestamp: ${new Date(meta.timestamp ?? Date.now()).toISOString()} | Importance: ${meta.importance ?? 0}*\n\n${entry.content}\n`;
}

/**
 * Memory transfer service — real format parsers for JSON, CSV, and Markdown.
 */
export class MemoryTransferService implements IMemoryTransferService {
    private exports: MemoryExport[] = [];
    private imports: MemoryImport[] = [];
    private db: IDatabaseService;
    private memory: IMemoryEngine;
    private initialized = false;

    constructor(deps: MemoryTransferServiceDeps) {
        this.db = deps.database;
        this.memory = deps.memoryService;
    }

    async init(): Promise<void> {
        if (this.initialized) return;
        this.initialized = true;
        try {
            const [savedExports, savedImports] = await Promise.all([
                this.db.getKv<MemoryExport[]>(EXPORT_HISTORY_KEY),
                this.db.getKv<MemoryImport[]>(IMPORT_HISTORY_KEY),
            ]);
            if (savedExports) this.exports = savedExports.slice(-MAX_HISTORY);
            if (savedImports) this.imports = savedImports.slice(-MAX_HISTORY);
        } catch (e) {
            LOGGER.warn('init', 'Failed to load persisted history', { error: String(e) });
        }
    }

    private async persistExports(): Promise<void> {
        try {
            await this.db.setKv(EXPORT_HISTORY_KEY, this.exports.slice(-MAX_HISTORY));
        } catch (e) {
            LOGGER.warn('persistExports', 'Failed', { error: String(e) });
        }
    }

    private async persistImports(): Promise<void> {
        try {
            await this.db.setKv(IMPORT_HISTORY_KEY, this.imports.slice(-MAX_HISTORY));
        } catch (e) {
            LOGGER.warn('persistImports', 'Failed', { error: String(e) });
        }
    }

    export(format: ExportFormat, sections: string[]): MemoryExport {
        const allMemories = this.memory.getMemories();

        const filtered =
            sections.length > 0 && sections[0] !== '*'
                ? allMemories.filter(
                      (m) =>
                          sections.includes(m.metadata.type ?? '') ||
                          sections.includes(m.metadata.source ?? ''),
                  )
                : allMemories;

        let data: string;
        switch (format) {
            case 'json':
                data = `[\n${filtered.map(serializeEntryToJson).join(',\n')}\n]`;
                break;
            case 'csv':
                data = `${CSV_HEADER}\n${filtered.map(serializeEntryToCsv).join('\n')}`;
                break;
            case 'markdown':
            default:
                data = `# Memory Export\nGenerated: ${new Date().toISOString()}\nEntries: ${filtered.length}\n\n${filtered.map(serializeEntryToMarkdown).join('\n---\n')}`;
                break;
        }

        const exportEntry: MemoryExport = {
            format,
            sections,
            data,
            createdAt: Date.now(),
            size: new TextEncoder().encode(data).length,
        };
        this.exports.push(exportEntry);
        void this.persistExports();
        return { ...exportEntry };
    }

    getExportHistory(): MemoryExport[] {
        return this.exports.map((e) => ({ ...e }));
    }

    async import(data: string, format: ExportFormat): Promise<MemoryImport> {
        const id = genId();
        if (data.length > MAX_IMPORT_ENTRIES * MAX_ENTRY_CONTENT_LENGTH) {
            return {
                id,
                source: 'import',
                format,
                entriesCount: 0,
                status: 'failed',
                createdAt: Date.now(),
                error: 'Import data exceeds maximum size',
            };
        }
        try {
            let entries: Omit<MemoryEntry, 'id'>[] = [];

            switch (format) {
                case 'json': {
                    const parsed = JSON.parse(data);
                    const rawList = Array.isArray(parsed) ? parsed : [parsed];
                    if (rawList.length > MAX_IMPORT_ENTRIES) {
                        return {
                            id,
                            source: 'import',
                            format,
                            entriesCount: 0,
                            status: 'failed',
                            createdAt: Date.now(),
                            error: `Import exceeds max ${MAX_IMPORT_ENTRIES} entries`,
                        };
                    }
                    entries = rawList
                        .filter((r: Record<string, unknown>) => typeof r.content === 'string')
                        .map((r: Record<string, unknown>) => {
                            const content = (r.content as string).slice(
                                0,
                                MAX_ENTRY_CONTENT_LENGTH,
                            );
                            const type = (r.metadata as Record<string, unknown>)?.type as
                                string | undefined;
                            if (type !== undefined && !VALID_IMPORT_TYPES.has(type)) {
                                throw new Error(`Invalid memory type: "${type}"`);
                            }
                            return {
                                content,
                                metadata: {
                                    source:
                                        ((r.metadata as Record<string, unknown>)
                                            ?.source as string) ?? 'import',
                                    type: type ?? 'imported',
                                    timestamp:
                                        ((r.metadata as Record<string, unknown>)
                                            ?.timestamp as number) ?? Date.now(),
                                    importance:
                                        ((r.metadata as Record<string, unknown>)
                                            ?.importance as number) ?? 0.5,
                                },
                                vector: Array.isArray(r.vector)
                                    ? (r.vector as number[])
                                    : undefined,
                            };
                        });
                    break;
                }
                case 'csv': {
                    const lines = data
                        .split('\n')
                        .filter((l) => l.trim() && !l.startsWith('"content",'))
                        .slice(0, MAX_IMPORT_ENTRIES);
                    for (const line of lines) {
                        const parts = line.match(/"(?:[^"]|"")*"/g);
                        if (!parts || parts.length < 3) continue;
                        const content = parts[0]
                            .replace(/""/g, '"')
                            .replace(/\\n/g, '\n')
                            .slice(1, -1);
                        const source = parts[1]!.slice(1, -1);
                        const type = parts[2]!.slice(1, -1);
                        const timestamp = parts[3]
                            ? Number(parts[3].replace(/"/g, ''))
                            : Date.now();
                        const importance = parts[4] ? Number(parts[4].replace(/"/g, '')) : 0.5;
                        entries.push({
                            content,
                            metadata: { source, type, timestamp, importance },
                        });
                    }
                    break;
                }
                case 'markdown':
                default: {
                    const sections = data.split('## ').filter(Boolean).slice(0, MAX_IMPORT_ENTRIES);
                    for (const section of sections) {
                        const lines = section.split('\n').filter(Boolean);
                        const sectionName = lines[0]?.trim() ?? 'General';
                        const contentLines = lines.slice(2).filter((l) => !l.startsWith('>'));
                        const content = contentLines
                            .join('\n')
                            .trim()
                            .slice(0, MAX_ENTRY_CONTENT_LENGTH);
                        if (content) {
                            entries.push({
                                content,
                                metadata: {
                                    source: 'import',
                                    type: sectionName,
                                    timestamp: Date.now(),
                                    importance: 0.5,
                                },
                            });
                        }
                    }
                }
            }

            const entryCount = entries.length;

            if (entryCount > 0) {
                await this.memory.storeBatch(entries);
            }

            const importEntry: MemoryImport = {
                id,
                source: 'import',
                format,
                entriesCount: entryCount,
                status: 'completed',
                createdAt: Date.now(),
            };
            this.imports.push(importEntry);
            void this.persistImports();
            return { ...importEntry };
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            LOGGER.warn('import', `Import failed (${format})`, { error: msg });
            const importEntry: MemoryImport = {
                id,
                source: 'import',
                format,
                entriesCount: 0,
                status: 'failed',
                createdAt: Date.now(),
                error: msg,
            };
            this.imports.push(importEntry);
            void this.persistImports();
            return { ...importEntry };
        }
    }

    getImportHistory(): MemoryImport[] {
        return this.imports.map((i) => ({ ...i }));
    }

    previewImport(data: string, format: ExportFormat): { sections: string[]; entries: number } {
        if (format === 'json') {
            try {
                const parsed = JSON.parse(data);
                const list = Array.isArray(parsed) ? parsed : [parsed];
                const sections = [
                    ...new Set(
                        list.map(
                            (r: Record<string, unknown>) =>
                                ((r.metadata as Record<string, unknown>)?.type as string) ??
                                'General',
                        ),
                    ),
                ] as string[];
                return { sections, entries: list.length };
            } catch {
                return { sections: ['General'], entries: 0 };
            }
        }
        const headings = data.match(/^##\s+(.+)$/gm);
        const sections = headings
            ? [...new Set(headings.map((h) => h.replace(/^##\s+/, '').trim()))]
            : ['General'];
        const entries = sections.length;
        return { sections, entries };
    }

    destroy(): void {
        this.initialized = false;
        this.exports = [];
        this.imports = [];
    }
}
