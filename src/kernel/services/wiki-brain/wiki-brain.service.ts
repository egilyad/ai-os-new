import type { IWikiBrainService } from '../../contracts/wiki-brain/wiki-brain.service';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';
import type { IWikiIngestService } from '../../contracts/wiki-brain/wiki-ingest.service';
import type { IWikiQueryService } from '../../contracts/wiki-brain/wiki-query.service';
import type { IWikiLintService } from '../../contracts/wiki-brain/wiki-lint.service';
import type { IWikiIndexService } from '../../contracts/wiki-brain/wiki-index.service';
import type { IWikiLogService } from '../../contracts/wiki-brain/wiki-log.service';
import type { IWikiGraphService } from '../../contracts/wiki-brain/wiki-graph.service';
import type { IWikiVaultSyncService } from '../../contracts/wiki-brain/wiki-vault-sync.service';
import type { TWikiPage } from '../../contracts/wiki-brain/types';

export class WikiBrainService implements IWikiBrainService {
    constructor(
        public readonly store: IWikiStore,
        public readonly ingest: IWikiIngestService,
        public readonly query: IWikiQueryService,
        public readonly lint: IWikiLintService,
        public readonly index: IWikiIndexService,
        public readonly log: IWikiLogService,
        public readonly graph: IWikiGraphService,
        public readonly vault: IWikiVaultSyncService,
    ) {}

    async getCore(): Promise<TWikiPage | undefined> {
        const pages = await this.store.listPages({ limit: 10000 });
        const core = pages.find((p) => p.frontmatter.type === 'core');
        return core;
    }

    async getRecent(k: number): Promise<TWikiPage[]> {
        const pages = await this.store.listPages({ limit: 10000 });
        return pages
            .sort((a, b) => b.frontmatter.updatedAt.localeCompare(a.frontmatter.updatedAt))
            .slice(0, k);
    }

    async getTimeline(start: string, end: string): Promise<TWikiPage[]> {
        const pages = await this.store.listPages({ limit: 10000 });
        return pages
            .filter((p) => p.frontmatter.updatedAt >= start && p.frontmatter.updatedAt <= end)
            .sort((a, b) => a.frontmatter.updatedAt.localeCompare(b.frontmatter.updatedAt));
    }
}
