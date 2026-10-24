import type { IWikiStore } from './wiki-store';
import type { IWikiIngestService } from './wiki-ingest.service';
import type { IWikiQueryService } from './wiki-query.service';
import type { IWikiLintService } from './wiki-lint.service';
import type { IWikiIndexService } from './wiki-index.service';
import type { IWikiLogService } from './wiki-log.service';
import type { IWikiGraphService } from './wiki-graph.service';
import type { IWikiVaultSyncService } from './wiki-vault-sync.service';

export interface IWikiBrainService {
    readonly store: IWikiStore;
    readonly ingest: IWikiIngestService;
    readonly query: IWikiQueryService;
    readonly lint: IWikiLintService;
    readonly index: IWikiIndexService;
    readonly log: IWikiLogService;
    readonly graph: IWikiGraphService;
    readonly vault: IWikiVaultSyncService;
}

export interface WikiBrainInitOptions {
    dexieDbName?: string;
    enableSemanticSearch?: boolean;
    ingestModelRef?: string;
    budgetPool?: string;
}
