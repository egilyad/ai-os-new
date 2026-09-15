/**
 * Agent Management Types — Phase 0 (AGEMS port)
 * Full agent lifecycle: types, status, config, hierarchy, memory, executions, metrics, budgets.
 */

// ── Agent Types & Status ──────────────────────────────

export type AgentType = 'autonomous' | 'assistant' | 'meta' | 'reactive' | 'external';

export type AgentStatus = 'draft' | 'active' | 'paused' | 'error' | 'archived';

export type ActorType = 'agent' | 'human' | 'system';

export type LLMProvider =
    | 'anthropic'
    | 'openai'
    | 'google'
    | 'deepseek'
    | 'mistral'
    | 'minimax'
    | 'glm'
    | 'xai'
    | 'cohere'
    | 'perplexity'
    | 'together'
    | 'fireworks'
    | 'groq'
    | 'moonshot'
    | 'qwen'
    | 'ai21'
    | 'sambanova'
    | 'ollama'
    | 'custom';

export type AdapterType =
    | 'claude-code'
    | 'codex'
    | 'cursor'
    | 'gemini-cli'
    | 'openclaw'
    | 'opencode'
    | 'pi'
    | 'http'
    | 'process';

// ── LLM Config ────────────────────────────────────────

export interface LLMConfig {
    temperature: number; // 0-2, default 0.7
    maxTokens: number; // 1-200000, default 4096
    topP?: number; // 0-1
    stopSequences?: string[];
}

// ── MCP Server ────────────────────────────────────────

export interface MCPServerConfig {
    name: string;
    url: string;
    authorizationToken?: string;
    toolConfiguration?: {
        enabled?: boolean;
        allowedTools?: string[];
    };
}

// ── Runtime Config ────────────────────────────────────

export type RuntimeMode = 'llm' | 'claude-code' | 'n8n' | 'api' | 'custom';

export interface RuntimeConfig {
    mode: RuntimeMode;
    maxIterations: number; // 1-100, default 50
    timeoutMs: number; // 1000-600000, default 120000
    allowedCommands?: string[];
    blockedCommands?: string[];
    workingDirectory?: string;
    n8nApiUrl?: string;
    n8nApiKey?: string;
    mcpServers?: MCPServerConfig[];
    maxTokensPerMinute?: number;
    maxApiCallsPerMinute?: number;
    maxCostPerDay?: number; // USD
}

// ── Telegram Config ───────────────────────────────────

export interface TelegramConfig {
    botToken?: string;
    botEnabled?: boolean;
    accessMode?: 'open' | 'whitelist';
    allowedChatIds?: number[];
    voiceEnabled?: boolean;
    ttsVoice?: string;
    // MTProto (Telethon-style)
    apiId?: number;
    apiHash?: string;
    sessionString?: string;
}

// ── Agent Record (Dexie) ──────────────────────────────

export interface AgentRecord {
    id: string;
    name: string;
    slug: string;
    avatar?: string; // Emoji or image URL
    type: AgentType;
    status: AgentStatus;

    // LLM
    llmProvider: LLMProvider;
    llmModel: string;
    llmConfig: LLMConfig;

    // Mission
    systemPrompt: string;
    mission?: string;
    values?: string[];

    // Runtime
    runtimeConfig: RuntimeConfig;

    // External adapter
    adapterType?: AdapterType;
    adapterConfig?: Record<string, unknown>;

    // Telegram
    telegramConfig?: TelegramConfig;

    // Hierarchy
    ownerId: string;
    parentAgentId?: string;
    createdByAgentId?: string;

    // Version
    version: number;
    metadata?: Record<string, unknown>;

    // Timestamps
    createdAt: number;
    updatedAt: number;
}

// ── Agent Skill ───────────────────────────────────────

export interface AgentSkillRecord {
    id: string;
    agentId: string;
    skillId: string;
    config?: Record<string, unknown>;
    enabled: boolean;
}

// ── Agent Tool ────────────────────────────────────────

export type ToolApprovalMode = 'free' | 'requires_approval' | 'blocked';

export interface AgentToolRecord {
    id: string;
    agentId: string;
    toolId: string;
    permissions: { read: boolean; write: boolean; execute: boolean };
    approvalMode: ToolApprovalMode;
    enabled: boolean;
}

// ── Responsibility ────────────────────────────────────

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface ResponsibilityRecord {
    id: string;
    agentId: string;
    title: string;
    description?: string;
    kpiMetrics?: Record<string, string>;
    priority: Priority;
}

// ── Agent Metrics ─────────────────────────────────────

export type MetricType =
    | 'cost'
    | 'latency'
    | 'quality'
    | 'error_rate'
    | 'tasks_done'
    | 'tokens_used';

