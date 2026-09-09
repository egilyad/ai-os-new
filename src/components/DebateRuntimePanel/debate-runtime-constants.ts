import type { DebatePhase, AgentPhase, PressureLevel, TopologyType } from '../../kernel/instances';

export const PHASE_COLORS: Record<DebatePhase, string> = {
    created: '#64748b',
    queued: '#94a3b8',
    initializing: '#3b82f6',
    active: '#22c55e',
    paused: '#f59e0b',
    deliberating: '#a855f7',
    consensus: '#f59e0b',
    summarizing: '#06b6d4',
    completed: '#22c55e',
    failed: '#ef4444',
    cancelled: '#64748b',
};

export const AGENT_COLORS: Record<AgentPhase, string> = {
    idle: '#64748b',
    thinking: '#3b82f6',
    waiting: '#94a3b8',
    streaming: '#22c55e',
    errored: '#ef4444',
    'rate-limited': '#f59e0b',
    fallback: '#f97316',
    'timed-out': '#dc2626',
    completed: '#22c55e',
};

export const PRESSURE_COLORS: Record<PressureLevel, string> = {
    low: '#22c55e',
    normal: '#3b82f6',
    high: '#f59e0b',
    critical: '#ef4444',
};

export const TOPOLOGY_TYPES: TopologyType[] = [
    'linear',
    'roundtable',
    'judge',
    'tree-of-thought',
    'red-blue',
];

export const ROLE_COLORS: Record<string, string> = {
    pro: '#3b82f6',
    con: '#ef4444',
    neutral: '#94a3b8',
    judge: '#a855f7',
    attacker: '#f97316',
    defender: '#22c55e',
};

export const TOPOLOGY_ROLES: Record<TopologyType, string[]> = {
    linear: ['pro', 'con'],
    roundtable: ['pro', 'con', 'neutral'],
    judge: ['pro', 'con', 'judge'],
    'tree-of-thought': ['pro', 'con', 'neutral'],
    'red-blue': ['attacker', 'defender', 'judge'],
};
