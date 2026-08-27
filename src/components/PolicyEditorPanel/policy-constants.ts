import type { DebatePhase } from '../../kernel/contracts/debate-runtime';
import type { PolicyType } from '../../kernel/contracts/debate-mode-system';

export const CONDITION_TYPES = [
    { value: 'phase_is', label: 'Phase is', group: 'Phase' },
    { value: 'phase_in', label: 'Phase in list', group: 'Phase' },
    { value: 'round_gt', label: 'Round >', group: 'Round' },
    { value: 'round_lt', label: 'Round <', group: 'Round' },
    { value: 'round_eq', label: 'Round =', group: 'Round' },
    { value: 'tokens_gt', label: 'Tokens >', group: 'Tokens' },
    { value: 'tokens_lt', label: 'Tokens <', group: 'Tokens' },
    { value: 'cost_gt', label: 'Cost >', group: 'Cost' },
    { value: 'agent_error_rate_gt', label: 'Error Rate >', group: 'Agent' },
    { value: 'confidence_lt', label: 'Confidence <', group: 'Consensus' },
    { value: 'pressure_is', label: 'Pressure is', group: 'Budget' },
    { value: 'policy_equals', label: 'Policy equals', group: 'Policy' },
    { value: 'and', label: 'AND', group: 'Logic' },
    { value: 'or', label: 'OR', group: 'Logic' },
    { value: 'not', label: 'NOT', group: 'Logic' },
] as const;

export const ACTION_TYPES = [
    { value: 'set_policy', label: 'Set Policy', fields: ['policyType', 'value'] },
    { value: 'adjust_temperature', label: 'Adjust Temperature', fields: ['delta'] },
    { value: 'reduce_rounds', label: 'Reduce Rounds', fields: ['by'] },
    { value: 'skip_agent', label: 'Skip Agent', fields: ['agentId'] },
    { value: 'inject_message', label: 'Inject Message', fields: ['target', 'content'] },
    { value: 'pause', label: 'Pause', fields: [] },
    { value: 'emit_event', label: 'Emit Event', fields: ['eventName', 'payload'] },
    { value: 'log', label: 'Log', fields: ['level', 'message'] },
] as const;

export const PHASES: DebatePhase[] = [
    'created',
    'queued',
    'initializing',
    'active',
    'deliberating',
    'consensus',
    'summarizing',
    'paused',
    'completed',
    'failed',
    'cancelled',
];

export const LOG_LEVELS = ['info', 'warn', 'error'] as const;

export const PRESSURE_LEVELS = ['low', 'normal', 'high', 'critical'];

export const POLICY_TYPES: PolicyType[] = [
    'max_rounds',
    'time_limit_ms',
    'require_evidence',
    'forbid_emotion',
    'min_participants',
    'auto_summarize',
    'budget_cap_tokens',
    'temperature_cap',
    'require_sources',
    'contradiction_penalty',
];

export const POLICY_TYPE_LABELS: Record<string, string> = {
    max_rounds: 'Max Rounds',
    time_limit_ms: 'Time Limit',
    require_evidence: 'Require Evidence',
    forbid_emotion: 'Forbid Emotion',
    min_participants: 'Min Participants',
    auto_summarize: 'Auto Summarize',
    budget_cap_tokens: 'Budget Cap',
    temperature_cap: 'Temperature Cap',
    require_sources: 'Require Sources',
    contradiction_penalty: 'Contradiction Penalty',
};
