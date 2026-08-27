import type { ConsistencyCheckItem, ConsistencyReport } from './consistency-checker';

export type HealingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface HealingFixSuggestion {
    type: 'update_path' | 'update_name' | 'add_to_code' | 'remove_from_docs' | 'needs_review';
    description: string;
    confidence: number;
}

export interface HealingTask {
    id: string;
    docFile: string;
    failedItems: ConsistencyCheckItem[];
    analysis: string;
    suggestedFixes: HealingFixSuggestion[];
    status: HealingTaskStatus;
    debateConsensus?: string;
    verifiedAt?: number;
    verifiedPassed?: number;
    verifiedFailed?: number;
}

export interface HealingPlan {
    timestamp: number;
    report: ConsistencyReport;
    tasks: HealingTask[];
    summary: string;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
}

export interface HealingResult {
    plan: HealingPlan;
    passed: number;
    failed: number;
}

export interface IConsistencyHealingPipeline {
    analyze(docContents: Record<string, string>): HealingPlan;
    getPlan(): HealingPlan | null;
    executeTask(taskId: string): Promise<HealingTask>;
    executeAll(): Promise<HealingTask[]>;
    verifyAll(docContents?: Record<string, string>): Promise<ConsistencyReport>;
}
