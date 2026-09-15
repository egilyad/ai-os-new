/**
 * Agent Management System contract (AGEMS port, Phase 0).
 *
 * Full agent lifecycle: types, status, config, hierarchy, skills, tools,
 * responsibilities, metrics, memory, executions, revisions, budgets.
 */
import type {
    AgentRecord,
    AgentSkillRecord,
    AgentToolRecord,
    ResponsibilityRecord,
    AgentMetricRecord,
    AgentMemoryRecord,
    AgentExecutionRecord,
    AgentConfigRevisionRecord,
    AgentApiKeyRecord,
    AgentBudgetRecord,
    BudgetIncidentRecord,
    CreateAgentInput,
    UpdateAgentInput,
    AgentFilters,
    CostStats,
    ExportedAgent,
    ImportAgentInput,
    ImportResult,
    MetricType,
    MemoryType,
    TriggerType,
    ExecutionStatus,
} from '../types/agent-management-types';

export interface IAgentManagementService {
    // ── Agent CRUD ──
    create(input: CreateAgentInput): Promise<AgentRecord>;
    get(id: string): Promise<AgentRecord | undefined>;
    getBySlug(slug: string): Promise<AgentRecord | undefined>;
    list(filters?: AgentFilters): Promise<AgentRecord[]>;
    update(id: string, input: UpdateAgentInput): Promise<AgentRecord>;
    delete(id: string): Promise<void>;
    archive(id: string): Promise<AgentRecord>;
    restore(id: string): Promise<AgentRecord>;

    // ── Lifecycle ──
    activate(id: string): Promise<AgentRecord>;
    pause(id: string): Promise<AgentRecord>;
    setError(id: string, error: string): Promise<AgentRecord>;

    // ── Hierarchy ──
    setParent(childId: string, parentId: string | null): Promise<AgentRecord>;
    getChildren(parentId: string): Promise<AgentRecord[]>;
    getHierarchy(): Promise<AgentRecord[]>;
    spawn(parentId: string, overrides: Partial<CreateAgentInput>): Promise<AgentRecord>;

    // ── Skills ──
    addSkill(agentId: string, skillId: string, config?: Record<string, unknown>): Promise<AgentSkillRecord>;
    removeSkill(agentId: string, skillId: string): Promise<void>;
    listSkills(agentId: string): Promise<AgentSkillRecord[]>;
    updateSkillConfig(agentId: string, skillId: string, config: Record<string, unknown>): Promise<AgentSkillRecord>;

    // ── Tools ──
    addTool(agentId: string, toolId: string, approvalMode?: string): Promise<AgentToolRecord>;
    removeTool(agentId: string, toolId: string): Promise<void>;
    listTools(agentId: string): Promise<AgentToolRecord[]>;

    // ── Responsibilities & KPIs ──
    setResponsibility(agentId: string, title: string, description: string, kpis?: string[]): Promise<ResponsibilityRecord>;
    removeResponsibility(agentId: string, respId: string): Promise<void>;
    listResponsibilities(agentId: string): Promise<ResponsibilityRecord[]>;

    // ── Metrics ──
    recordMetric(agentId: string, metricType: MetricType, value: number, periodStart?: number, periodEnd?: number): Promise<AgentMetricRecord>;
    getMetrics(agentId: string, metricType?: MetricType, from?: number, to?: number): Promise<AgentMetricRecord[]>;
    getCostStats(agentId: string, from?: number, to?: number): Promise<CostStats>;

    // ── Memory ──
    addMemory(agentId: string, type: MemoryType, content: string, metadata?: Record<string, unknown>): Promise<AgentMemoryRecord>;
    getMemories(agentId: string, type?: MemoryType): Promise<AgentMemoryRecord[]>;
    deleteMemory(memoryId: string): Promise<void>;

    // ── Executions ──
    startExecution(agentId: string, trigger: TriggerType, taskSummary: string, provider?: string, model?: string): Promise<AgentExecutionRecord>;
    completeExecution(executionId: string, status: ExecutionStatus, result?: string, error?: string, costUsd?: number): Promise<AgentExecutionRecord>;
    listExecutions(agentId: string, status?: ExecutionStatus, limit?: number): Promise<AgentExecutionRecord[]>;

    // ── Config Revisions ──
    saveRevision(agentId: string, patch: Partial<UpdateAgentInput>, note?: string): Promise<AgentConfigRevisionRecord>;
    listRevisions(agentId: string): Promise<AgentConfigRevisionRecord[]>;
    rollbackRevision(agentId: string, revisionId: string): Promise<AgentRecord>;

    // ── API Keys ──
    createApiKey(agentId: string, provider: string, keyHash: string, expiresAt?: number): Promise<AgentApiKeyRecord>;
    revokeApiKey(keyId: string): Promise<void>;
    listApiKeys(agentId: string): Promise<AgentApiKeyRecord[]>;

    // ── Budgets ──
    setBudget(agentId: string, limitUsd: number, period: string, alertThreshold?: number): Promise<AgentBudgetRecord>;
    getBudget(agentId: string): Promise<AgentBudgetRecord | undefined>;
    listBudgetIncidents(agentId: string): Promise<BudgetIncidentRecord[]>;

    // ── Export / Import ──
    exportAgent(id: string): Promise<ExportedAgent>;
    importAgent(input: ImportAgentInput): Promise<ImportResult>;

    // ── Delegation ──
    delegate(parentId: string, childId: string, taskSummary: string): Promise<AgentExecutionRecord>;
}
