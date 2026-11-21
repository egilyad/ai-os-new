import { describe, it, expect } from 'vitest';
import { AgentMailboxService } from './agent-mailbox-service';

describe('AgentMailboxService', () => {
    it('delivers addressed messages', async () => {
        const svc = new AgentMailboxService();
        const msg = await svc.send({
            from: 'a1',
            to: 'a2',
            kind: 'event',
            subject: 'ping',
            payload: {},
        });
        expect(msg.id).toBeTruthy();
        const inbox = await svc.list('a2');
        expect(inbox).toHaveLength(1);
        expect(inbox[0]!.subject).toBe('ping');
        expect(await svc.list('a1')).toHaveLength(0);
    });

    it('correlates replies to a request', async () => {
        const svc = new AgentMailboxService();
        const req = await svc.send({
            from: 'a1',
            to: 'a2',
            kind: 'request',
            subject: 'analyze',
            payload: { q: 1 },
        });
        const reply = await svc.reply(req.id, 'a2', { result: 'ok' });
        expect(reply).not.toBeNull();
        expect(reply!.to).toBe('a1');
        expect(reply!.replyTo).toBe(req.id);
        const got = await svc.waitForReply(req.id, 200);
        expect(got?.payload).toEqual({ result: 'ok' });
    });

    it('times out when no reply arrives', async () => {
        const svc = new AgentMailboxService();
        const req = await svc.send({
            from: 'a1',
            to: 'a2',
            kind: 'request',
            subject: 'analyze',
            payload: {},
        });
        expect(await svc.waitForReply(req.id, 40)).toBeNull();
    });

    it('scopes mailboxes by tenant', async () => {
        const svc = new AgentMailboxService();
        await svc.send({
            from: 'a1',
            to: 'a2',
            kind: 'event',
            subject: 't1',
            payload: {},
            tenantId: 't1',
        });
        await svc.send({
            from: 'a1',
            to: 'a2',
            kind: 'event',
            subject: 't2',
            payload: {},
            tenantId: 't2',
        });
        expect(await svc.list('a2', 't1')).toHaveLength(1);
        // Without a tenant we must NOT see tenant-scoped mail.
        expect(await svc.list('a2')).toHaveLength(0);
        // A global message remains visible without a tenant.
        await svc.send({ from: 'a1', to: 'a2', kind: 'event', subject: 'global', payload: {} });
        expect(await svc.list('a2')).toHaveLength(1);
    });

    it('cannot reply to a non-request message', async () => {
        const svc = new AgentMailboxService();
        const event = await svc.send({
            from: 'a1',
            to: 'a2',
            kind: 'event',
            subject: 'e',
            payload: {},
        });
        expect(await svc.reply(event.id, 'a2', {})).toBeNull();
    });
});
