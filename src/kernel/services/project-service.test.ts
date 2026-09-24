/**
 * ProjectService tests — CRUD, agents, tasks, runs, files, memory.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- raw Dexie passed where wrapper expected */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectService } from './project-service';
import { ProjectRepository } from '../dal/project-repository';
import { SuperAgentsDB } from './dexie-schema';

// Mock Dexie
vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

let db: SuperAgentsDB;
let repo: ProjectRepository;
let service: ProjectService;

beforeEach(async () => {
    // Delete previous DB to ensure clean state
    try { await db?.delete(); } catch { /* first test */ }
    db = new SuperAgentsDB();
    db.version(999).stores({
        projects: 'id, status, type, createdAt, updatedAt',
        projectTasks: 'id, projectId, agentId, status, priority, createdAt',
        projectRuns: 'id, taskId, projectId, agentId, status, createdAt',
        projectFiles: '[projectId+path], projectId, path',
        projectArtifacts: 'id, projectId, type, createdAt',
        projectAssignments: '[projectId+agentId], projectId, agentId',
    });
    await db.open();
    repo = new ProjectRepository(db as any);
    service = new ProjectService(repo);
});

describe('ProjectService', () => {
    describe('CRUD', () => {
        it('creates a project', async () => {
            const p = await service.create({ name: 'Test', description: 'desc', type: 'website' });
            expect(p.id).toMatch(/^project-/);
            expect(p.name).toBe('Test');
            expect(p.status).toBe('draft');
            expect(p.type).toBe('website');
        });

        it('gets a project by id', async () => {
            const p = await service.create({ name: 'Get Me', description: '', type: 'python' });
            const found = await service.get(p.id);
            expect(found).toBeDefined();
            expect(found!.name).toBe('Get Me');
        });

        it('lists projects', async () => {
            await service.create({ name: 'A', description: '', type: 'website' });
            await service.create({ name: 'B', description: '', type: 'python' });
            const list = await service.list();
            expect(list.length).toBe(2);
        });

        it('filters by status', async () => {
            await service.create({ name: 'Draft', description: '', type: 'website' });
            const p2 = await service.create({ name: 'Ready', description: '', type: 'website' });
            await service.update(p2.id, { status: 'ready' });
            const drafts = await service.list('draft');
            expect(drafts.length).toBe(1);
            expect(drafts[0].name).toBe('Draft');
            const ready = await service.list('ready');
            expect(ready.length).toBe(1);
        });

        it('updates a project', async () => {
            const p = await service.create({ name: 'Old', description: '', type: 'website' });
            const updated = await service.update(p.id, { name: 'New' });
            expect(updated.name).toBe('New');
        });

        it('deletes a project', async () => {
            const p = await service.create({ name: 'Doomed', description: '', type: 'website' });
            await service.delete(p.id);
            const found = await service.get(p.id);
            expect(found).toBeUndefined();
        });
    });

    describe('Agents', () => {
        it('assigns an agent', async () => {
            const p = await service.create({ name: 'P', description: '', type: 'website' });
            const a = await service.assignAgent(p.id, 'agent-1', 'developer', ['js']);
            expect(a.agentId).toBe('agent-1');
            expect(a.role).toBe('developer');

            const proj = await service.get(p.id);
            expect(proj!.agentIds).toContain('agent-1');
        });

        it('lists agents', async () => {
            const p = await service.create({ name: 'P', description: '', type: 'website' });
            await service.assignAgent(p.id, 'a1', 'dev');
            await service.assignAgent(p.id, 'a2', 'designer');
            const agents = await service.listAgents(p.id);
            expect(agents.length).toBe(2);
        });

        it('removes an agent', async () => {
            const p = await service.create({ name: 'P', description: '', type: 'website' });
            await service.assignAgent(p.id, 'a1', 'dev');
            await service.removeAgent(p.id, 'a1');
            const agents = await service.listAgents(p.id);
            expect(agents.length).toBe(0);
        });
    });

    describe('Tasks', () => {
        it('creates a task', async () => {
            const p = await service.create({ name: 'P', description: '', type: 'website' });
            const t = await service.createTask(p.id, 'agent-1', 'Build UI', 'Create components');
            expect(t.id).toMatch(/^task-/);
            expect(t.status).toBe('queued');
        });

        it('lists tasks', async () => {
            const p = await service.create({ name: 'P', description: '', type: 'website' });
            await service.createTask(p.id, 'a1', 'T1', 'd1');
            await service.createTask(p.id, 'a1', 'T2', 'd2');
            const tasks = await service.listTasks(p.id);
            expect(tasks.length).toBe(2);
        });

        it('updates task status', async () => {
            const p = await service.create({ name: 'P', description: '', type: 'website' });
            const t = await service.createTask(p.id, 'a1', 'T1', 'd1');
            const updated = await service.updateTaskStatus(t.id, 'running');
            expect(updated.status).toBe('running');
            expect(updated.startedAt).toBeDefined();

            const done = await service.updateTaskStatus(t.id, 'completed', 'All done');
            expect(done.status).toBe('completed');
            expect(done.result).toBe('All done');
            expect(done.completedAt).toBeDefined();
        });
    });

    describe('Runs', () => {
        it('starts and completes a run', async () => {
            const p = await service.create({ name: 'P', description: '', type: 'website' });
            const t = await service.createTask(p.id, 'a1', 'T1', 'd1');
            const run = await service.startRun(t.id, 'a1');
            expect(run.status).toBe('running');
            expect(run.projectId).toBe(p.id);

            const done = await service.completeRun(run.id, 'completed');
            expect(done.status).toBe('completed');
        });

        it('lists runs', async () => {
            const p = await service.create({ name: 'P', description: '', type: 'website' });
            const t = await service.createTask(p.id, 'a1', 'T1', 'd1');
            await service.startRun(t.id, 'a1');
            const runs = await service.listRuns(p.id);
            expect(runs.length).toBe(1);
        });
    });

    describe('Files', () => {
        it('writes and reads a file', async () => {
            const p = await service.create({ name: 'P', description: '', type: 'website' });
            await service.writeFile(p.id, '/index.html', '<html/>');
            const file = await service.readFile(p.id, '/index.html');
            expect(file).toBeDefined();
            expect(file!.content).toBe('<html/>');
        });

        it('lists files', async () => {
            const p = await service.create({ name: 'P', description: '', type: 'website' });
            await service.writeFile(p.id, '/a.html', 'a');
            await service.writeFile(p.id, '/b.html', 'b');
            const files = await service.listFiles(p.id);
            expect(files.length).toBe(2);
        });

        it('deletes a file', async () => {
            const p = await service.create({ name: 'P', description: '', type: 'website' });
            await service.writeFile(p.id, '/del.html', 'x');
            await service.deleteFile(p.id, '/del.html');
            const file = await service.readFile(p.id, '/del.html');
            expect(file).toBeUndefined();
        });
    });

    describe('Memory', () => {
        it('gets default memory', async () => {
            const p = await service.create({ name: 'P', description: '', type: 'website' });
            const mem = await service.getMemory(p.id);
            expect(mem.goals).toEqual([]);
        });

        it('updates memory', async () => {
            const p = await service.create({ name: 'P', description: '', type: 'website' });
            await service.updateMemory(p.id, { goals: ['Ship v1'] });
            const mem = await service.getMemory(p.id);
            expect(mem.goals).toEqual(['Ship v1']);
        });
    });
});
