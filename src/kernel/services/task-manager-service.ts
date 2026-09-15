/**
 * Task Manager Service — AGEMS port (Phase 2).
 *
 * Full task lifecycle with Dexie persistence: CRUD, status transitions,
 * claims, labels, comments, work products.
 */
import type { IDatabaseService, IEventBus } from '../types/interfaces';
import type { ITaskManagerService } from '../contracts/task-manager';
import type {
    TaskRecord,
    TaskComment,
    TaskWorkProduct,
    TaskLabel,
    CreateTaskInput,
    UpdateTaskInput,
    TaskFilters,
    TaskStatus,
} from '../types/task-types';
import { genId } from '../../utils/gen-id';

/** Valid status transitions — from → set of allowed destinations */
const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['in_review', 'blocked', 'failed', 'cancelled'],
    in_review: ['in_testing', 'in_progress', 'completed', 'failed'],
    in_testing: ['verified', 'in_progress', 'failed'],
    verified: ['completed'],
    awaiting_approval: ['completed', 'in_progress', 'cancelled'],
    completed: [],
    failed: ['pending', 'cancelled'],
    blocked: ['pending', 'cancelled'],
    cancelled: ['pending'],
};

export class TaskManagerService implements ITaskManagerService {
    constructor(
        private database: IDatabaseService,
        private eventBus?: IEventBus,
    ) {}

    private emit(event: string, data: unknown) {
        this.eventBus?.emit(event, data);
    }

    // ═══════════════════════════════════════════════════════════
    // CRUD
    // ═══════════════════════════════════════════════════════════

    async create(input: CreateTaskInput): Promise<TaskRecord> {
        const now = Date.now();
        const task: TaskRecord = {
            id: genId('task'),
            title: input.title,
            description: input.description || '',
            type: input.type || 'one_time',
            status: 'pending',
            priority: input.priority || 'medium',
            assigneeId: input.assigneeId,
            creatorId: input.creatorId || 'system',
            projectId: input.projectId,
            parentTaskId: input.parentTaskId,
            cron: input.cron,
            dueAt: input.dueAt,
            labelIds: input.labelIds || [],
            metadata: input.metadata,
            createdAt: now,
            updatedAt: now,
        };
        await this.database.tasks.put(task);
        this.emit('task:created', { taskId: task.id, title: task.title });
        return task;
    }

    async get(id: string): Promise<TaskRecord | undefined> {
        return (await this.database.tasks.get(id)) as TaskRecord | undefined;
    }

    async list(filters?: TaskFilters): Promise<TaskRecord[]> {
        let all = (await this.database.tasks.toArray()) as TaskRecord[];
        if (!filters) return all;
        if (filters.status) all = all.filter(t => t.status === filters.status);
        if (filters.type) all = all.filter(t => t.type === filters.type);
        if (filters.priority) all = all.filter(t => t.priority === filters.priority);
        if (filters.assigneeId) all = all.filter(t => t.assigneeId === filters.assigneeId);
        if (filters.creatorId) all = all.filter(t => t.creatorId === filters.creatorId);
        if (filters.projectId) all = all.filter(t => t.projectId === filters.projectId);
        if (filters.labelId) all = all.filter(t => t.labelIds.includes(filters.labelId));
        if (filters.search) {
            const q = filters.search.toLowerCase();
            all = all.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
        }
        return all;
    }

    async update(id: string, input: UpdateTaskInput): Promise<TaskRecord> {
        const existing = await this.get(id);
        if (!existing) throw new Error(`Task ${id} not found`);
        const updated: TaskRecord = { ...existing, ...input, updatedAt: Date.now() };
        await this.database.tasks.put(updated);
        this.emit('task:updated', { taskId: id });
        return updated;
    }

    async delete(id: string): Promise<void> {
        const existing = await this.get(id);
        if (!existing) throw new Error(`Task ${id} not found`);
        await this.database.tasks.delete(id);
        this.emit('task:deleted', { taskId: id });
    }

