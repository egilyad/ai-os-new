/**
 * project-demo-seed tests — demo project shape + idempotency.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- raw Dexie passed where wrapper expected */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectService } from './project-service';
import { ProjectRepository } from '../dal/project-repository';
import { SuperAgentsDB } from './dexie-schema';
import { seedProjectDemo, DEMO_PROJECT_MARKER } from './project-demo-seed';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

let db: SuperAgentsDB;
let service: ProjectService;

beforeEach(async () => {
    try {
        await db?.delete();
    } catch {
        /* first test */
    }
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
    service = new ProjectService(new ProjectRepository(db as any));
});

describe('seedProjectDemo', () => {
    it('seeds a project with three agents, tasks, a file and memory', async () => {
        const id = await seedProjectDemo(service);
        const project = await service.get(id);
        expect(project).toBeDefined();
        expect(project!.status).toBe('building');
        expect(project!.agentIds).toHaveLength(3);
        expect((project!.metadata as Record<string, unknown>)[DEMO_PROJECT_MARKER]).toBe(true);

        const agents = await service.listAgents(id);
        expect(new Set(agents.map((a) => a.agentId)).size).toBe(3);

        const tasks = await service.listTasks(id);
        expect(tasks).toHaveLength(3);
        const byStatus = new Map(tasks.map((t) => [t.status, t]));
        expect(byStatus.get('completed')?.result).toContain('Каркас готов');
        expect(byStatus.has('running')).toBe(true);
        expect(byStatus.has('queued')).toBe(true);

        const readme = await service.readFile(id, 'README.md');
        expect(readme?.content).toContain('Бот-напоминалка');

        const memory = await service.getMemory(id);
        expect(memory.goals.length).toBeGreaterThan(0);
        expect(memory.decisions.length).toBeGreaterThan(0);
    });

    it('is idempotent: repeated calls reuse the project', async () => {
        const first = await seedProjectDemo(service);
        const second = await seedProjectDemo(service);
        expect(second).toBe(first);
        expect(await service.listTasks(first)).toHaveLength(3);
        expect((await service.list()).filter((p) => p.name.includes('Демо'))).toHaveLength(1);
    });
});
