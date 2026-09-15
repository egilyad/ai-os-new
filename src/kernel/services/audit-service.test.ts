/**
 * AuditService tests — AGEMS port Phase 9.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditService } from './audit-service';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

function makeAuditDb() {
    const logs = new Map<string, Record<string, unknown>>();
    const rules = new Map<string, Record<string, unknown>>();
    return {
        auditLogs: {
            toArray: async () => Array.from(logs.values()),
            put: async (v: Record<string, unknown>) => { logs.set(v.id as string, v); return v.id as string; },
        },
        accessRules: {
            toArray: async () => Array.from(rules.values()),
            get: async (id: string) => rules.get(id),
            put: async (v: Record<string, unknown>) => { rules.set(v.id as string, v); return v.id as string; },
            delete: async (id: string) => { rules.delete(id); },
        },
    };
}

describe('AuditService', () => {
    let db: ReturnType<typeof makeAuditDb>;
    let svc: AuditService;

    beforeEach(() => {
        db = makeAuditDb();
        svc = new AuditService(db);
    });

    describe('audit log', () => {
        it('logs an entry', async () => {
            const entry = await svc.log({
                actorType: 'agent',
                actorId: 'agent-1',
                action: 'create',
                resourceType: 'meeting',
                resourceId: 'm1',
                details: 'Created meeting',
            });
            expect(entry.id).toMatch(/^audit-/);
            expect(entry.action).toBe('create');
            expect(entry.createdAt).toBeGreaterThan(0);
        });

        it('lists entries with filters', async () => {
            await svc.log({ actorType: 'agent', actorId: 'a1', action: 'create', resourceType: 'meeting', resourceId: 'm1' });
            await svc.log({ actorType: 'human', actorId: 'h1', action: 'read', resourceType: 'meeting', resourceId: 'm1' });
            await svc.log({ actorType: 'agent', actorId: 'a1', action: 'delete', resourceType: 'meeting', resourceId: 'm2' });

            const byActor = await svc.list({ actorType: 'agent' });
            expect(byActor.length).toBe(2);

            const byAction = await svc.list({ action: 'read' });
            expect(byAction.length).toBe(1);

            const byResource = await svc.list({ resourceType: 'meeting', resourceId: 'm1' });
            expect(byResource.length).toBe(2);
        });

        it('counts entries', async () => {
            await svc.log({ actorType: 'agent', actorId: 'a1', action: 'create', resourceType: 'x', resourceId: '1' });
            await svc.log({ actorType: 'agent', actorId: 'a1', action: 'read', resourceType: 'x', resourceId: '1' });
            expect(await svc.count()).toBe(2);
            expect(await svc.count({ action: 'create' })).toBe(1);
        });

        it('returns entries sorted by createdAt desc', async () => {
            await svc.log({ actorType: 'agent', actorId: 'a1', action: 'create', resourceType: 'x', resourceId: '1' });
            await new Promise(r => setTimeout(r, 5));
            await svc.log({ actorType: 'agent', actorId: 'a1', action: 'read', resourceType: 'x', resourceId: '1' });
            const list = await svc.list();
            expect(list[0].action).toBe('read');
            expect(list[1].action).toBe('create');
        });
    });

    describe('access rules', () => {
        it('adds and retrieves rules', async () => {
            const rule = await svc.addRule({
                agentId: 'agent-1',
                resourceType: 'meeting',
                permissions: ['read', 'write'],
            });
            expect(rule.id).toMatch(/^rule-/);

            const rules = await svc.getRules('agent-1');
            expect(rules.length).toBe(1);
            expect(rules[0].permissions).toContain('read');
        });

        it('updates a rule', async () => {
            const rule = await svc.addRule({
                agentId: 'agent-1',
                resourceType: 'meeting',
                permissions: ['read'],
            });
            const updated = await svc.updateRule(rule.id, { permissions: ['read', 'write', 'execute'] });
            expect(updated.permissions).toContain('execute');
        });

        it('deletes a rule', async () => {
            const rule = await svc.addRule({
                agentId: 'agent-1',
                resourceType: 'meeting',
                permissions: ['read'],
            });
            await svc.deleteRule(rule.id);
            const rules = await svc.getRules('agent-1');
            expect(rules.length).toBe(0);
        });

        it('checkAccess grants when rule matches', async () => {
            await svc.addRule({
                agentId: 'agent-1',
                resourceType: 'meeting',
                resourceId: 'm1',
                permissions: ['read', 'write'],
            });
            expect(await svc.checkAccess('agent-1', 'meeting', 'm1', 'read')).toBe(true);
            expect(await svc.checkAccess('agent-1', 'meeting', 'm1', 'write')).toBe(true);
            expect(await svc.checkAccess('agent-1', 'meeting', 'm1', 'admin')).toBe(false);
        });

        it('checkAccess grants wildcard', async () => {
            await svc.addRule({
                agentId: 'agent-1',
                resourceType: 'meeting',
                permissions: ['read'],
            });
            expect(await svc.checkAccess('agent-1', 'meeting', 'any-id', 'read')).toBe(true);
        });

        it('checkAccess denies when no rule', async () => {
            expect(await svc.checkAccess('agent-1', 'meeting', 'm1', 'read')).toBe(false);
        });

        it('checkAccess grants admin permission', async () => {
            await svc.addRule({
                agentId: 'agent-1',
                resourceType: 'meeting',
                permissions: ['admin'],
            });
            expect(await svc.checkAccess('agent-1', 'meeting', 'm1', 'read')).toBe(true);
            expect(await svc.checkAccess('agent-1', 'meeting', 'm1', 'write')).toBe(true);
        });

        it('throws on update of missing rule', async () => {
            await expect(svc.updateRule('missing', { permissions: ['read'] })).rejects.toThrow('not found');
        });
    });
});