    // ═══════════════════════════════════════════════════════════
    // Status transitions
    // ═══════════════════════════════════════════════════════════

    async transition(id: string, toStatus: TaskStatus): Promise<TaskRecord> {
        const task = await this.get(id);
        if (!task) throw new Error(`Task ${id} not found`);
        const allowed = ALLOWED_TRANSITIONS[task.status];
        if (!allowed.includes(toStatus)) {
            throw new Error(`Invalid transition: ${task.status} → ${toStatus}`);
        }
        return this.update(id, { status: toStatus });
    }

    // ═══════════════════════════════════════════════════════════
    // Claims (atomic checkout)
    // ═══════════════════════════════════════════════════════════

    async claim(taskId: string, workerId: string, ttlMs = 300_000): Promise<TaskRecord> {
        const task = await this.get(taskId);
        if (!task) throw new Error(`Task ${taskId} not found`);
        if (task.lockedBy && task.lockedBy !== workerId && (task.lockedUntil || 0) > Date.now()) {
            throw new Error(`Task ${taskId} is locked by ${task.lockedBy}`);
        }
        return this.update(taskId, {
            lockedBy: workerId,
            lockedUntil: Date.now() + ttlMs,
            status: task.status === 'pending' ? 'in_progress' : task.status,
        });
    }

    async release(taskId: string): Promise<TaskRecord> {
        return this.update(taskId, { lockedBy: undefined, lockedUntil: undefined });
    }

    // ═══════════════════════════════════════════════════════════
    // Labels
    // ═══════════════════════════════════════════════════════════

    async createLabel(name: string, color: string): Promise<TaskLabel> {
        const label: TaskLabel = { id: genId('label'), name, color, createdAt: Date.now() };
        await this.database.taskLabels.put(label);
        return label;
    }

    async listLabels(): Promise<TaskLabel[]> {
        return (await this.database.taskLabels.toArray()) as TaskLabel[];
    }

    async deleteLabel(id: string): Promise<void> {
        await this.database.taskLabels.delete(id);
    }

    // ═══════════════════════════════════════════════════════════
    // Comments
    // ═══════════════════════════════════════════════════════════

    async addComment(taskId: string, authorType: 'human' | 'agent' | 'system', authorId: string, content: string): Promise<TaskComment> {
        const task = await this.get(taskId);
        if (!task) throw new Error(`Task ${taskId} not found`);
        const comment: TaskComment = {
            id: genId('tcomment'),
            taskId,
            authorType,
            authorId,
            content,
            createdAt: Date.now(),
        };
        await this.database.taskComments.put(comment);
        this.emit('task:comment:added', { taskId, commentId: comment.id });
        return comment;
    }

    async getComments(taskId: string): Promise<TaskComment[]> {
        const all = (await this.database.taskComments.toArray()) as TaskComment[];
        return all.filter(c => c.taskId === taskId).sort((a, b) => a.createdAt - b.createdAt);
    }

    // ═══════════════════════════════════════════════════════════
    // Work Products
    // ═══════════════════════════════════════════════════════════

    async addWorkProduct(taskId: string, title: string, description: string, type: string, content: string, createdBy: string): Promise<TaskWorkProduct> {
        const task = await this.get(taskId);
        if (!task) throw new Error(`Task ${taskId} not found`);
        const product: TaskWorkProduct = {
            id: genId('twproduct'),
            taskId,
            title,
            description,
            type: type as TaskWorkProduct['type'],
            content,
            createdBy,
            createdAt: Date.now(),
        };
        await this.database.taskWorkProducts.put(product);
        return product;
    }

    async getWorkProducts(taskId: string): Promise<TaskWorkProduct[]> {
        const all = (await this.database.taskWorkProducts.toArray()) as TaskWorkProduct[];
        return all.filter(p => p.taskId === taskId);
    }
}
