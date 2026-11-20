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
     * Агрегированная оценка полноты темы 0..1 (на основе сущностей —
     * см. примечание: для настоящей coverage нужны аспекты/подтемы).
     */
    coverage: number;
    /** Прогресс в рамках темы: покрытие аспектов. */
    collectionProgress: number;
    /** Критерии полноты по сущностям. */
    criteria: TopicCompletenessCriteria[];
    /** Покрытие по аспектам (Фаза 4): доля аспектов с фактами. */
    aspectCoverage?: {
        total: number;
        covered: number;
        partial: number;
        empty: number;
        byAspect: Array<{ name: string; status: 'covered' | 'partial' | 'empty'; count: number }>;
    };
}

export interface TopicAspect {
    id: string;
    topicId: string;
    name: string;
    /** Аспект считается закрытым, если есть >= minFacts фактов высокого статуса. */
    minFacts?: number;
    claimIds: string[];
    createdAt: number;
    updatedAt: number;
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
    updateTopic(
        id: string,
        patch: Partial<Pick<Topic, 'title' | 'description' | 'status'>>,
    ): Promise<Topic | undefined>;
    /** Удаление только при confirm: true (каскадное, уничтожает источники). */
    deleteTopic(id: string, confirm?: boolean): Promise<boolean>;
    /** Архивирование: сохраняет все данные, тема уходит из активных. */
    archiveTopic(id: string): Promise<Topic | undefined>;

    /** Добавить источник и запустить инкрементальную обработку. */
    ingest(
        topicId: string,
        payload: IngestPayload,
        opts?: { useLlm?: boolean; useEmbedder?: boolean },
    ): Promise<TopicProcessingRun>;

    sources(topicId: string): Promise<TopicSource[]>;
    claims(topicId: string): Promise<TopicClaim[]>;
    concepts(topicId: string): Promise<TopicConcept[]>;
    relations(topicId: string): Promise<TopicRelation[]>;
    evidence(topicId: string): Promise<TopicEvidence[]>;
    conflicts(topicId: string): Promise<TopicConflict[]>;
    runs(topicId: string): Promise<TopicProcessingRun[]>;

    completeness(topicId: string): Promise<TopicCompleteness>;
    /** Аспекты темы (Фаза 4): декомпозиция и покрытие. */
    aspects(topicId: string): Promise<TopicAspect[]>;
    /** LLM-декомпозиция темы на аспекты (идемпотентно). */
    decomposeAspects(topicId: string): Promise<TopicAspect[]>;
    /** Генерация уточняющих вопросов для пустых/слабых аспектов. */
    aspectQuestions(topicId: string): Promise<Array<{ aspect: string; questions: string[] }>>;
    /** Структурированное досье темы: аспекты, консенсусы, конфликты, источники. */
    topicDossier(topicId: string): Promise<string>;

    /** Поиск по утверждениям темы (jaccard + cosine + graph expansion). */
    search(topicId: string, query: string): Promise<TopicClaim[]>;

    /** Ручная консолидация: глобальная синхронизация концептов и иерархии. */
    consolidate(topicId: string): Promise<void>;
    /** Слить два утверждения: `keep` остаётся каноном, `absorb` уходит в его variants. */
    mergeClaims(topicId: string, keepId: string, absorbId: string): Promise<void>;
    /** Разрешить конфликт: проигравшая сторона помечается superseded/contradicted. */
    resolveConflict(
        topicId: string,
        conflictId: string,
        winnerId: string,
        loserStatus: 'superseded' | 'contradicted',
    ): Promise<void>;
    /** Сравнить два прогона ингеста: что добавилось/слилось/породило конфликты. */
    runDiff(
        topicId: string,
        runAId: string,
        runBId: string,
    ): Promise<{
        addedSources: string[];
        removedSources: string[];
        statsA: TopicProcessingRun['stats'];
        statsB: TopicProcessingRun['stats'];
    }>;
    /** Найти пары похожих утверждений — кандидатов на объединение (merge candidates). */
    mergeCandidates(
        topicId: string,
        limit?: number,
    ): Promise<Array<{ a: TopicClaim; b: TopicClaim; similarity: number }>>;
    /** Подтемы (кластеры концептов) темы. */
    clusters(
        topicId: string,
    ): Promise<Array<{ name: string; conceptIds: string[]; claimCount: number }>>;

    /** Нормализованная степень центральности узлов (claims + концепты). */
    centrality(
        topicId: string,
    ): Promise<
        Array<{ id: string; kind: 'claim' | 'concept'; degree: number; normalized: number }>
    >;

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
