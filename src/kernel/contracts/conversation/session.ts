import type { TurnResult } from './execution';

/**
 * Live-run status of a managed conversation session. Mirrors `DirectorState`
 * but is the persisted-ready domain model owned by a `ConversationSession`
 * (distinct from the service's internal `DirectorState`).
 */
export type SessionStatus = 'idle' | 'running' | 'paused' | 'aborted' | 'completed' | 'error';

/**
 * One observed `conversation:*` lifecycle event for a session. The session is
 * the authoritative, inspectable record of a single run — separate from the
 * static `ConversationScenario` blueprint it was derived from.
 */
export interface SessionEvent {
    type: string;
    at: number;
    payload: Record<string, unknown>;
}

/**
 * Operator / runtime checkpoint capturing the live run state at a moment in
 * time. Checkpoints let a run be inspected (and, later, rewound) without
 * mutating the scenario blueprint.
 */
export interface SessionCheckpoint {
    id: string;
    at: number;
    label?: string;
    /** Number of executed steps captured at checkpoint time. */
    cursor: number;
    history: Array<{ role: string; content: string }>;
    results: TurnResult[];
    status: SessionStatus;
}

/**
 * A single live run of a `ConversationScenario`.
 *
 * The scenario is the **blueprint** (stable id, authored once). A session is
 * the **live run** (distinct id per launch) that carries the events emitted
 * during execution, operator checkpoints, recorded results and progress
 * accounting. This separation is what lets one blueprint produce many runs.
 */
export interface ConversationSession {
    id: string;
    scenarioId: string;
    scenarioName: string;
    status: SessionStatus;
    createdAt: number;
    updatedAt: number;
    /** Live event log for this run (conversation:* events scoped to this session). */
    events: SessionEvent[];
    /** Operator checkpoints captured during the run. */
    checkpoints: SessionCheckpoint[];
    /** Recorded turn results for this run. */
    results: TurnResult[];
    currentParticipantId: string | null;
    currentTurnIndex: number | null;
    /** Progress accounting — mirrors the RunTab semantics (planned/injected/failed). */
    plannedTotal: number;
    plannedDone: number;
    injectedDone: number;
    failed: number;
}
