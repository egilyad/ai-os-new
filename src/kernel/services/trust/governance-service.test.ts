import { describe, it, expect, vi } from 'vitest';
import { GovernanceService } from './governance-service';

function makeRepo() {
    const capabilities: Array<{ subject: string; capability: string; allow: boolean }> = [];
    const policies: Array<{ id: string; name: string; action: string; subject: string; effect: string; enabled: boolean; priority: number }> = [];
    const roles: Array<{ userId: string; role: string; scope: string }> = [];
    const trust = new Map<string, { score: number; interactions: number }>();
    return {
        putCapability: vi.fn(async (g: { subject: string; capability: string; allow: boolean }) => {
            capabilities.push(g);
        }),
        listCapabilities: vi.fn(async () => capabilities),
        putTrust: vi.fn(async (t: { subject: string; score: number; interactions: number }) => {
            trust.set(t.subject, { score: t.score, interactions: t.interactions });
        }),
        getTrustBySubject: vi.fn(async (subject: string) => trust.get(subject) ?? null),
        putPolicy: vi.fn(async (p: (typeof policies)[number]) => {
            policies.push(p);
        }),
        getPolicy: vi.fn(async (id: string) => policies.find((p) => p.id === id) ?? null),
        listPolicies: vi.fn(async () => policies),
        putRole: vi.fn(async (r: { userId: string; role: string; scope: string }) => {
            roles.push(r);
        }),
        listRoles: vi.fn(async () => roles),
    };
}

function makeDeps() {
    const repo = makeRepo();
    const events = { emit: vi.fn(), on: vi.fn(), onSafe: vi.fn(() => () => {}) };
    const audit = { append: vi.fn(async () => ({})) };
    return { repo, events, audit };
}

describe('GovernanceService', () => {
    it('grantCapability + checkCapability allow matching subject', async () => {
        const { repo, events, audit } = makeDeps();
        const svc = new GovernanceService(repo as never, events as never, audit as never);
        await svc.grantCapability('agent-1', 'tool:web_search');
        await expect(svc.checkCapability('agent-1', 'tool:web_search')).resolves.toBe(true);
        await expect(svc.checkCapability('agent-1', 'tool:code_exec')).resolves.toBe(false);
    });

    it('evaluate defaults to deny when no rule matches (fail-closed)', async () => {
        const { repo, events, audit } = makeDeps();
        const svc = new GovernanceService(repo as never, events as never, audit as never);
        await expect(svc.evaluate({ action: 'budget:spend', subject: 'agent-1' })).resolves.toEqual({
            decision: 'deny',
        });
    });

    it('evaluate deny beats allow at same action', async () => {
        const { repo, events, audit } = makeDeps();
        const svc = new GovernanceService(repo as never, events as never, audit as never);
        await svc.addPolicy({ name: 'allow-spend', action: 'budget:spend', subject: '*', effect: 'allow', priority: 0 });
        await svc.addPolicy({ name: 'deny-agent1', action: 'budget:spend', subject: 'agent-1', effect: 'deny', priority: 0 });
        await expect(svc.evaluate({ action: 'budget:spend', subject: 'agent-1' })).resolves.toEqual({
            decision: 'deny',
            ruleId: expect.any(String),
        });
    });

    it('assignRole enables matching human actions', async () => {
        const { repo, events, audit } = makeDeps();
        const svc = new GovernanceService(repo as never, events as never, audit as never);
        await svc.assignRole('user-1', 'approver');
        await expect(svc.can('user-1', 'approve')).resolves.toBe(true);
        await expect(svc.can('user-1', 'direct')).resolves.toBe(false);
    });
});
