import type { DebateConstraint, DebateStrategy } from './debate-types';
import type { DebateTopology } from './debate-runtime';

// ── Debate Mode ────────────────────────────────────────────────────

export type DebateModeId =
  | 'strict_logic'
  | 'scientific_review'
  | 'brainstorming'
  | 'jury_trial'
  | 'socratic_inquiry'
  | 'red_team'
  | 'consensus_builder'
  | 'open_forum';

export type PolicyType =
  | 'max_rounds'
  | 'time_limit_ms'
  | 'require_evidence'
  | 'forbid_emotion'
  | 'min_participants'
  | 'auto_summarize'
  | 'budget_cap_tokens'
  | 'temperature_cap'
  | 'require_sources'
  | 'contradiction_penalty';

export interface ModePolicy {
  readonly type: PolicyType;
  readonly value: number | boolean | string;
  readonly description: string;
}

export interface DebateMode {
  readonly id: DebateModeId | string;
  readonly name: string;
  readonly description: string;
  readonly icon?: string;
  readonly color?: string;
  readonly strategyRef?: string;
  readonly legacyStrategy?: DebateStrategy;
  readonly constraint: DebateConstraint;
  readonly policies: ModePolicy[];
  readonly defaultTopology?: Partial<DebateTopology>;
  readonly defaultTemperature?: number;
  readonly defaultMaxRounds?: number;
  readonly requiredCapabilities?: string[];
  readonly tags?: string[];
}

export interface DebateModePreset {
  readonly mode: DebateMode;
  readonly builtin: boolean;
  readonly createdAt: number;
}
