import type { ILifecycle } from './lifecycle';
import type {
    Junction,
    JunctionCandidate,
    JunctionId,
    JunctionQuery,
} from '../types/junction-types';

/**
 * Junction Engine — cross-domain synthesis.
 *
 * Detects structural connections between knowledge sources from different
 * domains and produces new knowledge S' = f(A, B, C) (plan §3).
 *
 * Flow:
 *   1. detect()   — JunctionDetector pairs "mature" sources across domains and
 *                   classifies each pair as NONE|WEAK|STRONG.
 *   2. validate() — JunctionValidator publishes STRONG links as pending
 *                   junctions (waits for a counterargument) → validated.
 *   3. reject()   — weak/contradicted links are rejected.
 */
export interface IJunctionEngineService extends ILifecycle {
    /** Run the detector across current sources, return new candidates. */
    detect(): Promise<JunctionCandidate[]>;
    /** Publish a candidate as a pending junction (or validated for STRONG). */
    validate(candidateId: JunctionId): Promise<Junction | null>;
    /** Submit a counterargument — validated if it survives, rejected otherwise. */
    submitCounterargument(
        junctionId: JunctionId,
        counterArgument: string,
        agentId?: string,
    ): Promise<Junction | null>;
    /** Manually reject a junction. */
    reject(junctionId: JunctionId, reason: string): Promise<Junction | null>;
    get(id: JunctionId): Promise<Junction | null>;
    list(opts?: JunctionQuery): Promise<Junction[]>;
    /** Active sources used for detection (crystals + debates), for UI. */
    getSources(): Promise<JunctionSourceView[]>;
}

/** UI-facing view of a detection source. */
export interface JunctionSourceView {
    kind: 'debate' | 'crystal';
    id: string;
    label: string;
    domain: string;
    statement: string;
}
