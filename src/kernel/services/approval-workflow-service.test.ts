/**
 * ApprovalWorkflowService tests — AGEMS port Phase 3.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApprovalWorkflowService } from './approval-service';
import { DEFAULT_PRESETS } from '../types/safety-types';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

function makeInMemoryDb() {
    const presets: Map<string, Record<string, unknown>> = new Map();
    const requests: Map<string, Record<string, unknown>> = new Map();
    const comments: Map<string, Record<string, unknown>> = new Map();

    return {
        approvalPresets: {
            toArray: async () => Array.from(presets.values()),
            put: async (v: Record<string, unknown>) => { presets.set(v.id as string, v); return v.id as string; },
            delete: async (id: string) => { presets.delete(id); },
        },
        approvalRequests: {
            toArray: async () => Array.from(requests.values()),
            put: async (v: Record<string, unknown>) => { requests.set(v.id as string, v); return v.id as string; },
        },
        approvalComments: {
            toArray: async () => Array.from(comments.values()),
            put: async (v: Record<string, unknown>) => { comments.set(v.id as string, v); return v.id as string; },
        },
    };
}

describe('ApprovalWorkflowService', () => {
    let db: ReturnType<typeof makeInMemoryDb>;
    let svc: ApprovalWorkflowService;

    beforeEach(() => {
        db = makeInMemoryDb();
        svc = new ApprovalWorkflowService(db);
    });

    describe('presets', () => {
        it('creates and lists presets', async () => {
            const p = await svc.createPreset(DEFAULT_PRESETS[0]);
            expect(p.id).toMatch(/^preset-/);
            expect(p.preset).toBe('full_control');
            expect((await svc.listPresets()).length).toBe(1);
        });

        it('gets a preset by id', async () => {
            const p = await svc.createPreset(DEFAULT_PRESETS[1]);
            const found = await svc.getPreset(p.id);
            expect(found?.name).toBe('Supervised');
        });

        it('updates a preset', async () => {
            const p = await svc.createPreset(DEFAULT_PRESETS[0]);
            const updated = await svc.updatePreset(p.id, { description: 'New desc' });
            expect(updated.description).toBe('New desc');
            expect(updated.updatedAt).toBeGreaterThanOrEqual(p.updatedAt);
        });

        it('deletes a preset', async () => {
            const p = await svc.createPreset(DEFAULT_PRESETS[0]);
            await svc.deletePreset(p.id);
            expect(await svc.getPreset(p.id)).toBeUndefined();
        });

        it('throws on update/delete of missing preset', async () => {
            await expect(svc.updatePreset('missing', {})).rejects.toThrow('not found');
            await expect(svc.deletePreset('missing')).rejects.toThrow('not found');
        });

        it('gets default preset', async () => {
            await svc.createPreset(DEFAULT_PRESETS[0]);
            await svc.createPreset(DEFAULT_PRESETS[1]);
            const def = await svc.getDefaultPreset();
            expect(def?.isDefault).toBe(true);
            expect(def?.preset).toBe('full_control');
        });
    });

    describe('requests', () => {
        it('submits a request as pending', async () => {
            const r = await svc.submitRequest({
                agentId: 'agent-1',
                toolName: 'read_file',
                category: 'read',
                riskLevel: 'low',
                description: 'Read test file',
            });
            expect(r.status).toBe('pending');
            expect(r.agentId).toBe('agent-1');
        });

        it('auto-approves when preset says so', async () => {
            // Supervised preset: read → auto_approve
            const p = await svc.createPreset(DEFAULT_PRESETS[1]);
            const r = await svc.submitRequest({
                agentId: 'agent-1',
                toolName: 'read_file',
                category: 'read',
                riskLevel: 'low',
                description: 'Read test file',
                presetId: p.id,
            });
            expect(r.status).toBe('auto_approved');
            expect(r.resolvedBy).toBe('auto');
        });

        it('auto-denies when preset says deny', async () => {
            const p = await svc.createPreset({
                name: 'Custom',
                preset: 'guided',
                description: '',
                categoryDefaults: {
                    read: 'auto_approve', write: 'auto_approve', delete: 'deny',
                    execute: 'require_approval', send: 'auto_approve', admin: 'deny',
                },
                toolOverrides: {},
                autoApproveRules: [],
            });
            const r = await svc.submitRequest({
                agentId: 'agent-1',
                toolName: 'rm_rf',
                category: 'delete',
                riskLevel: 'high',
                description: 'Delete everything',
                presetId: p.id,
            });
            expect(r.status).toBe('rejected');
            expect(r.resolvedBy).toBe('auto');
        });

        it('approves a pending request', async () => {
            const r = await svc.submitRequest({
                agentId: 'agent-1',
                toolName: 'deploy',
                category: 'execute',
                riskLevel: 'high',
                description: 'Deploy to prod',
            });
            expect(r.status).toBe('pending');
            const approved = await svc.approveRequest(r.id, 'human', 'Looks safe');
            expect(approved.status).toBe('approved');
            expect(approved.resolvedBy).toBe('human');
        });

        it('rejects a pending request', async () => {
            const r = await svc.submitRequest({
                agentId: 'agent-1',
                toolName: 'delete_project',
                category: 'delete',
                riskLevel: 'critical',
                description: 'Delete project',
            });
            const rejected = await svc.rejectRequest(r.id, 'human', 'Too dangerous');
            expect(rejected.status).toBe('rejected');
            expect(rejected.rejectionReason).toBe('Too dangerous');
        });

        it('throws on approve/reject of non-pending request', async () => {
            const r = await svc.submitRequest({
                agentId: 'agent-1',
                toolName: 'read',
                category: 'read',
                riskLevel: 'low',
                description: 'Read',
            });
            await svc.approveRequest(r.id, 'human');
            await expect(svc.approveRequest(r.id, 'human')).rejects.toThrow('not pending');
            await expect(svc.rejectRequest(r.id, 'human')).rejects.toThrow('not pending');
        });

        it('bulk approves and rejects', async () => {
            const r1 = await svc.submitRequest({ agentId: 'a', toolName: 't1', category: 'read', riskLevel: 'low', description: '1' });
            const r2 = await svc.submitRequest({ agentId: 'a', toolName: 't2', category: 'write', riskLevel: 'medium', description: '2' });
            const r3 = await svc.submitRequest({ agentId: 'a', toolName: 't3', category: 'delete', riskLevel: 'high', description: '3' });
            const approved = await svc.bulkApprove([r1.id, r3.id], 'human');
            expect(approved.length).toBe(2);
            const rejected = await svc.bulkReject([r2.id], 'human', 'no');
            expect(rejected.length).toBe(1);
        });

        it('lists requests by status and agent', async () => {
            await svc.submitRequest({ agentId: 'a1', toolName: 't', category: 'read', riskLevel: 'low', description: '' });
            await svc.submitRequest({ agentId: 'a2', toolName: 't', category: 'write', riskLevel: 'low', description: '' });
            expect((await svc.listRequests('pending')).length).toBe(2);
            expect((await svc.listRequestsByAgent('a1')).length).toBe(1);
        });

        it('expires stale requests', async () => {
            const r = await svc.submitRequest({
                agentId: 'a',
                toolName: 't',
                category: 'read',
                riskLevel: 'low',
                description: '',
                ttlMs: -1, // already expired
            });
            const count = await svc.expireStale();
            expect(count).toBe(1);
            const updated = await svc.getRequest(r.id);
            expect(updated?.status).toBe('expired');
        });
    });

    describe('check', () => {
        it('returns action based on preset', async () => {
            await svc.createPreset(DEFAULT_PRESETS[0]); // full_control: everything require_approval
            const result = await svc.checkRequest('agent-1', 'deploy', 'execute', 'high');
            expect(result.action).toBe('require_approval');
            expect(result.requestId).toBeDefined();
        });

        it('returns auto_approve for read under supervised', async () => {
            await svc.createPreset(DEFAULT_PRESETS[1]); // supervised: read → auto_approve
            const result = await svc.checkRequest('agent-1', 'read_file', 'read', 'low');
            expect(result.action).toBe('auto_approve');
        });
    });

    describe('comments', () => {
        it('adds and retrieves comments', async () => {
            const r = await svc.submitRequest({ agentId: 'a', toolName: 't', category: 'read', riskLevel: 'low', description: '' });
            const c1 = await svc.addComment(r.id, 'human', 'user1', 'Please approve');
            const c2 = await svc.addComment(r.id, 'agent', 'agent1', 'I need this for the task');
            const comments = await svc.getComments(r.id);
            expect(comments.length).toBe(2);
            expect(comments[0].content).toBe('Please approve');
            expect(comments[1].authorType).toBe('agent');
        });
    });
});
