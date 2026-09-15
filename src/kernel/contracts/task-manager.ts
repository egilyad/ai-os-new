/**
 * Task Manager contract (AGEMS port, Phase 2).
 *
 * Full task lifecycle: CRUD, status transitions, claims, labels, comments, work products.
 */
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

export interface ITaskManagerService {
    // ── CRUD ──
    create(input: CreateTaskInput): Promise<TaskRecord>;
    get(id: string): Promise<TaskRecord | undefined>;
    list(filters?: TaskFilters): Promise<TaskRecord[]>;
    update(id: string, input: UpdateTaskInput): Promise<TaskRecord>;
    delete(id: string): Promise<void>;

    // ── Status transitions ──
    transition(id: string, toStatus: TaskStatus): Promise<TaskRecord>;

    // ── Claims (atomic checkout) ──
    claim(taskId: string, workerId: string, ttlMs?: number): Promise<TaskRecord>;
    release(taskId: string): Promise<TaskRecord>;

    // ── Labels ──
    createLabel(name: string, color: string): Promise<TaskLabel>;
    listLabels(): Promise<TaskLabel[]>;
    deleteLabel(id: string): Promise<void>;

    // ── Comments ──
    addComment(taskId: string, authorType: 'human' | 'agent' | 'system', authorId: string, content: string): Promise<TaskComment>;
    getComments(taskId: string): Promise<TaskComment[]>;

    // ── Work Products ──
    addWorkProduct(taskId: string, title: string, description: string, type: string, content: string, createdBy: string): Promise<TaskWorkProduct>;
    getWorkProducts(taskId: string): Promise<TaskWorkProduct[]>;
}
