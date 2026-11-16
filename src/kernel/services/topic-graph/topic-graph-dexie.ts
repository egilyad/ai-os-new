import Dexie, { type Table } from 'dexie';
import type {
    Topic,
    TopicSource,
    TopicClaim,
    TopicConcept,
    TopicRelation,
    TopicEvidence,
    TopicConflict,
    TopicProcessingRun,
} from '../../contracts/topic-graph/types';

/**
 * TopicGraphDB — отдельное хранилище домена Topic Graph.
 * Не зависит от Wiki-Brain и ProjectGraph.
 */
export class TopicGraphDB extends Dexie {
    topics!: Table<Topic, string>;
    topicSources!: Table<TopicSource, string>;
    topicClaims!: Table<TopicClaim, string>;
    topicConcepts!: Table<TopicConcept, string>;
    topicRelations!: Table<TopicRelation, string>;
    topicEvidence!: Table<TopicEvidence, string>;
    topicConflicts!: Table<TopicConflict, string>;
    topicProcessingRuns!: Table<TopicProcessingRun, string>;

    constructor(dbName = 'aios-topic-graph') {
        super(dbName);
        this.version(1).stores({
            topics: 'id, status, createdAt',
            topicSources: 'id, topicId, sha256, importedAt',
            topicClaims: 'id, topicId, status, createdAt',
            topicConcepts: 'id, topicId, name',
            topicRelations: 'id, topicId, relation, fromId, toId',
            topicEvidence: 'id, topicId, claimId, sourceId',
            topicConflicts: 'id, topicId, claimAId, claimBId, resolved',
            topicProcessingRuns: 'id, topicId, status, createdAt',
        });
    }
}

let _db: TopicGraphDB | undefined;

export function createTopicGraphDB(dbName = 'aios-topic-graph'): TopicGraphDB {
    if (!_db) _db = new TopicGraphDB(dbName);
    return _db;
}

/** @internal для тестов. */
export function getTopicGraphDB(): TopicGraphDB {
    if (!_db) _db = new TopicGraphDB();
    return _db;
}
