/**
 * DatasetService — H.1 (Dify-style datasets, additive).
 *
 * Named collections of knowledge source ids + retrieval config (topK,
 * overlap threshold) in DAL kv. Annotation QA pairs answer first
 * (human-verified priority). Second-pass rerank = overlap re-score.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IKnowledgeService } from '../../contracts/parity';
import type { IDatasetService } from '../../contracts/rivals3';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Dataset');

interface DatasetDoc {
    id: string;
    name: string;
    sourceIds: string[];
    topK: number;
    threshold: number;
    annotations: Array<{ question: string; answer: string }>;
    createdAt: number;
}

function tokens(s: string): Set<string> {
    return new Set(s.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 2));
}

function overlap(a: string, b: string): number {
    const qa = tokens(a);
    if (qa.size === 0) return 0;
    const cb = tokens(b);
    let hit = 0;
    for (const t of qa) if (cb.has(t)) hit += 1;
    return hit / qa.size;
}

export class DatasetService implements IDatasetService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private knowledge?: IKnowledgeService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Dataset', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async createDataset(name: string, sourceIds: string[] = []): Promise<string> {
        const doc: DatasetDoc = {
            id: genId('dataset'),
            name: name.slice(0, 160),
            sourceIds: [...sourceIds],
            topK: 4,
            threshold: 0.15,
            annotations: [],
            createdAt: Date.now(),
        };
        await this.dal.kv.set(`datasets/${doc.id}`, doc);
        return doc.id;
    }

    async addAnnotation(datasetId: string, question: string, answer: string): Promise<void> {
        const doc = await this.require(datasetId);
        doc.annotations.push({ question: question.slice(0, 500), answer: answer.slice(0, 2000) });
        if (doc.annotations.length > 200) doc.annotations.splice(0, doc.annotations.length - 200);
        await this.dal.kv.set(`datasets/${datasetId}`, doc);
    }

    async query(datasetId: string, question: string, topK = 4): Promise<{
        answer: string;
        sources: string[];
        fromAnnotation: boolean;
    }> {
        const doc = await this.require(datasetId);
        // Annotations first (human-verified priority).
        let best: { question: string; answer: string } | undefined;
        let bestScore = 0.5;
        for (const a of doc.annotations) {
            const s = overlap(question, a.question);
            if (s > bestScore) {
                bestScore = s;
                best = a;
            }
        }
        if (best) {
            this.events.emit(EVENTS.DATASET_HIT, { datasetId, fromAnnotation: true });
            return { answer: best.answer, sources: ['annotation'], fromAnnotation: true };
        }
        // Retrieval over member sources (second pass = rerank by overlap).
        let hits: Array<{ title: string; chunk: string }> = [];
        if (this.knowledge) {
            const all = await this.knowledge.retrieve(question, Math.max(topK, 8));
            const membered =
                doc.sourceIds.length > 0
                    ? all.filter((h) => doc.sourceIds.includes(h.sourceId))
                    : all;
            hits = membered
                .map((h) => ({ ...h, s: overlap(question, h.chunk) }))
                .filter((h) => h.s >= doc.threshold)
                .sort((a, b) => b.s - a.s)
                .slice(0, topK);
        }
        this.events.emit(EVENTS.DATASET_HIT, { datasetId, fromAnnotation: false });
        if (hits.length === 0) {
            return { answer: `No dataset passages for: ${question.slice(0, 200)}`, sources: [], fromAnnotation: false };
        }
        return {
            answer: hits.map((h, i) => `[${i + 1}] ${h.title}: ${h.chunk.slice(0, 400)}`).join('\n'),
            sources: [...new Set(hits.map((h) => h.title))],
            fromAnnotation: false,
        };
    }

    async listDatasets(): Promise<Array<{ id: string; name: string; sources: number }>> {
        const rows = await this.dal.kv.list('datasets/');
        return rows.map((r) => {
            const d = r.value as DatasetDoc;
            return { id: d.id, name: d.name, sources: d.sourceIds.length };
        });
    }

    private async require(id: string): Promise<DatasetDoc> {
        const doc = await this.dal.kv.get<DatasetDoc>(`datasets/${id}`);
        if (!doc) throw new Error(`Dataset not found: ${id}`);
        return doc;
    }
}
