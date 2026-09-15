/**
 * Agent Management Service — AGEMS port (Phase 0).
 *
 * Full agent lifecycle with Dexie persistence: types, status, config,
 * hierarchy, skills, tools, responsibilities, metrics, memory, executions,
 * config revisions, API keys, budgets, export/import, delegation.
 */
import type { IDatabaseService } from '../types/interfaces';
import type { IEventBus } from '../types/interfaces';
import type { IAgentManagementService } from '../contracts/agent-management';
import type {
    AgentRecord,
    AgentType,
    AgentStatus,
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
import { genId } from '../../utils/gen-id';

export class AgentManagementService implements IAgentManagementService {
    constructor(
        private database: IDatabaseService,
        private eventBus?: IEventBus,
    ) {}

    private get db() { return this.database; }

    private emit(event: string, data: unknown) {
        this.eventBus?.emit(event, data);
    }

    // ═══════════════════════════════════════════════════════════
    // Agent CRUD
    // ═══════════════════════════════════════════════════════════

    async create(input: CreateAgentInput): Promise<AgentRecord> {
        const now = Date.now();
        const agent: AgentRecord = {
            id: genId('agent'),
            slug: input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: input.name,
            role: input.role,
            type: input.type || 'assistant',
            status: 'draft',
            avatar: input.avatar,
            description: input.description,
            systemPrompt: input.systemPrompt,
            llmProvider: input.llmProvider,
            llmModel: input.llmModel,
            temperature: input.temperature,
            maxTokens: input.maxTokens,
            maxIterations: input.maxIterations,
            timeoutMs: input.timeoutMs,
            runtimeMode: input.runtimeMode || 'autonomous',
            mcpServers: input.mcpServers,
            allowedCommands: input.allowedCommands,
            blockedCommands: input.blockedCommands,
            toolApprovalMode: input.toolApprovalMode || 'auto',
            telegramConfig: input.telegramConfig,
            externalAdapter: input.externalAdapter,
            parentAgentId: input.parentAgentId,
            ownerId: input.ownerId || 'system',
            metadata: input.metadata,
            configVersion: 1,
            createdAt: now,
            updatedAt: now,
        };

        await this.db.agentManaged.put(agent);
        this.emit('agent:created', { agentId: agent.id, slug: agent.slug, type: agent.type });
        return agent;
    }

    async get(id: string): Promise<AgentRecord | undefined> {
        return this.db.agentManaged.get(id) as Promise<AgentRecord | undefined>;
    }

    async getBySlug(slug: string): Promise<AgentRecord | undefined> {
        const all = await this.db.agentManaged.toArray();
        return (all as AgentRecord[]).find(a => a.slug === slug);
    }

    async list(filters?: AgentFilters): Promise<AgentRecord[]> {
        let all = await this.db.agentManaged.toArray() as AgentRecord[];
        if (filters) {
            if (filters.status) all = all.filter(a => a.status === filters.status);
            if (filters.type) all = all.filter(a => a.type === filters.type);
            if (filters.ownerId) all = all.filter(a => a.ownerId === filters.ownerId);
            if (filters.parentAgentId) all = all.filter(a => a.parentAgentId === filters.parentAgentId);
            if (filters.search) {
                const q = filters.search.toLowerCase();
                all = all.filter(a => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q));
            }
        }
        return all;
    }

    async update(id: string, input: UpdateAgentInput): Promise<AgentRecord> {
        const existing = await this.db.agentManaged.get(id) as AgentRecord | undefined;
        if (!existing) throw new Error(`Agent ${id} not found`);

        const patch: Record<string, unknown> = { ...input, updatedAt: Date.now() };
        await this.db.agentManaged.update(id, patch);
        const updated = (await this.db.agentManaged.get(id)) as AgentRecord;
        this.emit('agent:updated', { agentId: id });
        return updated;
    }

    async delete(id: string): Promise<void> {
        const existing = await this.db.agentManaged.get(id);
        if (!existing) throw new Error(`Agent ${id} not found`);
        await this.db.agentManaged.delete(id);
        this.emit('agent:deleted', { agentId: id });
    }

    async archive(id: string): Promise<AgentRecord> {
        return this.updateStatus(id, 'archived');
    }

    async restore(id: string): Promise<AgentRecord> {
        return this.updateStatus(id, 'draft');
    }

    // ═══════════════════════════════════════════════════════════
    // Lifecycle
    // ═══════════════════════════════════════════════════════════

    async activate(id: string): Promise<AgentRecord> {
        return this.updateStatus(id, 'active');
    }

    async pause(id: string): Promise<AgentRecord> {
        return this.updateStatus(id, 'paused');
    }

    async setError(id: string, error: string): Promise<AgentRecord> {
        const updated = await this.updateStatus(id, 'error');
        await this.update(id, { metadata: { ...updated.metadata, lastError: error } });
        return (await this.db.agentManaged.get(id)) as AgentRecord;
    }

    private async updateStatus(id: string, status: AgentStatus): Promise<AgentRecord> {
        const existing = await this.db.agentManaged.get(id) as AgentRecord | undefined;
        if (!existing) throw new Error(`Agent ${id} not found`);
        await this.db.agentManaged.update(id, { status, updatedAt: Date.now() });
        const updated = (await this.db.agentManaged.get(id)) as AgentRecord;
        this.emit('agent:status-changed', { agentId: id, from: existing.status, to: status });
        return updated;
    }

    // ═══════════════════════════════════════════════════════════
    // Hierarchy
    // ═══════════════════════════════════════════════════════════

    async setParent(childId: string, parentId: string | null): Promise<AgentRecord> {
        const child = await this.db.agentManaged.get(childId) as AgentRecord | undefined;
        if (!child) throw new Error(`Agent ${childId} not found`);
        if (parentId) {
            const parent = await this.db.agentManaged.get(parentId) as AgentRecord | undefined;
            if (!parent) throw new Error(`Parent agent ${parentId} not found`);
            if (parent.parentAgentId === childId) throw new Error('Cannot set parent: circular hierarchy');
        }
        await this.db.agentManaged.update(childId, { parentAgentId: parentId, updatedAt: Date.now() });
        return (await this.db.agentManaged.get(childId)) as AgentRecord;
    }

    async getChildren(parentId: string): Promise<AgentRecord[]> {
        const all = await this.db.agentManaged.toArray() as AgentRecord[];
        return all.filter(a => a.parentAgentId === parentId);
    }

    async getHierarchy(): Promise<AgentRecord[]> {
        const all = await this.db.agentManaged.toArray() as AgentRecord[];
        return all.sort((a, b) => {
            if (a.parentAgentId === b.id) return -1;
            if (b.parentAgentId === a.id) return 1;
            return a.createdAt - b.createdAt;
        });
    }

    async spawn(parentId: string, overrides: Partial<CreateAgentInput>): Promise<AgentRecord> {
        const parent = await this.db.agentManaged.get(parentId) as AgentRecord | undefined;
        if (!parent) throw new Error(`Parent agent ${parentId} not found`);

        return this.create({
            name: overrides.name || `${parent.name} Child`,
            role: overrides.role || parent.role,
            type: overrides.type || parent.type,
            systemPrompt: overrides.systemPrompt || parent.systemPrompt,
            llmProvider: overrides.llmProvider || parent.llmProvider,
            llmModel: overrides.llmModel || parent.llmModel,
            temperature: overrides.temperature ?? parent.temperature,
            maxTokens: overrides.maxTokens ?? parent.maxTokens,
            runtimeMode: overrides.runtimeMode || parent.runtimeMode,
            parentAgentId: parentId,
            ownerId: overrides.ownerId || parent.ownerId,
            ...overrides,
        });
    }

    // ═══════════════════════════════════════════════════════════
    // Skills
    // ═══════════════════════════════════════════════════════════

    async addSkill(agentId: string, skillId: string, config?: Record<string, unknown>): Promise<AgentSkillRecord> {
        const record: AgentSkillRecord = {
            id: genId('askill'),
            agentId,
            skillId,
            config,
            enabled: true,
            addedAt: Date.now(),
        };
        await this.db.agentSkills.put(record);
        return record;
    }

    async removeSkill(agentId: string, skillId: string): Promise<void> {
        const all = await this.db.agentSkills.toArray() as AgentSkillRecord[];
        const match = all.find(s => s.agentId === agentId && s.skillId === skillId);
        if (match) await this.db.agentSkills.delete(match.id);
    }

    async listSkills(agentId: string): Promise<AgentSkillRecord[]> {
        const all = await this.db.agentSkills.toArray() as AgentSkillRecord[];
        return all.filter(s => s.agentId === agentId);
    }

    async updateSkillConfig(agentId: string, skillId: string, config: Record<string, unknown>): Promise<AgentSkillRecord> {
        const all = await this.db.agentSkills.toArray() as AgentSkillRecord[];
        const match = all.find(s => s.agentId === agentId && s.skillId === skillId);
        if (!match) throw new Error(`Skill ${skillId} not found on agent ${agentId}`);
        await this.db.agentSkills.update(match.id, { config });
        return (await this.db.agentSkills.get(match.id)) as AgentSkillRecord;
    }

    // ═══════════════════════════════════════════════════════════
    // Tools
    // ═══════════════════════════════════════════════════════════

    async addTool(agentId: string, toolId: string, approvalMode?: string): Promise<AgentToolRecord> {
        const record: AgentToolRecord = {
            id: genId('atool'),
            agentId,
            toolId,
            approvalMode: approvalMode || 'auto',
            enabled: true,
            addedAt: Date.now(),
        };
        await this.db.agentTools.put(record);
        return record;
    }

    async removeTool(agentId: string, toolId: string): Promise<void> {
        const all = await this.db.agentTools.toArray() as AgentToolRecord[];
        const match = all.find(t => t.agentId === agentId && t.toolId === toolId);
        if (match) await this.db.agentTools.delete(match.id);
    }

    async listTools(agentId: string): Promise<AgentToolRecord[]> {
        const all = await this.db.agentTools.toArray() as AgentToolRecord[];
        return all.filter(t => t.agentId === agentId);
    }

    // ═══════════════════════════════════════════════════════════
    // Responsibilities & KPIs
    // ═══════════════════════════════════════════════════════════

    async setResponsibility(agentId: string, title: string, description: string, kpis?: string[]): Promise<ResponsibilityRecord> {
        const record: ResponsibilityRecord = {
            id: genId('resp'),
            agentId,
            title,
            description,
            kpis: kpis || [],
            createdAt: Date.now(),
        };
        await this.db.agentResponsibilities.put(record);
        return record;
    }

    async removeResponsibility(agentId: string, respId: string): Promise<void> {
        const all = await this.db.agentResponsibilities.toArray() as ResponsibilityRecord[];
        const match = all.find(r => r.id === respId && r.agentId === agentId);
        if (match) await this.db.agentResponsibilities.delete(match.id);
    }

    async listResponsibilities(agentId: string): Promise<ResponsibilityRecord[]> {
        const all = await this.db.agentResponsibilities.toArray() as ResponsibilityRecord[];
        return all.filter(r => r.agentId === agentId);
    }

    // ═══════════════════════════════════════════════════════════
    // Metrics
    // ═══════════════════════════════════════════════════════════

    async recordMetric(agentId: string, metricType: MetricType, value: number, periodStart?: number, periodEnd?: number): Promise<AgentMetricRecord> {
        const record: AgentMetricRecord = {
            id: genId('amet'),
            agentId,
            metricType,
            value,
            periodStart: periodStart || Date.now(),
            periodEnd,
            recordedAt: Date.now(),
        };
        await this.db.agentMetrics.put(record);
        return record;
    }

    async getMetrics(agentId: string, metricType?: MetricType, from?: number, to?: number): Promise<AgentMetricRecord[]> {
        const all = await this.db.agentMetrics.toArray() as AgentMetricRecord[];
        return all.filter(m => {
            if (m.agentId !== agentId) return false;
            if (metricType && m.metricType !== metricType) return false;
            if (from && m.periodStart < from) return false;
            if (to && m.periodStart > to) return false;
            return true;
        });
    }

    async getCostStats(agentId: string, from?: number, to?: number): Promise<CostStats> {
        const metrics = await this.getMetrics(agentId, 'cost_usd', from, to);
        const totalCostUsd = metrics.reduce((sum, m) => sum + m.value, 0);

        const tokenMetrics = await this.getMetrics(agentId, 'tokens_used', from, to);
        const totalTokens = tokenMetrics.reduce((sum, m) => sum + m.value, 0);

        const execMetrics = await this.getMetrics(agentId, 'tasks_done', from, to);
        const tasksDone = execMetrics.reduce((sum, m) => sum + m.value, 0);

        return {
            totalCostUsd,
            totalTokens,
            tasksDone,
            avgCostPerTask: tasksDone > 0 ? totalCostUsd / tasksDone : 0,
            avgTokensPerTask: tasksDone > 0 ? totalTokens / tasksDone : 0,
        };
    }

    // ═══════════════════════════════════════════════════════════
    // Memory
    // ═══════════════════════════════════════════════════════════

    async addMemory(agentId: string, type: MemoryType, content: string, metadata?: Record<string, unknown>): Promise<AgentMemoryRecord> {
        const record: AgentMemoryRecord = {
            id: genId('amem'),
            agentId,
            type,
            content,
            metadata,
            createdAt: Date.now(),
        };
        await this.db.agentMemory.put(record);
        return record;
    }

    async getMemories(agentId: string, type?: MemoryType): Promise<AgentMemoryRecord[]> {
        const all = await this.db.agentMemory.toArray() as AgentMemoryRecord[];
        return all.filter(m => {
            if (m.agentId !== agentId) return false;
            if (type && m.type !== type) return false;
            return true;
        });
    }

    async deleteMemory(memoryId: string): Promise<void> {
        await this.db.agentMemory.delete(memoryId);
    }

    // ═══════════════════════════════════════════════════════════
    // Executions
    // ═══════════════════════════════════════════════════════════

    async startExecution(agentId: string, trigger: TriggerType, taskSummary: string, provider?: string, model?: string): Promise<AgentExecutionRecord> {
        const record: AgentExecutionRecord = {
            id: genId('aexec'),
            agentId,
            trigger,
            taskSummary,
            status: 'running',
            provider,
            model,
            startedAt: Date.now(),
        };
        await this.db.agentExecutions.put(record);
        this.emit('agent:execution:started', { agentId, executionId: record.id });
        return record;
    }

    async completeExecution(executionId: string, status: ExecutionStatus, result?: string, error?: string, costUsd?: number): Promise<AgentExecutionRecord> {
        const existing = await this.db.agentExecutions.get(executionId) as AgentExecutionRecord | undefined;
        if (!existing) throw new Error(`Execution ${executionId} not found`);

        const patch: Record<string, unknown> = {
            status,
            completedAt: Date.now(),
            durationMs: Date.now() - existing.startedAt,
        };
        if (result !== undefined) patch.result = result;
        if (error !== undefined) patch.error = error;
        if (costUsd !== undefined) patch.costUsd = costUsd;

        await this.db.agentExecutions.update(executionId, patch);
        const updated = (await this.db.agentExecutions.get(executionId)) as AgentExecutionRecord;

        this.emit('agent:execution:completed', { agentId: existing.agentId, executionId, status });

        // Record metrics
        await this.recordMetric(existing.agentId, 'tasks_done', 1);
        if (costUsd !== undefined && costUsd > 0) {
            await this.recordMetric(existing.agentId, 'cost_usd', costUsd);
        }

        return updated;
    }

    async listExecutions(agentId: string, status?: ExecutionStatus, limit = 50): Promise<AgentExecutionRecord[]> {
        const all = await this.db.agentExecutions.toArray() as AgentExecutionRecord[];
        let filtered = all.filter(e => e.agentId === agentId);
        if (status) filtered = filtered.filter(e => e.status === status);
        return filtered.sort((a, b) => b.startedAt - a.startedAt).slice(0, limit);
    }

    // ═══════════════════════════════════════════════════════════
    // Config Revisions
    // ═══════════════════════════════════════════════════════════

    async saveRevision(agentId: string, patch: Partial<UpdateAgentInput>, note?: string): Promise<AgentConfigRevisionRecord> {
        const agent = await this.db.agentManaged.get(agentId) as AgentRecord | undefined;
        if (!agent) throw new Error(`Agent ${agentId} not found`);

        const record: AgentConfigRevisionRecord = {
            id: genId('arev'),
            agentId,
            version: (agent.configVersion || 0) + 1,
            patch,
            note,
            createdAt: Date.now(),
        };
        await this.db.agentConfigRevisions.put(record);
        await this.db.agentManaged.update(agentId, { configVersion: record.version, updatedAt: Date.now() });
        return record;
    }

    async listRevisions(agentId: string): Promise<AgentConfigRevisionRecord[]> {
        const all = await this.db.agentConfigRevisions.toArray() as AgentConfigRevisionRecord[];
        return all.filter(r => r.agentId === agentId).sort((a, b) => b.version - a.version);
    }

    async rollbackRevision(agentId: string, revisionId: string): Promise<AgentRecord> {
        const revision = await this.db.agentConfigRevisions.get(revisionId) as AgentConfigRevisionRecord | undefined;
        if (!revision || revision.agentId !== agentId) throw new Error(`Revision ${revisionId} not found for agent ${agentId}`);

        const agent = (await this.db.agentManaged.get(agentId)) as AgentRecord;
        const rolledBack = { ...agent, ...revision.patch, updatedAt: Date.now() };
        await this.db.agentManaged.update(agentId, rolledBack);
        this.emit('agent:config:rollback', { agentId, revisionId });
        return (await this.db.agentManaged.get(agentId)) as AgentRecord;
    }

    // ═══════════════════════════════════════════════════════════
    // API Keys
    // ═══════════════════════════════════════════════════════════

    async createApiKey(agentId: string, provider: string, keyHash: string, expiresAt?: number): Promise<AgentApiKeyRecord> {
        const record: AgentApiKeyRecord = {
            id: genId('akey'),
            agentId,
            provider,
            keyHash,
            expiresAt,
            status: 'active',
            createdAt: Date.now(),
        };
        await this.db.agentApiKeys.put(record);
        return record;
    }

    async revokeApiKey(keyId: string): Promise<void> {
        const existing = await this.db.agentApiKeys.get(keyId) as AgentApiKeyRecord | undefined;
        if (!existing) throw new Error(`API key ${keyId} not found`);
        await this.db.agentApiKeys.update(keyId, { status: 'revoked', revokedAt: Date.now() });
    }

    async listApiKeys(agentId: string): Promise<AgentApiKeyRecord[]> {
        const all = await this.db.agentApiKeys.toArray() as AgentApiKeyRecord[];
        return all.filter(k => k.agentId === agentId);
    }

    // ═══════════════════════════════════════════════════════════
    // Budgets
    // ═══════════════════════════════════════════════════════════

    async setBudget(agentId: string, limitUsd: number, period: string, alertThreshold = 0.8): Promise<AgentBudgetRecord> {
        const existing = await this.getBudget(agentId);
        if (existing) {
            await this.db.agentBudgets.update(existing.id, { limitUsd, period, alertThreshold, updatedAt: Date.now() });
            return (await this.db.agentBudgets.get(existing.id)) as AgentBudgetRecord;
        }

        const record: AgentBudgetRecord = {
            id: genId('abud'),
            agentId,
            limitUsd,
            period,
            alertThreshold,
            currentUsageUsd: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await this.db.agentBudgets.put(record);
        return record;
    }

    async getBudget(agentId: string): Promise<AgentBudgetRecord | undefined> {
        const all = await this.db.agentBudgets.toArray() as AgentBudgetRecord[];
        return all.find(b => b.agentId === agentId);
    }

    async listBudgetIncidents(agentId: string): Promise<BudgetIncidentRecord[]> {
        const budget = await this.getBudget(agentId);
        if (!budget) return [];
        const all = await this.db.budgetIncidents.toArray() as BudgetIncidentRecord[];
        return all.filter(i => i.budgetId === budget.id);
    }

    // ═══════════════════════════════════════════════════════════
    // Export / Import
    // ═══════════════════════════════════════════════════════════

    async exportAgent(id: string): Promise<ExportedAgent> {
        const agent = (await this.db.agentManaged.get(id)) as AgentRecord | undefined;
        if (!agent) throw new Error(`Agent ${id} not found`);

        return {
            agent,
            skills: await this.listSkills(id),
            tools: await this.listTools(id),
            responsibilities: await this.listResponsibilities(id),
            exportedAt: Date.now(),
        };
    }

    async importAgent(input: ImportAgentInput): Promise<ImportResult> {
        const source = input.exported;
        const newId = genId('agent');
        const now = Date.now();

        const agent: AgentRecord = {
            ...source.agent,
            id: newId,
            slug: source.agent.slug + '-imported',
            name: source.agent.name + ' (imported)',
            status: 'draft',
            createdAt: now,
            updatedAt: now,
            configVersion: 1,
        };
        await this.db.agentManaged.put(agent);

        for (const skill of (source.skills || [])) {
            await this.addSkill(newId, skill.skillId, skill.config);
        }
        for (const tool of (source.tools || [])) {
            await this.addTool(newId, tool.toolId, tool.approvalMode);
        }

        return {
            agentId: newId,
            slug: agent.slug,
            relinkedCount: 0,
            warnings: [],
        };
    }

    // ═══════════════════════════════════════════════════════════
    // Delegation
    // ═══════════════════════════════════════════════════════════

    async delegate(parentId: string, childId: string, taskSummary: string): Promise<AgentExecutionRecord> {
        const parent = await this.db.agentManaged.get(parentId) as AgentRecord | undefined;
        if (!parent) throw new Error(`Parent agent ${parentId} not found`);
        const child = await this.db.agentManaged.get(childId) as AgentRecord | undefined;
        if (!child) throw new Error(`Child agent ${childId} not found`);

        return this.startExecution(childId, 'manual', `[delegated by ${parent.name}] ${taskSummary}`, parent.llmProvider, parent.llmModel);
    }
}
