/**
 * Agent runtime types (roadmapp.md §P3).
 */
import type { ProjectId } from './project-types';

export type RuntimeStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export interface AgentRuntimeEvent {
    type: 'tool:start' | 'tool:complete' | 'tool:error' | 'llm:start' | 'llm:complete' | 'task:start' | 'task:complete' | 'task:error' | 'runtime:status';
    agentId: string;
    projectId: ProjectId;
    taskId?: string;
    tool?: string;
    message?: string;
    timestamp: number;
}

export interface ProjectExecutionContext {
    projectId: ProjectId;
    agentId: string;
    systemPrompt: string;
    maxRounds: number;
    availableTools: string[];
}

export interface RuntimeRunResult {
    runId: string;
    taskId: string;
    status: 'completed' | 'failed';
    output: string;
    toolCalls: Array<{ tool: string; args: Record<string, unknown>; result?: string; error?: string }>;
    error?: string;
    duration: number;
}

export interface RuntimeProgress {
    projectId: ProjectId;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    runningTaskId: string | null;
    events: AgentRuntimeEvent[];
}

// --- AGEMS Roadmap Phase 0 & Phase 1 Data Models ---

export type AgentType = 'AUTONOMOUS' | 'ASSISTANT' | 'META' | 'REACTIVE' | 'EXTERNAL';
export type AgentStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ERROR' | 'ARCHIVED';
export type TriggerType = 'TASK' | 'MESSAGE' | 'SCHEDULE' | 'EVENT' | 'MANUAL' | 'MEETING' | 'TELEGRAM' | 'APPROVAL';
export type ExecutionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'WAITING_HITL';
export type MemoryType = 'CONTEXT' | 'CONVERSATION' | 'FILE' | 'KNOWLEDGE';
export type MetricType = 'COST' | 'LATENCY' | 'QUALITY' | 'ERROR_RATE' | 'TASKS_DONE' | 'TOKENS_USED';
export type ApprovalPreset = 'FULL_CONTROL' | 'SUPERVISED' | 'GUIDED' | 'AUTOPILOT';
export type ToolApprovalMode = 'FREE' | 'REQUIRES_APPROVAL' | 'BLOCKED';

export interface AgentLLMConfig {
    temperature: number;
    maxTokens: number;
    topP?: number;
    stopSequences?: string[];
}

export interface AgentRuntimeConfig {
    mode: 'CLAUDE_CODE' | 'N8N' | 'API' | 'CUSTOM';
    maxIterations: number;
    timeoutMs: number;
    allowedCommands?: string[];
    blockedCommands?: string[];
    workingDirectory?: string;
    n8nApiUrl?: string;
    n8nApiKey?: string;
    maxTokensPerMinute?: number;
    maxApiCallsPerMinute?: number;
    maxCostPerDay?: number;
}

export interface AgentTelegramConfig {
    botToken?: string;
    botEnabled?: boolean;
    accessMode: 'OPEN' | 'WHITELIST';
    allowedChatIds?: number[];
    voiceEnabled?: boolean;
    ttsVoice?: string;
    apiId?: number;
    apiHash?: string;
    sessionString?: string;
}

export interface AgentRecord {
    id: string;
    name: string;
    slug: string;
    avatar?: string;
    type: AgentType;
    status: AgentStatus;
    llmProvider: string;
    llmModel: string;
    llmConfig: AgentLLMConfig;
    systemPrompt: string;
    mission?: string;
    values?: string[];
    runtimeConfig: AgentRuntimeConfig;
    adapterType?: string;
    adapterConfig?: Record<string, unknown>;
    telegramConfig?: AgentTelegramConfig;
    ownerId?: string;
    parentAgentId?: string;
    createdByAgentId?: string;
    version: number;
    metadata?: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}

export interface AgentMemoryRecord {
    id: string;
    agentId: string;
    type: MemoryType;
    content: string;
    metadata?: Record<string, unknown>;
    expiresAt?: number;
    createdAt: number;
}

export interface AgentExecutionRecord {
    id: string;
    agentId: string;
    status: ExecutionStatus;
    triggerType: TriggerType;
    triggerId?: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    toolCalls?: Array<{ tool: string; input: unknown; output: unknown }>;
    tokensUsed?: number;
    costUsd?: number;
    provider?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    cachedInputTokens?: number;
    error?: string;
    startedAt: number;
    endedAt?: number;
}

export interface AgentResponsibilityRecord {
    id: string;
    agentId: string;
    title: string;
    description?: string;
    kpiMetrics?: Record<string, unknown>;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AgentMetricRecord {
    id: string;
    agentId: string;
    metricType: MetricType;
    value: number;
    periodStart: number;
    periodEnd: number;
    metadata?: Record<string, unknown>;
}

export interface AgentConfigRevisionRecord {
    id: string;
    agentId: string;
    version: number;
    changeset: Record<string, { old: unknown; new: unknown }>;
    snapshot: Record<string, unknown>;
    changedBy: string;
    changeNote?: string;
    createdAt: number;
}

export interface ApprovalPolicyRecord {
    id: string;
    agentId: string;
    preset: ApprovalPreset;
    readMode?: ToolApprovalMode;
    writeMode?: ToolApprovalMode;
    deleteMode?: ToolApprovalMode;
    executeMode?: ToolApprovalMode;
    sendMode?: ToolApprovalMode;
    adminMode?: ToolApprovalMode;
    toolOverrides?: Record<string, ToolApprovalMode>;
    autoApproveAfterMin?: number;
    autoApproveLowRisk?: boolean;
    costThresholdUsd?: number;
}

export interface AgentBudgetRecord {
    id: string;
    agentId: string;
    monthlyLimitUsd: number;
    dailyLimitUsd?: number;
    hourlyLimitUsd?: number;
    currentSpendUsd: number;
    periodStart: number;
    periodEnd: number;
    softAlertPercent: number;
    hardStopEnabled: boolean;
    alertSent: boolean;
    hardStopTriggered: boolean;
}