export interface AgentMetricRecord {
    id: string;
    agentId: string;
    metricType: MetricType;
    value: number;
    periodStart: number;
    periodEnd: number;
    metadata?: Record<string, unknown>;
}

// ── Agent Memory ──────────────────────────────────────

export type MemoryType = 'context' | 'conversation' | 'file' | 'knowledge';

export interface AgentMemoryRecord {
    id: string;
    agentId: string;
    type: MemoryType;
    content: string;
    metadata?: Record<string, unknown>;
    expiresAt?: number;
    createdAt: number;
}

// ── Agent Execution ───────────────────────────────────

export type TriggerType =
    | 'task'
    | 'message'
    | 'schedule'
    | 'event'
    | 'manual'
    | 'meeting'
    | 'telegram'
    | 'approval';

export type ExecutionStatus =
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'waiting_hitl';

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

// ── Config Revision ───────────────────────────────────

export interface AgentConfigRevisionRecord {
    id: string;
    agentId: string;
    version: number;
    changeset: Record<string, { old: unknown; new: unknown }>;
    snapshot: Record<string, unknown>;
    changedBy: ActorType;
    changedById?: string;
    changeNote?: string;
    createdAt: number;
}

// ── Agent API Key ─────────────────────────────────────

export interface AgentApiKeyRecord {
    id: string;
    agentId: string;
    name: string;
    keyHash: string;
    keyPrefix: string;
    lastUsedAt?: number;
    expiresAt?: number;
    revokedAt?: number;
    createdAt: number;
}

// ── Agent Budget ──────────────────────────────────────

export interface AgentBudgetRecord {
    id: string;
    agentId: string;
    monthlyLimitUsd: number;
    dailyLimitUsd?: number;
    hourlyLimitUsd?: number;
    currentSpendUsd: number;
    periodStart: number;
    periodEnd: number;
    softAlertPercent: number; // Default 80
    hardStopEnabled: boolean; // Default true
    alertSent: boolean;
    hardStopTriggered: boolean;
    metadata?: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}

// ── Budget Incident ───────────────────────────────────

export type BudgetIncidentType =
    | 'soft_alert'
    | 'hard_stop'
    | 'budget_reset'
    | 'manual_override';

export interface BudgetIncidentRecord {
    id: string;
    budgetId: string;
    type: BudgetIncidentType;
    message: string;
    spendUsd: number;
    limitUsd: number;
    createdAt: number;
}

// ── Input Types ───────────────────────────────────────

export interface CreateAgentInput {
    name: string;
    slug?: string;
    avatar?: string;
    type?: AgentType;
    llmProvider: LLMProvider;
    llmModel: string;
    llmConfig?: Partial<LLMConfig>;
    systemPrompt: string;
    mission?: string;
    values?: string[];
    runtimeConfig?: Partial<RuntimeConfig>;
    adapterType?: AdapterType;
    adapterConfig?: Record<string, unknown>;
    telegramConfig?: TelegramConfig;
    parentAgentId?: string;
    metadata?: Record<string, unknown>;
}

export interface UpdateAgentInput {
    name?: string;
    slug?: string;
    avatar?: string;
    type?: AgentType;
    status?: AgentStatus;
    llmProvider?: LLMProvider;
    llmModel?: string;
    llmConfig?: Partial<LLMConfig>;
    systemPrompt?: string;
    mission?: string;
    values?: string[];
    runtimeConfig?: Partial<RuntimeConfig>;
    adapterType?: AdapterType;
    adapterConfig?: Record<string, unknown>;
    telegramConfig?: TelegramConfig;
    parentAgentId?: string | null;
    metadata?: Record<string, unknown>;
}

export interface AgentFilters {
    status?: AgentStatus;
    type?: AgentType;
    llmProvider?: LLMProvider;
    search?: string;
    page?: number;
    pageSize?: number;
}

// ── Cost Stats ────────────────────────────────────────

export interface CostStats {
    totalCost: number;
    byProvider: Record<string, number>;
    byModel: Record<string, number>;
    byDay: Record<string, number>;
    period: { start: number; end: number };
}

// ── Export/Import ─────────────────────────────────────

export interface ExportedAgent {
    agent: AgentRecord;
    skills: AgentSkillRecord[];
    tools: AgentToolRecord[];
    responsibilities: ResponsibilityRecord[];
    memory: AgentMemoryRecord[];
    exportedAt: number;
    version: string;
}

export interface ImportAgentInput {
    data: ExportedAgent;
    reLinkBySlug?: boolean;
}

export interface ImportResult {
    agentId: string;
    skillsLinked: number;
    toolsLinked: number;
    memoryImported: number;
}
