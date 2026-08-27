import type { DebatePhase, IDebateSession as RuntimeSessionState } from '../contracts/debate-runtime';
export type { DebatePhase };
// CRIT-6 fix: debate-state.ts now re-exports DebateSessionState from the canonical
// debate-runtime.ts contract instead of defining its own incompatible shape.
// Previously there were three different DebateSessionState definitions across
// debate-state.ts, debate-runtime-state.ts, and debate-runtime.ts (contract).
// All code should import from '../contracts/debate-runtime' going forward.
// These remaining types are kept for legacy compatibility only.
export type DebateSessionState = RuntimeSessionState;
export type DebateParticipantRole = 'proponent' | 'opponent' | 'mediator' | 'observer';

export interface DebateParticipantState {
  readonly agentId: string;
  readonly role: DebateParticipantRole;
  readonly position: string;
  readonly arguments: DebateArgumentRecord[];
  readonly score: number;
  readonly status: 'active' | 'idle' | 'withdrawn';
}

export interface DebateArgumentRecord {
  readonly round: number;
  readonly agentId: string;
  readonly content: string;
  readonly type: 'opening' | 'rebuttal' | 'evidence' | 'clarification' | 'synthesis';
  readonly timestamp: number;
  readonly confidence: number;
}

export interface DebateRoundState {
  readonly round: number;
  readonly phase: DebatePhase;
  readonly startedAt: number;
  readonly endedAt?: number;
  readonly argumentsCount: number;
  readonly status: 'in_progress' | 'completed' | 'skipped';
}

export interface DebateStateSnapshot {
  readonly activeSessions: DebateSessionState[];
  readonly completedSessions: number;
  readonly totalDebates: number;
  readonly avgConvergenceScore: number;
  readonly updatedAt: number;
}

export interface ConsensusState {
  readonly topic: string;
  readonly reached: boolean;
  readonly convergenceScore: number;
  readonly agreedPoints: string[];
  readonly disagreedPoints: string[];
  readonly finalStatement?: string;
  readonly participantsCount: number;
  readonly duration: number;
}
