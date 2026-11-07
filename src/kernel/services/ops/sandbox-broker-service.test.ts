import { describe, it, expect, vi } from 'vitest';
import { SandboxBrokerService } from './sandbox-broker-service';
import type { SandboxTicket } from '../../types/ops-types';

function makeRepo() {
    const tickets = new Map<string, SandboxTicket>();
    return {
        tickets,
        putTicket: vi.fn(async (t: SandboxTicket) => {
            tickets.set(t.id, t);
        }),
        getTicket: vi.fn(async (id: string) => tickets.get(id) ?? null),
        listTickets: vi.fn(async () => [...tickets.values()]),
    };
}

function makeDeps(overrides: { repo?: ReturnType<typeof makeRepo> } = {}) {
    const repo = overrides.repo ?? makeRepo();
    const events = { emit: vi.fn() };
    const audit = { append: vi.fn(async () => ({})) };
    const svc = new SandboxBrokerService(repo as never, events as never, audit as never);
    return { svc, repo, events, audit };
}

describe('SandboxBrokerService', () => {
    it('request creates a requested ticket, audits and emits', async () => {
        const { svc, repo, events, audit } = makeDeps();
        const t = await svc.request({ kind: 'browser', agentId: 'a1', purpose: 'test' });
        expect(t.status).toBe('requested');
        expect(repo.tickets.has(t.id)).toBe(true);
        expect(audit.append).toHaveBeenCalledWith('sandbox', 'ticket.requested', t.id, expect.any(String));
        expect(events.emit).toHaveBeenCalledWith(expect.anything(), { ticketId: t.id, status: 'requested' });
    });

    it('approve transitions from requested; cannot approve twice', async () => {
        const { svc } = makeDeps();
        const t = await svc.request({ kind: 'browser', agentId: 'a1', purpose: 'x' });
        await svc.approve(t.id);
        expect((await svc.get(t.id))?.status).toBe('approved');
        await expect(svc.approve(t.id)).rejects.toThrow(/is approved/);
    });

    it('deny only works from requested', async () => {
        const { svc } = makeDeps();
        const t = await svc.request({ kind: 'browser', agentId: 'a1', purpose: 'x' });
        await svc.approve(t.id);
        await expect(svc.deny(t.id)).rejects.toThrow(/is approved/);
    });

    it('markRunning requires approval and expires overdue tickets', async () => {
        const { svc, repo } = makeDeps();
        const t = await svc.request({ kind: 'browser', agentId: 'a1', purpose: 'x', ttlMs: 1000 });
        await expect(svc.markRunning(t.id)).rejects.toThrow(/needs approved/);
        await svc.approve(t.id);
        const stored = repo.tickets.get(t.id)!;
        stored.createdAt = Date.now() - 2000;
        repo.tickets.set(t.id, stored);
        await expect(svc.markRunning(t.id)).rejects.toThrow(/expired/);
        expect((await svc.get(t.id))?.status).toBe('expired');
    });

    it('complete only from running or approved', async () => {
        const { svc } = makeDeps();
        const t = await svc.request({ kind: 'browser', agentId: 'a1', purpose: 'x' });
        await expect(svc.complete(t.id)).rejects.toThrow(/is requested/);
        await svc.approve(t.id);
        await svc.complete(t.id);
        expect((await svc.get(t.id))?.status).toBe('done');
    });
});
