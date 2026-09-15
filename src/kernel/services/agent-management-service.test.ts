/**
 * AgentManagementService tests — CRUD, lifecycle, hierarchy, skills, tools,
 * responsibilities, metrics, memory, executions, revisions, budgets, export/import.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Dexie from 'dexie';
import { AgentManagementService } from './agent-management-service';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

class TestDB extends Dexie {
    agentManaged!: Dexie.Table<Record<string, unknown>>;
    agentSkills!: Dexie.Table<Record<string, unknown>>;
    agentTools!: Dexie.Table<Record<string, unknown>>;
    agentResponsibilities!: Dexie.Table<Record<string, unknown>>;
    agentMetrics!: Dexie.Table<Record<string, unknown>>;
    agentMemory!: Dexie.Table<Record<string, unknown>>;
    agentExecutions!: Dexie.Table<Record<string, unknown>>;
    agentConfigRevisions!: Dexie.Table<Record<string, unknown>>;
    agentApiKeys!: Dexie.Table<Record<string, unknown>>;
    agentBudgets!: Dexie.Table<Record<string, unknown>>;
    budgetIncidents!: Dexie.Table<Record<string, unknown>>;

    constructor() {
        super('AgentManagementTestDB');
        this.version(1).stores({
            agentManaged: 'id, slug, status, type, llmProvider, ownerId, parentAgentId, createdAt',
            agentSkills: 'id, agentId, skillId',
            agentTools: 'id, agentId, toolId',
            agentResponsibilities: 'id, agentId',
            agentMetrics: 'id, agentId, metricType, periodStart',
            agentMemory: 'id, agentId, type',
            agentExecutions: 'id, agentId, status, startedAt, provider, model',
            agentConfigRevisions: 'id, agentId, version',
            agentApiKeys: 'id, agentId',
            agentBudgets: 'id, agentId',
            budgetIncidents: 'id, budgetId',
        });
    }
}

let db: TestDB;
let service: AgentManagementService;

beforeEach(async () => {
    try { await db?.delete(); } catch { /* first test */ }
    db = new TestDB();
    await db.open();
    service = new AgentManagementService(db as any);
});

