import type { ILifecycle } from './lifecycle';

export interface LedgerFact {
    id: string;
    text: string;
    sourceNodeId?: string;
    createdAt: number;
}

export interface LedgerTask {
    id: string;
    description: string;
    status: 'pending' | 'in_progress' | 'done' | 'failed';
    dependsOn: string[];
}

export interface LedgerSnapshot {
    facts: LedgerFact[];
    tasks: LedgerTask[];
    stalls: number;
    progress: number;
}

/** Task/Fact ledger with per-step progress reflection (Magentic-One-inspired). */
export interface IMissionLedgerService extends ILifecycle {
    /** Begin a new mission ledger (named `begin` to avoid ILifecycle.start collision). */
    begin(goal: string): string;
    get(missionId: string): LedgerSnapshot | undefined;
    addFact(missionId: string, text: string, sourceNodeId?: string): void;
    setTasks(missionId: string, tasks: LedgerTask[]): void;
    /** Record a step; returns true when progress stalled and replan is advised. */
    recordStep(missionId: string, nodeId: string, ok: boolean): boolean;
    finish(missionId: string): void;
}
