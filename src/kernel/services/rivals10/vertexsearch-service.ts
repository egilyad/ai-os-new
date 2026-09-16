/**
 * VertexSearchService — P.2 (boost/bury search app, additive).
 *
 * An app binds a DatasetService dataset; boost terms up-rank hits,
 * bury terms drop them. Answer delegates to the dataset query with
 * rerank applied on top.
 */
import type { DataAccessLayer } from '../../dal/types';
import type { IDatasetService } from '../../contracts/rivals3';
import type { IVertexSearchService } from '../../contracts/rivals10';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('VertexSearch');

interface AppDoc {
    id: string;
    datasetId?: string;
    boost: string[];
    bury: string[];
}

export class VertexSearchService implements IVertexSearchService {
    constructor(
        private dal: DataAccessLayer,
        private datasets?: IDatasetService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('VertexSearch', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async bindDatastore(appId: string, datasetId: string): Promise<void> {
        const doc = await this.load(appId);
        doc.datasetId = datasetId;
        await this.dal.kv.set(`vertex/${appId.slice(0, 120)}`, doc);
    }

    async boost(appId: string, terms: string[]): Promise<void> {
        const doc = await this.load(appId);
        doc.boost = [...new Set([...doc.boost, ...terms.map((t) => t.toLowerCase().slice(0, 80))])].slice(0, 40);
        await this.dal.kv.set(`vertex/${appId.slice(0, 120)}`, doc);
    }

    async bury(appId: string, terms: string[]): Promise<void> {
        const doc = await this.load(appId);
        doc.bury = [...new Set([...doc.bury, ...terms.map((t) => t.toLowerCase().slice(0, 80))])].slice(0, 40);
        await this.dal.kv.set(`vertex/${appId.slice(0, 120)}`, doc);
    }

    async answer(appId: string, query: string): Promise<string> {
        const doc = await this.load(appId);
        if (!doc.datasetId || !this.datasets) {
            throw new Error(`Search app ${appId} has no datastore bound`);
        }
        const res = await this.datasets.query(doc.datasetId, query, 8);
        if (res.fromAnnotation) return res.answer;
        const lower = query.toLowerCase();
        void lower;
        // Bury filter + boost rerank over the answer lines.
        const lines = res.answer.split('\n');
        const kept = lines.filter((l) => !doc.bury.some((b) => l.toLowerCase().includes(b)));
        kept.sort((a, b) => {
            const score = (l: string): number => {
                const ll = l.toLowerCase();
                return doc.boost.reduce((s, term) => s + (ll.includes(term) ? 1 : 0), 0);
            };
            return score(b) - score(a);
        });
        const sources = res.sources.join(', ');
        return `${kept.slice(0, 6).join('\n')}\n(sources: ${sources || 'none'})`.slice(0, 4000);
    }

    private async load(appId: string): Promise<AppDoc> {
        const clean = appId.slice(0, 120);
        return (
            (await this.dal.kv.get<AppDoc>(`vertex/${clean}`)) ?? {
                id: clean,
                boost: [],
                bury: [],
            }
        );
    }
}
