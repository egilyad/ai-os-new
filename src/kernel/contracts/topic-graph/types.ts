/**
 * Topic Graph — самостоятельный домен знаний (см. docs/design/topic-graph-design.md).
 *
 * Сущности: Topic, Source, Claim, Concept, Relation, Evidence, Conflict, ProcessingRun.
 * Ключевое: Source и Claim разделены; Claim сохраняет все ссылки на источники;
 * исходные материалы никогда не переписываются.
 */

export type TopicStatus = 'active' | 'paused' | 'archived';

export interface Topic {
    id: string;
    title: string;
    description: string;
    status: TopicStatus;
    createdAt: number;
    updatedAt: number;
}

export type TopicSourceKind = 'document' | 'model-answer' | 'research' | 'other';

export interface TopicSource {
    id: string;
    topicId: string;
    kind: TopicSourceKind;
    ref: string;
    title: string;
    /** Хэш содержимого (для дедупликации источников). */
    sha256: string;
    /** Фолбэк-хэш предыдущего формата (FNV-1a) для миграции старых записей. */
    legacyHash?: string;
    content: string;
    importedAt: number;
    meta?: Record<string, unknown>;
}

export type ClaimStatus = 'extracted' | 'validated' | 'contradicted' | 'superseded';

export interface TopicClaim {
    id: string;
    topicId: string;
    /** Компактное утверждение (нормализованное). */
    text: string;
    /** Все источники, где встречается это утверждение. */
    sourceIds: string[];
    /** Поверхностные формулировки, влитые при слиянии (без канона). */
    variants?: string[];
    confidence: number;
    status: ClaimStatus;
    /** Вектор для смысловой близости (опционально). */
    embedding?: number[];
    createdAt: number;
    updatedAt: number;
}

export interface TopicConcept {
    id: string;
    topicId: string;
    name: string;
    aliases: string[];
    claimIds: string[];
    /** Вектор имени (для слияния синонимов). */
    embedding?: number[];
    /** Имя подтемы, к которой относится концепт (Фаза 2 кластеризации). */
    subtopic?: string;
    createdAt: number;
}

export type TopicRelationType =
    | 'supports'
    | 'contradicts'
    | 'refines'
    | 'depends_on'
    | 'example_of'
    | 'same_as'
    | 'cites'
    | 'related_to'
    | 'part_of';

export interface TopicRelation {
    id: string;
    topicId: string;
    fromId: string;
    toId: string;
    relation: TopicRelationType;
    weight: number;
    /** Ручная связь: не пересчитывается и не удаляется при консолидации. */
    manual?: boolean;
    createdAt: number;
}

export interface TopicEvidence {
    id: string;
    topicId: string;
    claimId: string;
    sourceId: string;
    /** Фрагмент оригинала, из которого извлечено утверждение. */
    quote: string;
    /** Смещение начала в исходнике (опционально). */
    offset?: number;
    /** Смещение конца в исходнике (опционально). */
    end?: number;
    /** 'source' — дословная цитата из оригинала; 'model' — сгенерировано моделью. */
    origin?: 'source' | 'model';
    /** Способ извлечения. */
    extraction?: 'llm' | 'fallback';
    createdAt: number;
}

export interface TopicConflict {
    id: string;
    topicId: string;
    claimAId: string;
    claimBId: string;
    reason: string;
    confidence: number;
    resolved: boolean;
    createdAt: number;
}

export type ProcessingRunStatus =
    'pending' | 'running' | 'completed' | 'partial' | 'fallback' | 'failed';

export interface TopicProcessingRun {
    id: string;
    topicId: string;
    sourceIds: string[];
    status: ProcessingRunStatus;
    stats: {
        extracted: number;
        duplicates: number;
        newClaims: number;
        newEvidence: number;
        conflicts: number;
        relations: number;
        /** Утверждения, похожие на существующие, но не объединённые автоматически. */
        mergeCandidates: number;
        /** Утверждения, полученные без полноценного LLM-извлечения. */
        fallbackClaims: number;
    };
    error?: string;
    /** Предупреждения (например, частичные сбои при обработке чанков). */
    warnings?: string[];
    createdAt: number;
    completedAt?: number;
}

/** Аспект/подтема темы (Фаза 4 роадмапа Topic Graph). */
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
