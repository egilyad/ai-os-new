/**
 * AGEMS Task System — Phase 2.1
 * ONE_TIME / RECURRING / CONTINUOUS + 10-status Kanban
 */

export type AgemsTaskType = 'ONE_TIME' | 'RECURRING' | 'CONTINUOUS';
export type AgemsTaskStatus =
    | 'PENDING'
    | 'IN_PROGRESS'
    | 'IN_REVIEW'
    | 'IN_TESTING'
    | 'VERIFIED'
    | 'AWAITING_APPROVAL'
    | 'COMPLETED'
    | 'FAILED'
    | 'BLOCKED'
    | 'CANCELLED';

export type CronSchedule =
    | { kind: 'preset'; preset: 'DAILY' | 'WEEKDAY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY' }
    | { kind: 'custom'; minute: number; hour: number; dayOfMonth?: number; month?: number; weekday?: number };

export interface AgemsTask {
    id: string;
    title: string;
    description?: string;
    type: AgemsTaskType;
    status: AgemsTaskStatus;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    assigneeId?: string;
    creatorId?: string;
    projectId?: string;
    goalId?: string;
    labels: string[];
    dueDate?: number;
    cronSchedule?: CronSchedule;
    createdAt: number;
    updatedAt: number;
    lockedBy?: string;
    lockedUntil?: number;
}

export interface TaskComment {
    id?: number;
    taskId: string;
    authorType: string;
    authorId: string;
    content: string;
    metadata?: Record<string, unknown>;
    createdAt: number;
}

export interface Label {
    id?: number;
    name: string;
    color: string;
}

export interface TaskLabel {
    id?: number;
    taskId: string;
    labelId: number;
}

export interface TaskWorkProduct {
    id?: number;
    taskId: string;
    fileName: string;
    filePath?: string;
    mimeType?: string;
    size?: number;
    createdAt: number;
    createdBy?: string;
}

export interface TaskTrigger {
    id?: number;
    taskId: string;
    onStatus: AgemsTaskStatus;
    action: string;
    target?: string;
    enabled: boolean;
    createdAt: number;
}

// Kanban column mapping (roadmap 2.2: 5 columns)
export const KANBAN_COLUMNS: Array<{ status: AgemsTaskStatus[]; title: string; color: string }> = [
    { status: ['PENDING', 'BLOCKED'], title: 'Pending', color: '#64748b' },
    { status: ['IN_PROGRESS'], title: 'In Progress', color: '#3b82f6' },
    { status: ['IN_REVIEW', 'IN_TESTING', 'AWAITING_APPROVAL', 'VERIFIED'], title: 'In Review', color: '#f59e0b' },
    { status: ['COMPLETED'], title: 'Completed', color: '#10b981' },
    { status: ['FAILED', 'CANCELLED'], title: 'Failed', color: '#ef4444' },
];
