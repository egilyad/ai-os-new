/**
 * TaskTriggerService tests — Phase 2.8.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TaskTriggerService } from './task-trigger-service';
import type { IDatabaseService, IEventBus } from '../types/interfaces';

function makeDb(): IDatabaseService {
    const store = new Map<string, Record<string, unknown>>();
    const table = (prefix: string) => ({
        put: async (val: Record<string, unknown>) => {
            store.set(`${prefix}:${val.id}`, val);
        },
        get: async (id: string) => store.get(`${prefix}:${id}`) || undefined,
        delete: async (id: string) => {
            store.delete(`${prefix}:${id}`);
        },
        toArray: async () =>
            [...store.entries()].filter(([k]) => k.startsWith(`${prefix}:`)).map(([, v]) => v),
    });
    // Seed a task so triggers can reference it.
    const db = {
        tasks: table('tasks') as never,
        taskTriggers: table('triggers') as never,
    } as unknown as IDatabaseService;
    return db;
}

function makeBus(): IEventBus {
    const events: Array<[string, unknown]> = [];
    return {
        emit: (event: string, data: unknown) => {
            events.push([event, data]);
        },
        _events: events,
    } as unknown as IEventBus & { _events: typeof events };
}

describe('TaskTriggerService', () => {
    let service: TaskTriggerService;
    let db: IDatabaseService;

    beforeEach(async () => {
        db = makeDb();
        await (db.tasks as unknown as { put: (v: unknown) => Promise<void> }).put({
            id: 'task-1',
            title: 'T1',
            labelIds: [],
            status: 'pending',
        });
        await (db.tasks as unknown as { put: (v: unknown) => Promise<void> }).put({
            id: 'task-2',
            title: 'T2',
            labelIds: [],
            status: 'pending',
        });
        service = new TaskTriggerService(db, makeBus());
    });

    it('creates webhook trigger with none auth', async () => {
        const t = await service.create({ taskId: 'task-1', slug: 'my-hook', kind: 'webhook', authKind: 'none' });
        expect(t.slug).toBe('my-hook');
        expect(t.kind).toBe('webhook');
        expect(t.authKind).toBe('none');
        expect(t.enabled).toBe(true);
        expect(t.firingCount).toBe(0);
    });

    it('creates gmail and n8n triggers', async () => {
        const g = await service.create({ taskId: 'task-1', slug: 'gmail-poll', kind: 'gmail' });
        const n = await service.create({ taskId: 'task-1', slug: 'n8n-flow', kind: 'n8n' });
        expect(g.kind).toBe('gmail');
        expect(n.kind).toBe('n8n');
    });

    it('rejects duplicate slug per task', async () => {
        await service.create({ taskId: 'task-1', slug: 'dup' });
        await expect(service.create({ taskId: 'task-1', slug: 'dup' })).rejects.toThrow('already exists');
    });

    it('allows same slug on different tasks', async () => {
        await service.create({ taskId: 'task-1', slug: 'shared' });
        const t2 = await service.create({ taskId: 'task-2', slug: 'shared' });
        expect(t2.slug).toBe('shared');
    });

    it('lists by task', async () => {
        await service.create({ taskId: 'task-1', slug: 'a' });
        await service.create({ taskId: 'task-1', slug: 'b' });
        await service.create({ taskId: 'task-2', slug: 'c' });
        const list = await service.listByTask('task-1');
        expect(list).toHaveLength(2);
    });

    it('updates slug and auth', async () => {
        const t = await service.create({ taskId: 'task-1', slug: 'old' });
        const updated = await service.update(t.id, { slug: 'new', authKind: 'bearer', authSecret: 'tok' });
        expect(updated.slug).toBe('new');
        expect(updated.authKind).toBe('bearer');
        expect(updated.authSecretEnc).toBe('tok');
    });

    it('toggles enabled', async () => {
        const t = await service.create({ taskId: 'task-1', slug: 't' });
        const off = await service.setEnabled(t.id, false);
        expect(off.enabled).toBe(false);
        const on = await service.setEnabled(t.id, true);
        expect(on.enabled).toBe(true);
    });

    it('deletes a trigger', async () => {
        const t = await service.create({ taskId: 'task-1', slug: 't' });
        await service.delete(t.id);
        expect(await service.get(t.id)).toBeUndefined();
    });

    it('verifies none auth always true when enabled', async () => {
        const t = await service.create({ taskId: 'task-1', slug: 't', authKind: 'none' });
        expect(await service.verify(t.id, 'payload')).toBe(true);
    });

    it('verifies bearer token', async () => {
        const t = await service.create({ taskId: 'task-1', slug: 't', authKind: 'bearer', authSecret: 's3cr3t' });
        expect(await service.verify(t.id, 'payload', undefined, 's3cr3t')).toBe(true);
        expect(await service.verify(t.id, 'payload', undefined, 'wrong')).toBe(false);
    });

    it('verifies hmac signature', async () => {
        const secret = 'hmac-secret';
        const payload = '{"event":"push"}';
        const sig = TaskTriggerService.hmacHex(payload, secret);
        const t = await service.create({ taskId: 'task-1', slug: 't', authKind: 'hmac', authSecret: secret });
        expect(await service.verify(t.id, payload, sig)).toBe(true);
        expect(await service.verify(t.id, payload, 'bad')).toBe(false);
    });

    it('verify returns false when disabled', async () => {
        const t = await service.create({ taskId: 'task-1', slug: 't', authKind: 'none', enabled: false });
        expect(await service.verify(t.id, 'payload')).toBe(false);
    });

    it('fire increments firingCount and lastFiredAt', async () => {
        const t = await service.create({ taskId: 'task-1', slug: 't', authKind: 'none' });
        const fired = await service.fire(t.id, 'payload');
        expect(fired.firingCount).toBe(1);
        expect(fired.lastFiredAt).toBeDefined();
        const fired2 = await service.fire(t.id, 'payload2');
        expect(fired2.firingCount).toBe(2);
    });

    it('fire rejects when verification fails', async () => {
        const t = await service.create({ taskId: 'task-1', slug: 't', authKind: 'bearer', authSecret: 'tok' });
        await expect(service.fire(t.id, 'payload', undefined, 'wrong')).rejects.toThrow('verification failed');
    });

    it('throws on create for missing task', async () => {
        await expect(service.create({ taskId: 'nope', slug: 'x' })).rejects.toThrow('not found');
    });
});
