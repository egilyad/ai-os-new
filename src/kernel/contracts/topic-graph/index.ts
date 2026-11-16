export * from './types';

import type {
    Topic,
    TopicSource,
    TopicClaim,
    TopicConcept,
    TopicRelation,
    TopicEvidence,
    TopicConflict,
    TopicProcessingRun,
} from './types';

export interface IngestPayload {
    kind: TopicSource['kind'];
    ref: string;
    title: string;
    content: string;
    meta?: Record<string, unknown>;
}

export interface TopicCompleteness {
    totalClaims: number;
    uniqueConcepts: number;
    conflicts: number;
    sources: number;
    /** Оценка полноты 0..1 (по ожидаемым подтемам, если заданы). */
    coverage: number;
}

export interface TopicGraphDeps {
    llm?: {
        chat(messages: Array<{ role: string; content: string }>): Promise<{ content: string }>;
    };
    embedder?: {
        embed(texts: string[]): Promise<number[][]>;
    };
}

export interface TopicGraphService {
    createTopic(title: string, description: string): Promise<Topic>;
    listTopics(): Promise<Topic[]>;
    getTopic(id: string): Promise<Topic | undefined>;
    updateTopic(id: string, patch: Partial<Pick<Topic, 'title' | 'description' | 'status'>>): Promise<Topic | undefined>;
    deleteTopic(id: string): Promise<boolean>;

    /** Добавить источник и запустить инкрементальную обработку. */
    ingest(topicId: string, payload: IngestPayload): Promise<TopicProcessingRun>;

    sources(topicId: string): Promise<TopicSource[]>;
    claims(topicId: string): Promise<TopicClaim[]>;
    concepts(topicId: string): Promise<TopicConcept[]>;
    relations(topicId: string): Promise<TopicRelation[]>;
    evidence(topicId: string): Promise<TopicEvidence[]>;
    conflicts(topicId: string): Promise<TopicConflict[]>;
    runs(topicId: string): Promise<TopicProcessingRun[]>;

    completeness(topicId: string): Promise<TopicCompleteness>;

    /** Поиск по утверждениям темы (простая реализация; BM25 позже). */
    search(topicId: string, query: string): Promise<TopicClaim[]>;

    /** Экспорт отчёта темы в Markdown. */
    exportReport(topicId: string): Promise<string>;
}
