import type { CausalTraceEntry, EventRef } from './causal-debugger';

/** Snapshot of scoring state at a moment in time */
export interface ScoreSnapshot {
  /** provider → composite score */
  scores: Record<string, number>;
  /** provider → score components breakdown */
  components?: Record<string, Record<string, number>>;
  /** Ordered provider ranking (winner first) */
  ranking: string[];
}

/** A single frame in a temporal replay */
export interface TemporalFrame {
  /** Position in the replay sequence */
  index: number;
  /** Log position in EventRecorder */
  logPos: number;
  /** Original event reference */
  event: EventRef;
  /** Key state at this point (only provider-relevant fields) */
  keyState: Record<string, unknown>;
  /** Score state at this point (null if no scoring change triggered) */
  scoreState: ScoreSnapshot | null;
  /** Whether this event caused a score recalculation */
  rescored: boolean;
}

/** The full temporal replay for a causal trace */
export interface TemporalTrace {
  requestId: string;
  causalId: string;
  frames: TemporalFrame[];
  /** Index of the frame where the eventual winner first overtook the original */
  flipFrame: number | null;
  /** The winning provider in the actual decision */
  winner: string;
  /** The leader at frame 0 (before events unfolded) */
  initialLeader: string;
}

export interface ITemporalReplayService {
  replay(trace: CausalTraceEntry): TemporalTrace;
}
