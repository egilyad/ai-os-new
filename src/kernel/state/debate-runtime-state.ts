import type { IDebateSession as ContractSessionState, AgentPhase } from '../contracts/debate-runtime';

// CRIT-6 fix: debate-runtime-state.ts now re-exports DebateSessionState from the canonical
// debate-runtime.ts contract. Previously this file defined its own shape that was
// incompatible with the contract version and the debate-state.ts version.
// All three definitions are now unified — import from '../contracts/debate-runtime'.
export type DebateSessionState = ContractSessionState;

export interface DebateAgentState {
  readonly agentId: string;
  readonly nodeId: string;
  readonly phase: AgentPhase;
  readonly round: number;
  readonly tokensUsed: number;
  readonly latency: number;
  readonly error?: string;
  readonly lastActiveAt: number;
}

export interface DebateRuntimeSnapshot {
  readonly sessions: DebateSessionState[];
  readonly totalCompleted: number;
  readonly totalFailed: number;
  readonly totalActive: number;
  readonly avgTokensPerSession: number;
  readonly avgCostPerSession: number;
  readonly updatedAt: number;
}
