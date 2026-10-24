import type {
    IWikiIngestService,
    WikiIngestResult,
    WikiIngestProgress,
    IngestAnalyzeInput,
    IngestGenerateInput,
} from '../../contracts/wiki-brain/wiki-ingest.service';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';
import type { IWikiIndexService } from '../../contracts/wiki-brain/wiki-index.service';
import type { IWikiLogService } from '../../contracts/wiki-brain/wiki-log.service';
import type { IWikiSearchAdapter } from '../../contracts/wiki-brain/wiki-search-adapter';
import type { WikiLlmClient } from '../../contracts/wiki-brain/wiki-llm';
import type { TWikiSource, TWikiPage, TWikiLink } from '../../contracts/wiki-brain/types';
import { IngestAnalyzeOperation } from './operations/ingest-analyze.operation';
import { IngestGenerateOperation } from './operations/ingest-generate.operation';
import { wikiId } from './wiki-brain-dexie';

export interface WikiEventSink {
    emit(event: string, payload?: unknown): void;
}

export class WikiIngestService implements IWikiIngestService {
    private analyzeOp: IngestAnalyzeOperation;
    private generateOp: IngestGenerateOperation;
    private workerRunning = false;
    private progressCbs = new Set<(e: WikiIngestProgress) => void>();

    constructor(
        private store: IWikiStore,
        llm: WikiLlmClient,
        private events: WikiEventSink | null,
        private indexService: IWikiIndexService,
        private logService: IWikiLogService,
        private searchAdapter: IWikiSearchAdapter,
    ) {
        this.analyzeOp = new IngestAnalyzeOperation(llm);
        this.generateOp = new IngestGenerateOperation(llm);
    }

    onProgress(cb: (e: WikiIngestProgress) => void): () => void {
        this.progressCbs.add(cb);
        return () => this.progressCbs.delete(cb);
    }

    private emitProgress(sourceId: string, phase: WikiIngestProgress['phase'], pct: number) {
        for (const cb of this.progressCbs) cb({ sourceId, phase, pct });
    }

    async ingest(source: TWikiSource): Promise<WikiIngestResult> {
        const existingSource = await this.store.getSourceBySha256(source.sha256);
        if (existingSource) {
            const pages = (await this.store.listPages({ limit: 10000 })).filter((p) =>
                p.frontmatter.sources.some((s) => s.sourceId === existingSource.id),
            );
            const logEntry = await this.logService.append({
                op: 'ingest',
                actor: 'system',
                sourceId: source.id,
                pageIds: pages.map((p) => p.id),
                summary: `cached source ${source.title}`,
                details: {},
            });
            return { pages, links: [], logEntry };
        }

        await this.store.putSource(source);

        const allPages = await this.store.listPages({ limit: 2000 });
        const existingSlugs = allPages.map((p) => p.slug);
        const existingEntities = allPages
            .flatMap((p) => p.frontmatter.aliases)
            .concat(allPages.map((p) => p.frontmatter.title));

        this.emitProgress(source.id, 'analyze', 0);
        const analysis = await this.analyzeOp.run({
            source,
            existingSlugs,
            existingEntities,
        } satisfies IngestAnalyzeInput);
        this.emitProgress(source.id, 'analyze', 100);

        this.emitProgress(source.id, 'generate', 0);
        const generated = await this.generateOp.run({
            source,
            analysis,
            existingSlugs,
            language: source.language === 'auto' ? 'en' : source.language,
        } satisfies IngestGenerateInput);
        this.emitProgress(source.id, 'generate', 100);

        this.emitProgress(source.id, 'persist', 0);
        const pages: TWikiPage[] = [];
        for (const p of generated.pages) {
            const sha256 = await this.sha256(p.body);
            pages.push({
                id: wikiId('pg'),
                slug: p.frontmatter.slug,
                frontmatter: p.frontmatter,
                body: p.body,
                sha256,
                rawMarkdown: this.toRawMarkdown(p.frontmatter, p.body),
            });
        }
        await this.store.bulkPutPages(pages);

        const links: TWikiLink[] = generated.links.map((l) => ({ id: wikiId('lnk'), ...l }));
        for (const link of links) await this.store.putLink(link);

        await this.indexService.refresh();
        const logEntry = await this.logService.append(generated.logEntry);
        await this.searchAdapter.upsertPages(pages);

        this.emitProgress(source.id, 'persist', 100);
        this.events?.emit('wiki.ingest.completed', {
            sourceId: source.id,
            pageIds: pages.map((p) => p.id),
            pageSlugs: pages.map((p) => p.slug),
        });

        return { pages, links, logEntry };
    }

    async startQueueWorker(): Promise<void> {
        if (this.workerRunning) return;
        this.workerRunning = true;
        try {
            while (this.workerRunning) {                const task = await this.store.nextPending();
                if (!task) break;
                await this.store.updateTask(task.id, {
                    status: 'processing',
                    startedAt: new Date().toISOString(),
                    attempts: task.attempts + 1,
                });
                try {
                    const source = await this.store.getSource(task.sourceId);
                    if (!source) throw new Error(`Source ${task.sourceId} missing`);
                    await this.ingest(source);
                    await this.store.updateTask(task.id, {
                        status: 'done',
                        finishedAt: new Date().toISOString(),
                    });
                } catch (error) {
                    await this.store.updateTask(task.id, {
                        status: 'failed',
                        lastError: error instanceof Error ? error.message : String(error),
                        finishedAt: new Date().toISOString(),
                    });
                }
            }
        } finally {
            this.workerRunning = false;
        }
    }

    async stopQueueWorker(): Promise<void> {
        this.workerRunning = false;
    }

    async init(): Promise<void> {
        await this.startQueueWorker();
    }

    async destroy(): Promise<void> {
        await this.stopQueueWorker();
    }

    private async sha256(text: string): Promise<string> {
        const encoder = new TextEncoder();
        const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(text));
        return Array.from(new Uint8Array(buffer))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }

    private toRawMarkdown(fm: TWikiPage['frontmatter'], body: string): string {
        const lines = [
            '---',
            `slug: ${fm.slug}`,
            `title: ${fm.title}`,
            `type: ${fm.type}`,
            `sources: [${fm.sources.map((s) => `"${s.sourceId}"`).join(', ')}]`,
            `tags: [${fm.tags.map((t) => `"${t}"`).join(', ')}]`,
            `language: ${fm.language}`,
            `createdAt: ${fm.createdAt}`,
            `updatedAt: ${fm.updatedAt}`,
            `reviewState: ${fm.reviewState}`,
            '---',
            '',
        ];
        return lines.join('\n') + body;
    }
}
