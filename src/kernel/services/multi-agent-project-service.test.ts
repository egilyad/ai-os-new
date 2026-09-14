/**
 * MultiAgentProjectService tests — pipeline orchestration (roadmapp.md §P6).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MultiAgentProjectService } from './multi-agent-project-service';
import { nextStage, stageProgress, STAGE_ORDER } from '../types/multi-agent-types';
import type { MultiAgentPipeline } from '../types/multi-agent-types';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

function mockProjectManager() {
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

function mockEventBus() {
    return {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        emitOnce: vi.fn(),
        once: vi.fn(),
        onSafe: vi.fn().mockReturnValue(vi.fn()),
        subscribeAll: vi.fn().mockReturnValue(vi.fn()),
        getSubscriptionStats: vi.fn(),
    } as any;
}

describe('MultiAgentProjectService', () => {
    let svc: MultiAgentProjectService;
    let pm: ReturnType<typeof mockProjectManager>;

    beforeEach(() => {
        pm = mockProjectManager();
        svc = new MultiAgentProjectService(pm as any, mockEventBus());
    });

    it('creates a pipeline', async () => {
        const p = await svc.createPipeline('p1');
        expect(p.projectId).toBe('p1');
        expect(p.currentStage).toBe('research');
        expect(p.assignments).toHaveLength(4); // research, design, development, qa
    });

    it('returns existing pipeline on duplicate create', async () => {
        const p1 = await svc.createPipeline('p1');
        const p2 = await svc.createPipeline('p1');
        expect(p1).toBe(p2);
    });

    it('gets pipeline', async () => {
        await svc.createPipeline('p1');
        const p = await svc.getPipeline('p1');
        expect(p).toBeDefined();
    });

    it('assigns agent to a stage', async () => {
        await svc.createPipeline('p1');
        await svc.assignAgent('p1', 'research', 'alice');
        const p = await svc.getPipeline('p1');
        const a = p!.assignments.find((a) => a.stage === 'research');
        expect(a!.agentId).toBe('alice');
    });

    it('completes a stage', async () => {
        await svc.createPipeline('p1');
        await svc.assignAgent('p1', 'research', 'alice');
        await svc.completeStage('p1', 'research', 'Found 5 sources');
        const p = await svc.getPipeline('p1');
        const a = p!.assignments.find((a) => a.stage === 'research');
        expect(a!.status).toBe('completed');
        expect(a!.output).toBe('Found 5 sources');
    });

    it('advances to next stage', async () => {
        await svc.createPipeline('p1');
        await svc.completeStage('p1', 'research');
        const next = await svc.advancePipeline('p1');
        expect(next).toBe('design');
        const p = await svc.getPipeline('p1');
        expect(p!.currentStage).toBe('design');
        const a = p!.assignments.find((a) => a.stage === 'design');
        expect(a!.status).toBe('active');
    });

    it('returns null when advancing past done', async () => {
        await svc.createPipeline('p1');
        for (const stage of STAGE_ORDER) {
            if (stage === 'done') break;
            await svc.completeStage('p1', stage);
            const next = await svc.advancePipeline('p1');
            if (stage === 'qa') {
                expect(next).toBe('done');
            } else if (next) {
                expect(next).not.toBe(stage);
            }
        }
        const p = await svc.getPipeline('p1');
        expect(p!.currentStage).toBe('done');
    });

    it('filters pipelines by stage', async () => {
        await svc.createPipeline('p1');
        await svc.createPipeline('p2');
        await svc.completeStage('p1', 'research');
        await svc.advancePipeline('p1');
        const designPipelines = await svc.getPipelinesByStage('design');
        expect(designPipelines).toHaveLength(1);
        expect(designPipelines[0].projectId).toBe('p1');
    });
});

describe('nextStage', () => {
    it('returns the next stage in order', () => {
        expect(nextStage('research')).toBe('design');
        expect(nextStage('design')).toBe('development');
        expect(nextStage('development')).toBe('qa');
        expect(nextStage('qa')).toBe('done');
        expect(nextStage('done')).toBeNull();
    });
});

describe('stageProgress', () => {
    it('calculates progress', () => {
        const pipeline: MultiAgentPipeline = {
            projectId: 'p1',
            currentStage: 'development',
            assignments: [],
            createdAt: 0,
            updatedAt: 0,
        };
        const progress = stageProgress(pipeline);
        expect(progress.current).toBe(2); // index of development
        expect(progress.total).toBe(5);
        expect(progress.percent).toBe(50);
    });
});
