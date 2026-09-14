/**
 * Multi-agent project types (roadmapp.md §P6).
 *
 * Pipeline: Research → Design → Development → QA → Done
 */
export type PipelineStage = 'research' | 'design' | 'development' | 'qa' | 'done';

export interface StageAssignment {
    stage: PipelineStage;
    agentId: string;
    status: 'pending' | 'active' | 'completed' | 'failed';
    startedAt?: number;
    completedAt?: number;
    output?: string;
}

export interface MultiAgentPipeline {
    projectId: string;
    currentStage: PipelineStage;
    assignments: StageAssignment[];
    createdAt: number;
    updatedAt: number;
}

export const STAGE_ORDER: PipelineStage[] = ['research', 'design', 'development', 'qa', 'done'];

export function nextStage(current: PipelineStage): PipelineStage | null {
    const idx = STAGE_ORDER.indexOf(current);
    if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
    return STAGE_ORDER[idx + 1];
}

export function stageProgress(pipeline: MultiAgentPipeline): { current: number; total: number; percent: number } {
    const current = STAGE_ORDER.indexOf(pipeline.currentStage);
    const total = STAGE_ORDER.length;
    return { current, total, percent: Math.round((current / (total - 1)) * 100) };
}

export const DEFAULT_STAGE_AGENTS: Record<PipelineStage, string> = {
    research: 'research-agent',
    design: 'designer-agent',
    development: 'developer-agent',
    qa: 'qa-agent',
    done: '',
};
