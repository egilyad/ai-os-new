/**
 * Task System types (AGEMS port, Phase 2).
 *
 * Full task lifecycle: types, statuses, priorities, labels, comments, locks, work products.
 */

export type TaskType = 'one_time' | 'recurring' | 'continuous';

export type TaskStatus =
    | 'pending'
    | 'in_progress'
    | 'in_review'
    | 'in_testing'
    | 'verified'
    | 'awaiting_approval'
    | 'completed'
    | 'failed'
    | 'blocked'
    | 'cancelled';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low' | 'none';

export type WorkProductType = 'artifact' | 'document' | 'code' | 'report' | 'file';

export interface TaskLabel {
    id: string;
    name: string;
    color: string; // hex
    createdAt: number;
}

export interface TaskRecord {
    id: string;
    title: string;
    description: string;
    type: TaskType;
    status: TaskStatus;
    priority: TaskPriority;
    /** Agent assigned to this task */
    assigneeId?: string;
    /** Who created the task */
    creatorId: string;
    /** Parent project id */
    projectId?: string;
    /** Parent task id for subtasks */
    parentTaskId?: string;
    /** Cron expression for recurring tasks */
    cron?: string;
    /** Due date (epoch ms) */
    dueAt?: number;
    /** Label ids */
    labelIds: string[];
    /** Task locking (atomic checkout) */
    lockedBy?: string;
    lockedUntil?: number;
    /** Metadata */
    metadata?: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}

export interface TaskComment {
    id: string;
    taskId: string;
    authorType: 'human' | 'agent' | 'system';
    authorId: string;
    content: string;
    metadata?: Record<string, unknown>;
    createdAt: number;
}

export interface TaskWorkProduct {
    id: string;
    taskId: string;
    title: string;
    description: string;
    type: WorkProductType;
    content: string;
    metadata?: Record<string, unknown>;
    createdBy: string;
    createdAt: number;
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    type?: TaskType;
    priority?: TaskPriority;
    assigneeId?: string;
    creatorId?: string;
    projectId?: string;
    parentTaskId?: string;
    cron?: string;
    dueAt?: number;
    labelIds?: string[];
    metadata?: Record<string, unknown>;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string;
    type?: TaskType;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    projectId?: string;
    parentTaskId?: string;
    cron?: string;
    dueAt?: number;
    labelIds?: string[];
    lockedBy?: string;
    lockedUntil?: number;
    metadata?: Record<string, unknown>;
}

export interface TaskFilters {
    status?: TaskStatus;
    type?: TaskType;
    priority?: TaskPriority;
    assigneeId?: string;
    creatorId?: string;
    projectId?: string;
    labelId?: string;
    search?: string;
}

export type TaskTriggerKind = 'webhook' | 'gmail' | 'n8n';
export type TaskTriggerAuthKind = 'hmac' | 'bearer' | 'none';

export interface TaskTriggerRecord {
    id: string;
    taskId: string;
    slug: string;
    kind: TaskTriggerKind;
    authKind: TaskTriggerAuthKind;
    /** Encrypted or plain secret for HMAC/bearer verification */
    authSecretEnc?: string;
    enabled: boolean;
    lastFiredAt?: number;
    firingCount: number;
    createdAt: number;
    updatedAt: number;
}

export interface CreateTaskTriggerInput {
    taskId: string;
    slug: string;
    kind?: TaskTriggerKind;
    authKind?: TaskTriggerAuthKind;
    authSecret?: string;
    enabled?: boolean;
}

export interface UpdateTaskTriggerInput {
    slug?: string;
    kind?: TaskTriggerKind;
    authKind?: TaskTriggerAuthKind;
    authSecret?: string;
    enabled?: boolean;
}

export interface TaskTriggerVerifyInput {
    triggerId: string;
    payload: string;
    signature?: string;
    token?: string;
}
