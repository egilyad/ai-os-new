/**
 * MultiAgentProjectService — orchestrates projects through a pipeline (roadmapp.md §P6).
 *
 * Pipeline: Research → Design → Development → QA → Done
 * Each stage has an agent assignment and handoff.
 */
import type {
    MultiAgentPipeline,
    PipelineStage,
    StageAssignment,
} from '../types/multi-agent-types';
import type { IProjectManagerService } from '../contracts/project';
import type { IEventBus } from '../types/interfaces';
import { STAGE_ORDER, nextStage } from '../types/multi-agent-types';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('MultiAgentProjectService');

export interface IMultiAgentProjectService {
    createPipeline(projectId: string): Promise<MultiAgentPipeline>;
    getPipeline(projectId: string): Promise<MultiAgentPipeline | undefined>;
    assignAgent(projectId: string, stage: PipelineStage, agentId: string): Promise<void>;
    completeStage(projectId: string, stage: PipelineStage, output?: string): Promise<void>;
    advancePipeline(projectId: string): Promise<PipelineStage | null>;
    getPipelinesByStage(stage: PipelineStage): Promise<MultiAgentPipeline[]>;
}

export class MultiAgentProjectService implements IMultiAgentProjectService {
    private pipelines = new Map<string, MultiAgentPipeline>();
    private projectManager: IProjectManagerService;

    constructor(projectManager: IProjectManagerService, _eventBus: IEventBus) {
        this.projectManager = projectManager;
        void _eventBus;
    }

    async createPipeline(projectId: string): Promise<MultiAgentPipeline> {
        const project = await this.projectManager.get(projectId);
        if (!project) throw new Error(`Project not found: ${projectId}`);

        const existing = this.pipelines.get(projectId);
        if (existing) return existing;

        const assignments: StageAssignment[] = STAGE_ORDER
            .filter((s) => s !== 'done')
            .map((stage) => ({ stage, agentId: '', status: 'pending' as const }));

        const pipeline: MultiAgentPipeline = {
            projectId,
            currentStage: 'research',
            assignments,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        this.pipelines.set(projectId, pipeline);
        LOGGER.info('createPipeline', `Created pipeline for project ${projectId}`);
        return pipeline;
    }

    async getPipeline(projectId: string): Promise<MultiAgentPipeline | undefined> {
        return this.pipelines.get(projectId);
    }

    async assignAgent(projectId: string, stage: PipelineStage, agentId: string): Promise<void> {
        const pipeline = this.pipelines.get(projectId);
        if (!pipeline) throw new Error(`Pipeline not found: ${projectId}`);

        const assignment = pipeline.assignments.find((a) => a.stage === stage);
        if (!assignment) throw new Error(`Stage not found: ${stage}`);

        assignment.agentId = agentId;
        pipeline.updatedAt = Date.now();
        LOGGER.info('assignAgent', `Assigned ${agentId} to stage ${stage} in project ${projectId}`);
    }

    async completeStage(projectId: string, stage: PipelineStage, output?: string): Promise<void> {
        const pipeline = this.pipelines.get(projectId);
        if (!pipeline) throw new Error(`Pipeline not found: ${projectId}`);
        if (pipeline.currentStage !== stage) throw new Error(`Cannot complete ${stage}: current stage is ${pipeline.currentStage}`);

        const assignment = pipeline.assignments.find((a) => a.stage === stage);
        if (!assignment) throw new Error(`Stage not found: ${stage}`);

        assignment.status = 'completed';
        assignment.completedAt = Date.now();
        assignment.output = output;
        pipeline.updatedAt = Date.now();

        LOGGER.info('completeStage', `Stage ${stage} completed in project ${projectId}`);
    }

    async advancePipeline(projectId: string): Promise<PipelineStage | null> {
        const pipeline = this.pipelines.get(projectId);
        if (!pipeline) throw new Error(`Pipeline not found: ${projectId}`);

        if (pipeline.currentStage === 'done') return null;

        const current = pipeline.assignments.find((a) => a.stage === pipeline.currentStage);
        if (!current || current.status !== 'completed') {
            throw new Error(`Stage ${pipeline.currentStage} not completed yet`);
        }

        const next = nextStage(pipeline.currentStage);
        if (!next) return null;

        pipeline.currentStage = next;
        pipeline.updatedAt = Date.now();

        if (next !== 'done') {
            const nextAssignment = pipeline.assignments.find((a) => a.stage === next);
            if (nextAssignment) {
                nextAssignment.status = 'active';
                nextAssignment.startedAt = Date.now();
            }
        }

        LOGGER.info('advancePipeline', `Advanced to stage ${next} in project ${projectId}`);
        return next;
    }

    async getPipelinesByStage(stage: PipelineStage): Promise<MultiAgentPipeline[]> {
        if (stage === 'done') {
            return Array.from(this.pipelines.values()).filter((p) => p.currentStage === 'done');
        }
        return Array.from(this.pipelines.values()).filter((p) => p.currentStage === stage);
    }
}
