import type { ILifecycle } from './lifecycle';

export interface MnesticEntry {
    id: string;
    text: string;
    importance: number;
    createdAt: number;
    lastAccessedAt?: number;
    relevance?: number;
}

export interface WeightedHit {
    entry: MnesticEntry;
    score: number;
}

export interface ReflectionResult {
    triggered: boolean;
    score: number;
    themes: string[];
}

/** Weighted retrieval + salience-triggered reflection (Generative Agents H1+H2). */
export interface IMnesticService extends ILifecycle {
    /** recency × importance × relevance weighted ranking. */
    rank(entries: MnesticEntry[], now?: number): WeightedHit[];
    /** Reflect when accumulated salience crosses a threshold. */
    maybeReflect(hits: WeightedHit[], threshold?: number): ReflectionResult;
}
