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
    createdAt: number;
}

export type TopicRelationType =
    | 'supports'
    | 'contradicts'
    | 'refines'
    | 'depends_on'
    | 'example_of'
    | 'same_as'
    | 'cites';

export interface TopicRelation {
    id: string;
    topicId: string;
    fromId: string;
    toId: string;
    relation: TopicRelationType;
    weight: number;
    createdAt: number;
}

export interface TopicEvidence {
    id: string;
    topicId: string;
    claimId: string;
    sourceId: string;
    /** Фрагмент оригинала, из которого извлечено утверждение. */
    quote: string;
    /** Смещение в исходнике (опционально). */
    offset?: number;
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

export type ProcessingRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface TopicProcessingRun {
    id: string;
    topicId: string;
    sourceIds: string[];
    status: ProcessingRunStatus;
    stats: {
        extracted: number;
        duplicates: number;
        newClaims: number;
        conflicts: number;
        relations: number;
        /** Утверждения, похожие на существующие, но не объединённые автоматически. */
        mergeCandidates: number;
    };
    error?: string;
    createdAt: number;
    completedAt?: number;
}
