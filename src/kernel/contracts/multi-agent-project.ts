/**
 * Multi-agent project contract (roadmapp.md §P6).
 */
import type { MultiAgentPipeline, PipelineStage } from '../types/multi-agent-types';

export interface IMultiAgentProjectService {
    createPipeline(projectId: string): Promise<MultiAgentPipeline>;
    getPipeline(projectId: string): Promise<MultiAgentPipeline | undefined>;
    assignAgent(projectId: string, stage: PipelineStage, agentId: string): Promise<void>;
    completeStage(projectId: string, stage: PipelineStage, output?: string): Promise<void>;
    advancePipeline(projectId: string): Promise<PipelineStage | null>;
    getPipelinesByStage(stage: PipelineStage): Promise<MultiAgentPipeline[]>;
}
