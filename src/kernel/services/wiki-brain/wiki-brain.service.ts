import type { IWikiBrainService } from '../../contracts/wiki-brain/wiki-brain.service';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';
import type { IWikiIngestService } from '../../contracts/wiki-brain/wiki-ingest.service';
import type { IWikiQueryService } from '../../contracts/wiki-brain/wiki-query.service';
import type { IWikiLintService } from '../../contracts/wiki-brain/wiki-lint.service';
import type { IWikiIndexService } from '../../contracts/wiki-brain/wiki-index.service';
import type { IWikiLogService } from '../../contracts/wiki-brain/wiki-log.service';
import type { IWikiGraphService } from '../../contracts/wiki-brain/wiki-graph.service';

export class WikiBrainService implements IWikiBrainService {
    constructor(
        public readonly store: IWikiStore,
        public readonly ingest: IWikiIngestService,
        public readonly query: IWikiQueryService,
        public readonly lint: IWikiLintService,
        public readonly index: IWikiIndexService,
        public readonly log: IWikiLogService,
        public readonly graph: IWikiGraphService,
    ) {}
}
