import type { ILifecycle } from './lifecycle';

export type ReplanStepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

export interface ReplanStep {
    id: string;
    description: string;
    status: ReplanStepStatus;
    result?: string;
}

export interface ReplanRequest {
    goal: string;
    steps: ReplanStep[];
    /** Cap on the revised plan size (defaults to 8). */
    maxSteps?: number;
}

export interface ReplannedStep {
    id: string;
    description: string;
}

export interface ReplanResponse {
    revisedSteps: ReplannedStep[];
    rationale: string;
    changed: boolean;
}

/**
 * ReplanningService — dynamic plan revision (PentAGI-inspired): given the
 * original goal and the current step outcomes, produce a revised plan that
 * keeps what works, rewords what failed, and drops what is no longer needed.
 */
export interface IReplanningService extends ILifecycle {
    replan(req: ReplanRequest): Promise<ReplanResponse>;
}
