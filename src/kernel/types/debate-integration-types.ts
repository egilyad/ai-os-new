/**
 * Debate integration types (roadmapp.md §P13).
 *
 * Project Decision → Debate → Verdict → Task
 */

export type DebateTrigger = 'manual' | 'automatic' | 'threshold';

export interface ProjectDebate {
    id: string;
    projectId: string;
    decision: string;
    trigger: DebateTrigger;
    debateSessionId?: string;
    verdict?: string;
    verdictConfidence?: number;
    createdTaskId?: string;
    status: 'pending' | 'debating' | 'verdict' | 'task-created' | 'failed';
    createdAt: number;
    completedAt?: number;
}

export interface DebateVerdict {
    debateId: string;
    summary: string;
    recommendation: string;
    confidence: number; // 0-1
    dissentingViews: string[];
    consensusReached: boolean;
}
