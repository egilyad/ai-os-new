/**
 * TaskManagerService tests — Phase 2.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TaskManagerService } from './task-manager-service';
import type { IDatabaseService, IEventBus } from '../types/interfaces';

/** Minimal in-memory database stub */
function makeDb(): IDatabaseService {
    const store = new Map<string, Record<string, unknown>>();
    const table = (prefix: string) => ({
        put: async (val: Record<string, unknown>) => { store.set(`${prefix}:${val.id}`, val); },
        get: async (id: string) => store.get(`${prefix}:${id}`) || undefined,
        delete: async (id: string) => { store.delete(`${prefix}:${id}`); },
        toArray: async () => [...store.entries()].filter(([k]) => k.startsWith(`${prefix}:`)).map(([, v]) => v),
        update: async (id: string, patch: Record<string, unknown>) => {
            const existing = store.get(`${prefix}:${id}`);
            if (existing) Object.assign(existing, patch);
        },
    });
    return {
        tasks: table('tasks') as never,
        taskLabels: table('labels') as never,
        taskComments: table('comments') as never,
        taskWorkProducts: table('products') as never,
    } as unknown as IDatabaseService;
}

function makeBus(): IEventBus {
    const events: Array<[string, unknown]> = [];
    return {
        emit: (event: string, data: unknown) => { events.push([event, data]); },
        _events: events,
    } as unknown as IEventBus & { _events: typeof events };
}

describe('TaskManagerService', () => {
    let service: TaskManagerService;
    let db: IDatabaseService;
    let bus: IEventBus & { _events: Array<[string, unknown]> };

    beforeEach(() => {
        db = makeDb();
        bus = makeBus() as IEventBus & { _events: Array<[string, unknown]> };
        service = new TaskManagerService(db, bus);
    });

    describe('CRUD', () => {
        it('creates a task', async () => {
            const task = await service.create({ title: 'Test task' });
            expect(task.id).toBeTruthy();
            expect(task.title).toBe('Test task');
            expect(task.status).toBe('pending');
            expect(task.type).toBe('one_time');
            expect(task.priority).toBe('medium');
            expect(bus._events[0][0]).toBe('task:created');
        });

        it('gets a task by id', async () => {
            const created = await service.create({ title: 'Get me' });
            const got = await service.get(created.id);
            expect(got?.title).toBe('Get me');
        });

        it('lists tasks', async () => {
            await service.create({ title: 'A' });
            await service.create({ title: 'B' });
            const all = await service.list();
            expect(all).toHaveLength(2);
        });

        it('filters by status', async () => {
            const a = await service.create({ title: 'A' });
            await service.create({ title: 'B' });
            await service.transition(a.id, 'in_progress');
            const filtered = await service.list({ status: 'in_progress' });
            expect(filtered).toHaveLength(1);
            expect(filtered[0].title).toBe('A');
        });

        it('updates a task', async () => {
            const task = await service.create({ title: 'Old' });
            const updated = await service.update(task.id, { title: 'New' });
            expect(updated.title).toBe('New');
        });

        it('deletes a task', async () => {
            const task = await service.create({ title: 'Delete me' });
            await service.delete(task.id);
            const got = await service.get(task.id);
            expect(got).toBeUndefined();
        });

        it('throws on update of missing task', async () => {
            await expect(service.update('nonexistent', { title: 'x' })).rejects.toThrow('not found');
        });

        it('throws on delete of missing task', async () => {
            await expect(service.delete('nonexistent')).rejects.toThrow('not found');
        });
    });

    describe('Transitions', () => {
        it('pending → in_progress', async () => {
            const task = await service.create({ title: 'T' });
            const updated = await service.transition(task.id, 'in_progress');
            expect(updated.status).toBe('in_progress');
        });

        it('in_progress → in_review → in_testing → verified → completed', async () => {
            let task = await service.create({ title: 'T' });
            task = await service.transition(task.id, 'in_progress');
            task = await service.transition(task.id, 'in_review');
            task = await service.transition(task.id, 'in_testing');
            task = await service.transition(task.id, 'verified');
            task = await service.transition(task.id, 'completed');
            expect(task.status).toBe('completed');
        });

        it('rejects invalid transition', async () => {
            const task = await service.create({ title: 'T' });
            await expect(service.transition(task.id, 'completed')).rejects.toThrow('Invalid transition');
        });

        it('pending → cancelled', async () => {
            const task = await service.create({ title: 'T' });
            const updated = await service.transition(task.id, 'cancelled');
            expect(updated.status).toBe('cancelled');
        });

        it('cancelled → pending (re-open)', async () => {
            let task = await service.create({ title: 'T' });
            task = await service.transition(task.id, 'cancelled');
            task = await service.transition(task.id, 'pending');
            expect(task.status).toBe('pending');
        });
    });

    describe('Claims', () => {
        it('claims a pending task and moves to in_progress', async () => {
            const task = await service.create({ title: 'T' });
            const claimed = await service.claim(task.id, 'agent-1');
            expect(claimed.lockedBy).toBe('agent-1');
            expect(claimed.status).toBe('in_progress');
        });

        it('rejects claim when locked by another', async () => {
            const task = await service.create({ title: 'T' });
            await service.claim(task.id, 'agent-1');
            await expect(service.claim(task.id, 'agent-2')).rejects.toThrow('locked by');
        });

        it('allows same agent to re-claim', async () => {
            const task = await service.create({ title: 'T' });
            await service.claim(task.id, 'agent-1');
            const re = await service.claim(task.id, 'agent-1');
            expect(re.lockedBy).toBe('agent-1');
        });

        it('releases a task', async () => {
            const task = await service.create({ title: 'T' });
            await service.claim(task.id, 'agent-1');
            const released = await service.release(task.id);
            expect(released.lockedBy).toBeUndefined();
            expect(released.lockedUntil).toBeUndefined();
        });
    });

    describe('Labels', () => {
        it('creates and lists labels', async () => {
            await service.createLabel('bug', '#ff0000');
            await service.createLabel('feature', '#00ff00');
            const labels = await service.listLabels();
            expect(labels).toHaveLength(2);
        });

        it('deletes a label', async () => {
            const label = await service.createLabel('temp', '#000');
            await service.deleteLabel(label.id);
            const labels = await service.listLabels();
            expect(labels).toHaveLength(0);
        });
    });

    describe('Comments', () => {
        it('adds and retrieves comments', async () => {
            const task = await service.create({ title: 'T' });
            await service.addComment(task.id, 'human', 'user-1', 'Looks good');
            await service.addComment(task.id, 'agent', 'agent-1', 'I agree');
            const comments = await service.getComments(task.id);
            expect(comments).toHaveLength(2);
            expect(comments[0].content).toBe('Looks good');
        });

        it('throws on comment to missing task', async () => {
            await expect(service.addComment('no', 'human', 'u', 'x')).rejects.toThrow('not found');
        });
    });

    describe('Work Products', () => {
        it('adds and retrieves work products', async () => {
            const task = await service.create({ title: 'T' });
            await service.addWorkProduct(task.id, 'Report', 'Summary', 'report', 'content', 'agent-1');
            const products = await service.getWorkProducts(task.id);
            expect(products).toHaveLength(1);
            expect(products[0].title).toBe('Report');
        });
    });
});
