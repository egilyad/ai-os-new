/**
 * ProjectInvocationBridge tests — invoke agent to work on project.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectInvocationBridge } from './project-invocation-bridge';
import { ProjectWorkspaceService } from './project-workspace-service';
import { SuperAgentsDB } from './dexie-schema';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

function mockPM() {
    return {
        getProject: vi.fn().mockResolvedValue({ id: 'p1', name: 'Test' }),
        listProjects: vi.fn().mockResolvedValue([]),
        createProject: vi.fn(),
        updateProject: vi.fn(),
        deleteProject: vi.fn(),
        assignAgent: vi.fn(),
        unassignAgent: vi.fn(),
        getAgents: vi.fn(),
        createTask: vi.fn(),
        updateTask: vi.fn(),
        listTasks: vi.fn(),
        startRun: vi.fn(),
        completeRun: vi.fn(),
        getRun: vi.fn(),
        listRuns: vi.fn(),
        addMemory: vi.fn(),
        getMemories: vi.fn(),
        searchMemories: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
    };
}

function mockObs() {
    return {
        logActivity: vi.fn(),
        logToolCall: vi.fn(),
        logError: vi.fn(),
        resolveError: vi.fn(),
        logFileChange: vi.fn(),
        getObservability: vi.fn(),
        getActivity: vi.fn().mockReturnValue([]),
        getToolCalls: vi.fn().mockReturnValue([]),
        getErrors: vi.fn().mockReturnValue([]),
        getFileChanges: vi.fn().mockReturnValue([]),
    };
}

let db: SuperAgentsDB;
let ws: ProjectWorkspaceService;
let bridge: ProjectInvocationBridge;

beforeEach(async () => {
    try { await db?.delete(); } catch { /* first test */ }
    db = new SuperAgentsDB();
    db.version(999).stores({
        projects: 'id, status, type, createdAt, updatedAt',
        projectTasks: 'id, projectId, agentId, status, priority, createdAt',
        projectRuns: 'id, taskId, projectId, agentId, status, createdAt',
        projectFiles: '[projectId+path], projectId, path',
        projectArtifacts: 'id, projectId, type, createdAt',
        projectAssignments: '[projectId+agentId], projectId, agentId',
        keyValue: 'id',
    });
    await db.open();
    ws = new ProjectWorkspaceService(db as any);
    bridge = new ProjectInvocationBridge(mockPM() as any, ws, mockObs() as any);
});

describe('ProjectInvocationBridge', () => {
    it('invokes an agent on a project', async () => {
        const result = await bridge.invokeAgent({
            projectId: 'p1',
            agentId: 'dev-agent',
            task: 'Create index.html',
        });
        expect(result.success).toBe(true);
        expect(result.output).toContain('dev-agent');
    });

    it('tracks invocation history', async () => {
        await bridge.invokeAgent({ projectId: 'p1', agentId: 'a1', task: 't1' });
        await bridge.invokeAgent({ projectId: 'p1', agentId: 'a2', task: 't2' });
        const recent = bridge.getRecentInvocations('p1');
        expect(recent).toHaveLength(2);
        expect(recent[0].agentId).toBe('a1');
        expect(recent[1].agentId).toBe('a2');
    });

    it('isolates by project', async () => {
        await bridge.invokeAgent({ projectId: 'p1', agentId: 'a1', task: 't1' });
        await bridge.invokeAgent({ projectId: 'p2', agentId: 'a2', task: 't2' });
        expect(bridge.getRecentInvocations('p1')).toHaveLength(1);
        expect(bridge.getRecentInvocations('p2')).toHaveLength(1);
    });
});