describe('AgentManagementService', () => {
    describe('CRUD', () => {
        it('creates an agent', async () => {
            const a = await service.create({ name: 'Test Agent', role: 'analyst' });
            expect(a.id).toMatch(/^agent-/);
            expect(a.name).toBe('Test Agent');
            expect(a.role).toBe('analyst');
            expect(a.status).toBe('draft');
            expect(a.type).toBe('assistant');
            expect(a.slug).toBe('test-agent');
            expect(a.configVersion).toBe(1);
        });

        it('gets an agent by id', async () => {
            const a = await service.create({ name: 'Get Me', role: 'dev' });
            const found = await service.get(a.id);
            expect(found).toBeDefined();
            expect(found!.name).toBe('Get Me');
        });

        it('gets an agent by slug', async () => {
            await service.create({ name: 'Slug Agent', slug: 'my-slug', role: 'qa' });
            const found = await service.getBySlug('my-slug');
            expect(found).toBeDefined();
            expect(found!.slug).toBe('my-slug');
        });

        it('lists agents', async () => {
            await service.create({ name: 'A', role: 'dev' });
            await service.create({ name: 'B', role: 'qa' });
            const list = await service.list();
            expect(list.length).toBe(2);
        });

        it('filters by status', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            await service.activate(a.id);
            const active = await service.list({ status: 'active' });
            expect(active.length).toBe(1);
            expect(active[0].id).toBe(a.id);
        });

        it('filters by type', async () => {
            await service.create({ name: 'A', role: 'dev', type: 'autonomous' });
            await service.create({ name: 'B', role: 'qa' });
            const autos = await service.list({ type: 'autonomous' });
            expect(autos.length).toBe(1);
        });

        it('filters by search', async () => {
            await service.create({ name: 'Alpha Bot', role: 'dev' });
            await service.create({ name: 'Beta Bot', role: 'qa' });
            const found = await service.list({ search: 'Alpha' });
            expect(found.length).toBe(1);
            expect(found[0].name).toBe('Alpha Bot');
        });

        it('updates an agent', async () => {
            const a = await service.create({ name: 'Old', role: 'dev' });
            const updated = await service.update(a.id, { name: 'New' });
            expect(updated.name).toBe('New');
            expect(updated.updatedAt).toBeGreaterThanOrEqual(a.updatedAt);
        });

        it('deletes an agent', async () => {
            const a = await service.create({ name: 'Delete Me', role: 'dev' });
            await service.delete(a.id);
            const found = await service.get(a.id);
            expect(found).toBeUndefined();
        });

        it('throws on update of missing agent', async () => {
            await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow('not found');
        });

        it('throws on delete of missing agent', async () => {
            await expect(service.delete('nonexistent')).rejects.toThrow('not found');
        });
    });

    describe('Lifecycle', () => {
        it('activates an agent', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            const activated = await service.activate(a.id);
            expect(activated.status).toBe('active');
        });

        it('pauses an agent', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            await service.activate(a.id);
            const paused = await service.pause(a.id);
            expect(paused.status).toBe('paused');
        });

        it('sets error state', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            const errored = await service.setError(a.id, 'Something broke');
            expect(errored.status).toBe('error');
            expect(errored.metadata?.lastError).toBe('Something broke');
        });

        it('archives and restores', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            const archived = await service.archive(a.id);
            expect(archived.status).toBe('archived');
            const restored = await service.restore(a.id);
            expect(restored.status).toBe('draft');
        });
    });

    describe('Hierarchy', () => {
        it('sets parent', async () => {
            const parent = await service.create({ name: 'Parent', role: 'lead' });
            const child = await service.create({ name: 'Child', role: 'dev' });
            const updated = await service.setParent(child.id, parent.id);
            expect(updated.parentAgentId).toBe(parent.id);
        });

        it('lists children', async () => {
            const parent = await service.create({ name: 'Parent', role: 'lead' });
            await service.create({ name: 'Child1', role: 'dev', parentAgentId: parent.id });
            await service.create({ name: 'Child2', role: 'qa', parentAgentId: parent.id });
            const children = await service.getChildren(parent.id);
            expect(children.length).toBe(2);
        });

        it('prevents circular hierarchy', async () => {
            const a = await service.create({ name: 'A', role: 'lead' });
            const b = await service.create({ name: 'B', role: 'dev', parentAgentId: a.id });
            await expect(service.setParent(a.id, b.id)).rejects.toThrow('circular');
        });

        it('spawns a child from parent', async () => {
            const parent = await service.create({ name: 'Parent', role: 'lead', llmProvider: 'openai' });
            const child = await service.spawn(parent.id, { name: 'Spawned' });
            expect(child.parentAgentId).toBe(parent.id);
            expect(child.llmProvider).toBe('openai');
        });
    });

    describe('Skills', () => {
        it('adds and lists skills', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            const skill = await service.addSkill(a.id, 'web-search');
            expect(skill.skillId).toBe('web-search');
            expect(skill.enabled).toBe(true);
            const list = await service.listSkills(a.id);
            expect(list.length).toBe(1);
        });

        it('removes skills', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            await service.addSkill(a.id, 'web-search');
            await service.removeSkill(a.id, 'web-search');
            const list = await service.listSkills(a.id);
            expect(list.length).toBe(0);
        });

        it('updates skill config', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            await service.addSkill(a.id, 'web-search');
            const updated = await service.updateSkillConfig(a.id, 'web-search', { maxResults: 5 });
            expect(updated.config?.maxResults).toBe(5);
        });
    });

    describe('Tools', () => {
        it('adds and lists tools', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            await service.addTool(a.id, 'shell', 'require-approval');
            const list = await service.listTools(a.id);
            expect(list.length).toBe(1);
            expect(list[0].toolId).toBe('shell');
            expect(list[0].approvalMode).toBe('require-approval');
        });

        it('removes tools', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            await service.addTool(a.id, 'shell');
            await service.removeTool(a.id, 'shell');
            expect((await service.listTools(a.id)).length).toBe(0);
        });
    });

    describe('Responsibilities', () => {
        it('sets and lists responsibilities', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            const resp = await service.setResponsibility(a.id, 'Review code', 'Review PRs', ['10 PRs/day']);
            expect(resp.title).toBe('Review code');
            expect(resp.kpis).toContain('10 PRs/day');
            expect((await service.listResponsibilities(a.id)).length).toBe(1);
        });

        it('removes responsibilities', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            const resp = await service.setResponsibility(a.id, 'Review', 'Desc');
            await service.removeResponsibility(a.id, resp.id);
            expect((await service.listResponsibilities(a.id)).length).toBe(0);
        });
    });

    describe('Metrics', () => {
        it('records and retrieves metrics', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            await service.recordMetric(a.id, 'cost_usd', 0.45);
            await service.recordMetric(a.id, 'tokens_used', 1200);
            const metrics = await service.getMetrics(a.id);
            expect(metrics.length).toBe(2);
        });

        it('gets cost stats', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            await service.recordMetric(a.id, 'cost_usd', 0.10);
            await service.recordMetric(a.id, 'cost_usd', 0.20);
            await service.recordMetric(a.id, 'tokens_used', 500);
            await service.recordMetric(a.id, 'tokens_used', 1500);
            await service.recordMetric(a.id, 'tasks_done', 2);
            const stats = await service.getCostStats(a.id);
            expect(stats.totalCostUsd).toBeCloseTo(0.30);
            expect(stats.totalTokens).toBe(2000);
            expect(stats.tasksDone).toBe(2);
            expect(stats.avgCostPerTask).toBeCloseTo(0.15);
        });
    });

    describe('Memory', () => {
        it('adds and retrieves memories', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            await service.addMemory(a.id, 'context', 'User prefers dark mode');
            await service.addMemory(a.id, 'conversation', 'Discussed API design');
            const mems = await service.getMemories(a.id);
            expect(mems.length).toBe(2);
        });

        it('filters memories by type', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            await service.addMemory(a.id, 'context', 'Info 1');
            await service.addMemory(a.id, 'conversation', 'Info 2');
            const contextOnly = await service.getMemories(a.id, 'context');
            expect(contextOnly.length).toBe(1);
        });

        it('deletes memory', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            const mem = await service.addMemory(a.id, 'context', 'X');
            await service.deleteMemory(mem.id);
            expect((await service.getMemories(a.id)).length).toBe(0);
        });
    });

    describe('Executions', () => {
        it('starts and completes execution', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            const exec = await service.startExecution(a.id, 'manual', 'Run tests', 'openai', 'gpt-4');
            expect(exec.status).toBe('running');
            expect(exec.trigger).toBe('manual');

            const completed = await service.completeExecution(exec.id, 'success', 'All passed', undefined, 0.05);
            expect(completed.status).toBe('success');
            expect(completed.result).toBe('All passed');
            expect(completed.costUsd).toBe(0.05);
            expect(completed.durationMs).toBeGreaterThanOrEqual(0);
        });

        it('lists executions by status', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            const e1 = await service.startExecution(a.id, 'manual', 'Task 1');
            const e2 = await service.startExecution(a.id, 'scheduled', 'Task 2');
            await service.completeExecution(e1.id, 'success');
            const running = await service.listExecutions(a.id, 'running');
            expect(running.length).toBe(1);
            expect(running[0].id).toBe(e2.id);
        });
    });

    describe('Config Revisions', () => {
        it('saves and lists revisions', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            const rev = await service.saveRevision(a.id, { name: 'B' }, 'Name change');
            expect(rev.version).toBe(2);
            expect(rev.note).toBe('Name change');
            const list = await service.listRevisions(a.id);
            expect(list.length).toBe(1);
        });

        it('rolls back a revision', async () => {
            const a = await service.create({ name: 'Original', role: 'dev' });
            await service.update(a.id, { name: 'Changed' });
            const rev = await service.saveRevision(a.id, { name: 'Original' }, 'Revert');
            const rolledBack = await service.rollbackRevision(a.id, rev.id);
            expect(rolledBack.name).toBe('Original');
        });
    });

    describe('API Keys', () => {
        it('creates and lists keys', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            await service.createApiKey(a.id, 'openai', 'hash123');
            const keys = await service.listApiKeys(a.id);
            expect(keys.length).toBe(1);
            expect(keys[0].provider).toBe('openai');
            expect(keys[0].status).toBe('active');
        });

        it('revokes a key', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            const key = await service.createApiKey(a.id, 'openai', 'hash123');
            await service.revokeApiKey(key.id);
            const keys = await service.listApiKeys(a.id);
            expect(keys[0].status).toBe('revoked');
        });
    });

    describe('Budgets', () => {
        it('sets and gets budget', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            const budget = await service.setBudget(a.id, 100, 'monthly', 0.8);
            expect(budget.limitUsd).toBe(100);
            expect(budget.period).toBe('monthly');
            const found = await service.getBudget(a.id);
            expect(found?.id).toBe(budget.id);
        });

        it('updates existing budget', async () => {
            const a = await service.create({ name: 'A', role: 'dev' });
            await service.setBudget(a.id, 100, 'monthly');
            const updated = await service.setBudget(a.id, 200, 'monthly');
            expect(updated.limitUsd).toBe(200);
        });
    });

    describe('Export / Import', () => {
        it('exports and imports an agent', async () => {
            const a = await service.create({ name: 'Export Me', role: 'dev' });
            await service.addSkill(a.id, 'web-search');
            await service.addTool(a.id, 'shell');

            const exported = await service.exportAgent(a.id);
            expect(exported.agent.name).toBe('Export Me');
            expect(exported.skills.length).toBe(1);
            expect(exported.tools.length).toBe(1);

            const result = await service.importAgent({ exported });
            expect(result.agentId).toMatch(/^agent-/);
            const imported = await service.get(result.agentId);
            expect(imported?.name).toContain('Export Me');
        });
    });

    describe('Delegation', () => {
        it('delegates a task from parent to child', async () => {
            const parent = await service.create({ name: 'Parent', role: 'lead' });
            const child = await service.create({ name: 'Child', role: 'dev' });
            const exec = await service.delegate(parent.id, child.id, 'Implement feature X');
            expect(exec.agentId).toBe(child.id);
            expect(exec.taskSummary).toContain('[delegated by Parent]');
        });

        it('throws on delegation to missing agent', async () => {
            const a = await service.create({ name: 'A', role: 'lead' });
            await expect(service.delegate(a.id, 'missing', 'task')).rejects.toThrow('not found');
        });
    });
});
