import type { ConsiliumType } from './unified-role';

export type TeamStrategy =
    | 'parallel'
    | 'sequential'
    | 'pipeline'
    | 'debate'
    | 'consensus'
    | 'hierarchical'
    | 'swarm'
    | 'tournament'
    | 'round-robin'
    | 'review';

export type TeamDomain =
    | 'medical'
    | 'scientific'
    | 'technical'
    | 'legal'
    | 'business'
    | 'creative'
    | 'educational'
    | 'crisis'
    | 'ethical'
    | 'financial'
    | 'investigation'
    | 'editorial'
    | 'research'
    | 'custom';

export type TeamExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'aborted';

export interface TeamFallback {
    onRoleFailure: 'skip' | 'retry' | 'replace' | 'abort';
    maxRetries?: number;
    replacementRoleId?: string;
}

export interface TeamExecutionConfig {
    maxRounds?: number;
    consensusThreshold?: number;
    parallelTimeout?: number;
    sequentialDelay?: number;
}

export interface RoleTeam {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    consiliumType?: ConsiliumType;
    roleIds: string[];
    leaderRoleId?: string;
    coordinationStrategy: TeamStrategy;
    fallbackPlan?: TeamFallback;
    metadata: {
        domain: TeamDomain;
        created: number;
        updated: number;
        author?: string;
        tags?: string[];
        version?: string;
        isBuiltin?: boolean;
        isTemplate?: boolean;
    };
    executionConfig: TeamExecutionConfig;
}

export interface TeamTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    domain: TeamDomain;
    defaultStrategy: TeamStrategy;
    recommendedRoles: string[];
    minRoles: number;
    maxRoles: number;
    useCases: string[];
    isBuiltin: boolean;
}

export interface RoleOutput {
    roleId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    output?: string;
    latency?: number;
    tokens?: number;
    cost?: number;
    error?: string;
    startedAt?: number;
    completedAt?: number;
}

export interface TeamMetrics {
    totalDuration: number;
    totalCost: number;
    totalTokens: number;
    roleCount: number;
    successRate: number;
    consensusLevel?: number;
}

export interface TeamExecution {
    id: string;
    teamId: string;
    task: string;
    status: TeamExecutionStatus;
    startedAt: number;
    completedAt?: number;
    roleOutputs: Record<string, RoleOutput>;
    synthesis?: string;
    metrics?: TeamMetrics;
    currentRoleId?: string;
}

export interface TeamCompatibilityEntry {
    roleA: string;
    roleB: string;
    score: number;
    synergyLabel: 'synergy' | 'neutral' | 'conflict';
    note?: string;
}

export interface TeamAnalytics {
    teamId: string;
    totalExecutions: number;
    successRate: number;
    avgDuration: number;
    avgCost: number;
    perRoleContribution: Record<string, number>;
    bottleneckRoleId?: string;
}

export const TEAM_STRATEGY_LABELS: Record<TeamStrategy, string> = {
    parallel: 'All at once — all roles receive the task simultaneously',
    sequential: 'One by one — roles execute in specified order',
    pipeline: 'Chain — output of one role becomes input of next',
    debate: 'Pro/Con — roles argue opposing sides, judge synthesizes',
    consensus: 'Voting — all roles vote, threshold decides',
    hierarchical: 'Leader delegates — leader assigns sub-tasks, synthesizes results',
    swarm: 'Emergent — roles interact freely, message-passing',
    tournament: 'Knockout — pairwise comparisons, winner advances',
    'round-robin': 'Cyclic — each role takes turns, N rounds',
    review: 'Author + Reviewers — draft, critique, revise cycle',
};

export const TEAM_DOMAIN_ICONS: Record<TeamDomain, string> = {
    medical: '🩺',
    scientific: '🔬',
    technical: '💻',
    legal: '⚖️',
    business: '📊',
    creative: '🎨',
    educational: '🎓',
    crisis: '🚨',
    ethical: '🛡️',
    financial: '💰',
    investigation: '🔍',
    editorial: '📝',
    research: '📚',
    custom: '⚙️',
};

export const STRATEGY_COLORS: Record<TeamStrategy, string> = {
    parallel: '#10b981',
    sequential: '#3b82f6',
    pipeline: '#8b5cf6',
    debate: '#ef4444',
    consensus: '#f59e0b',
    hierarchical: '#f97316',
    swarm: '#ec4899',
    tournament: '#a855f7',
    'round-robin': '#06b6d4',
    review: '#14b8a6',
};

export interface IRoleTeamService {
    listTeams(): RoleTeam[];
    getTeam(id: string): RoleTeam | undefined;
    createTeam(input: Omit<RoleTeam, 'id'>): RoleTeam;
    updateTeam(id: string, patch: Partial<RoleTeam>): void;
    deleteTeam(id: string): void;
    getTemplates(): TeamTemplate[];
    createFromTemplate(templateId: string, overrides?: Partial<RoleTeam>): RoleTeam;

    executeTeam(teamId: string, task: string): Promise<TeamExecution>;
    getExecution(executionId: string): TeamExecution | undefined;
    abortExecution(executionId: string): void;
    getExecutionHistory(teamId: string): TeamExecution[];
    getTeamAnalytics(teamId: string): TeamAnalytics;
    getCompatibilityMatrix(): TeamCompatibilityEntry[];
    synthesizeTeamOutput(execution: TeamExecution): string;
}
