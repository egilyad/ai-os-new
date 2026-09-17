/**
 * AGEMS Agent Data Model — Phase 0.1
 * Maps AGEMS Prisma model to our Dexie/Kernel stack.
 * Source: docs/road/AGEMS_ROADMAP.md §0.1
 */

export type AgentType = 'AUTONOMOUS' | 'ASSISTANT' | 'META' | 'REACTIVE' | 'EXTERNAL';
export type AgentStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ERROR' | 'ARCHIVED';
export type LLMProvider =
    | 'ANTHROPIC' | 'OPENAI' | 'GOOGLE' | 'GROQ' | 'NVIDIA' | 'OPENROUTER' | 'MISTRAL' | 'COHERE'
    | 'AZURE' | 'HUGGINGFACE' | 'CEREBRAS' | 'CLOUDFLARE' | 'PERPLEXITY' | 'BLACKBOX' | 'SCALeway'
    | 'COMETAPI' | 'GITHUB' | 'OLLAMA' | 'LMSTUDIO' | 'KIMI' | 'MINIMAX' | 'QWEN' | 'CUSTOM';
export type AdapterType = 'CLAUDE_CODE' | 'CODEX' | 'CURSOR' | 'GEMINI_CLI' | 'OPENCLAW' | 'OPENCODE' | 'PI' | 'HTTP' | 'PROCESS';
export type TelegramAccessMode = 'OPEN' | 'WHITELIST';

export interface LLMConfig {
    temperature: number;
    maxTokens: number;
    topP?: number;
    stopSequences?: string[];
}

export interface RuntimeConfig {
    mode: 'CLAUDE_CODE' | 'N8N' | 'API' | 'CUSTOM';
    maxIterations: number;
    timeoutMs: number;
    allowedCommands?: string[];
    blockedCommands?: string[];
    workingDirectory?: string;
    n8nApiUrl?: string;
    n8nApiKey?: string;
    mcpServers?: Array<{ name: string; url: string; token?: string }>;
    agemsApiAccess?: boolean;
    agemsPermissions?: string[];
    maxTokensPerMinute?: number;
    maxApiCallsPerMinute?: number;
    maxCostPerDay?: number;
}

export interface TelegramConfig {
    botToken?: string;
    botEnabled?: boolean;
    accessMode: TelegramAccessMode;
    allowedChatIds?: number[];
    voiceEnabled?: boolean;
    ttsVoice?: string;
    apiId?: number;
    apiHash?: string;
    sessionString?: string;
}

/**
 * Full AGEMS Agent — stored as ISNode.config extension + Dexie relations.
 * The 45-field model is split:
 * - Core identity + LLM + runtime lives in topology ISNode.config (persisted via KV/dexie projects)
 * - Relations (skills/tools/memory etc) live in separate Dexie tables (agentSkills etc)
 */
export interface AgemsAgentCore {
    // Identity
    id: string;
    name: string;
    slug: string;
    avatar?: string;
    type: AgentType;
    status: AgentStatus;
    // LLM Brain
    llmProvider: LLMProvider;
    llmModel: string;
    llmConfig: LLMConfig;
    // Mission
    systemPrompt: string;
    mission?: string;
    values?: string[];
    // Runtime
    runtimeConfig: RuntimeConfig;
    // Adapter
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
    createdAt: number;
    updatedAt: number;
}

// Dexie relation tables (Phase 0)

export interface AgentSkillLink {
    id?: number;
    agentId: string;
    skillId: string;
    config?: Record<string, unknown>;
    enabled: boolean;
}

export interface AgentToolLink {
    id?: number;
    agentId: string;
    toolId: string;
    permissions: string[];
    approvalMode: 'FREE' | 'REQUIRES_APPROVAL' | 'BLOCKED';
    enabled: boolean;
}

export interface AgentResponsibility {
    id?: number;
    agentId: string;
    title: string;
    description?: string;
    kpiMetrics?: Record<string, string>;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AgentMetric {
    id?: number;
    agentId: string;
    metricType: 'COST' | 'LATENCY' | 'QUALITY' | 'ERROR_RATE' | 'TASKS_DONE' | 'TOKENS_USED';
    value: number;
    periodStart: number;
    periodEnd: number;
    metadata?: Record<string, unknown>;
}

export type MemoryType = 'CONTEXT' | 'CONVERSATION' | 'FILE' | 'KNOWLEDGE';
export interface AgentMemory {
    id?: number;
    agentId: string;
    type: MemoryType;
    content: string;
    metadata?: Record<string, unknown>;
    expiresAt?: number;
    createdAt: number;
}

export interface AgentExecution {
    id?: string;
    agentId: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'WAITING_HITL';
    triggerType: 'TASK' | 'MESSAGE' | 'SCHEDULE' | 'EVENT' | 'MANUAL' | 'MEETING' | 'TELEGRAM' | 'APPROVAL';
    triggerId?: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    tokensUsed?: number;
    costUsd?: number;
    provider?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    error?: string;
    startedAt: number;
    endedAt?: number;
}

export interface AgentConfigRevision {
    id?: number;
    agentId: string;
    version: number;
    changeset: Record<string, { old: unknown; new: unknown }>;
    snapshot: AgemsAgentCore;
    changedBy: string;
    changeNote?: string;
    createdAt: number;
}

export interface AgentApiKey {
    id?: string;
    agentId: string;
    name: string;
    keyHash: string;
    keyPrefix: string;
    lastUsedAt?: number;
    expiresAt?: number;
    revokedAt?: number;
    createdAt: number;
}

export interface AgentBudget {
    id?: number;
    agentId: string;
    monthlyLimitUsd: number;
    dailyLimitUsd?: number;
    hourlyLimitUsd?: number;
    currentSpendUsd: number;
    periodStart: number;
    periodEnd: number;
    softAlertPercent: number;
    hardStopEnabled: boolean;
}

export interface AgentRepository {
    id?: number;
    agentId: string;
    repositoryId: string;
    repoUrl: string;
    branch: string;
    isDefault: boolean;
    createdAt: number;
}
