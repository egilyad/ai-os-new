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

export interface TopicCompletenessCriteria {
    name: string;
    /** Оценка критерия 0..1. */
    score: number;
}

export interface TopicCompleteness {
    totalClaims: number;
    uniqueConcepts: number;
    conflicts: number;
    sources: number;
    /**
     * Предварительная оценка накопления материала 0..1 (НЕ полнота раскрытия
     * темы: для настоящей coverage нужны заданные аспекты/подтемы).
     */
    coverage: number;
    /** Алиас с честным именем: накопление материала. */
    collectionProgress: number;
    /** Разбиение оценки по критериям. */
    criteria: TopicCompletenessCriteria[];
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
    /** Удаление только при confirm: true (каскадное, уничтожает источники). */
    deleteTopic(id: string, confirm?: boolean): Promise<boolean>;
    /** Архивирование: сохраняет все данные, тема уходит из активных. */
    archiveTopic(id: string): Promise<Topic | undefined>;

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

    /** Поиск по утверждениям темы (jaccard + cosine + graph expansion). */
    search(topicId: string, query: string): Promise<TopicClaim[]>;

    /** Ручная консолидация: глобальная синхронизация концептов и иерархии. */
    consolidate(topicId: string): Promise<void>;

    /** Нормализованная степень центральности узлов (claims + концепты). */
    centrality(
        topicId: string,
    ): Promise<Array<{ id: string; kind: 'claim' | 'concept'; degree: number; normalized: number }>>;

    /** Экспорт отчёта темы в Markdown. */
    exportReport(topicId: string): Promise<string>;

    /** Экспорт отчёта темы в файл проекта (TopicResults/<slug>.md). */
    exportToProject(
        repo: {
            putFile(input: {
                projectId: string;
                path: string;
                content: string;
                createdAt: number;
                updatedAt: number;
            }): Promise<void>;
        },
        projectId: string,
        topicId: string,
    ): Promise<{ path: string } | undefined>;
}
