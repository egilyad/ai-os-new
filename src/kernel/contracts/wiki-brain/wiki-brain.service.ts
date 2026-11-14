import type { IWikiStore } from './wiki-store';
import type { IWikiIngestService } from './wiki-ingest.service';
import type { IWikiQueryService } from './wiki-query.service';
import type { IWikiLintService } from './wiki-lint.service';
import type { IWikiIndexService } from './wiki-index.service';
import type { IWikiLogService } from './wiki-log.service';
import type { IWikiGraphService } from './wiki-graph.service';
import type { IWikiVaultSyncService } from './wiki-vault-sync.service';
import type { TWikiPage } from './types';

export interface IWikiBrainService {
    readonly store: IWikiStore;
    readonly ingest: IWikiIngestService;
    readonly query: IWikiQueryService;
    readonly lint: IWikiLintService;
    readonly index: IWikiIndexService;
    readonly log: IWikiLogService;
    readonly graph: IWikiGraphService;
    readonly vault: IWikiVaultSyncService;
    /** F2 — SoMem Core page (always-loaded context). */
    getCore(): Promise<TWikiPage | undefined>;
    /** F2 — derived view: K newest pages. */
    getRecent(k: number): Promise<TWikiPage[]>;
    /** F2 — derived view: pages updated within a date range. */
    getTimeline(start: string, end: string): Promise<TWikiPage[]>;
}

export interface WikiBrainInitOptions {
    dexieDbName?: string;
    enableSemanticSearch?: boolean;
    ingestModelRef?: string;
    budgetPool?: string;
}
