/**
 * ChatQueueService tests — AGEMS port Phase 11.3.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatQueueService } from './chat-queue-service';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

describe('ChatQueueService', () => {
    let svc: ChatQueueService;

    beforeEach(() => {
        svc = new ChatQueueService();
    });

    it('enqueues a message', async () => {
        const msg = await svc.enqueue({
            agentId: 'agent-1',
            sessionId: 's1',
            content: 'Hello',
            sender: 'human',
        });
        expect(msg.id).toMatch(/^msg-/);
        expect(msg.status).toBe('sent'); // processed immediately since agent is free
    });

    it('returns correct status', async () => {
        await svc.enqueue({ agentId: 'agent-1', sessionId: 's1', content: 'a', sender: 'h' });
        await svc.enqueue({ agentId: 'agent-1', sessionId: 's1', content: 'b', sender: 'h' });
        const status = svc.getStatus('agent-1');
        expect(status.sent).toBe(2);
        expect(status.pending).toBe(0);
    });

    it('gets queue for an agent', async () => {
        await svc.enqueue({ agentId: 'agent-1', sessionId: 's1', content: 'a', sender: 'h' });
        await svc.enqueue({ agentId: 'agent-2', sessionId: 's1', content: 'b', sender: 'h' });
        const q1 = svc.getQueue('agent-1');
        const q2 = svc.getQueue('agent-2');
        expect(q1.length).toBe(1);
        expect(q2.length).toBe(1);
    });

    it('clears completed messages', async () => {
        await svc.enqueue({ agentId: 'agent-1', sessionId: 's1', content: 'a', sender: 'h' });
        svc.clearCompleted('agent-1');
        expect(svc.getQueue('agent-1')).toHaveLength(0);
    });

    it('cancels a pending message', async () => {
        const msg = await svc.enqueue({ agentId: 'agent-1', sessionId: 's1', content: 'a', sender: 'h' });
        // Message was already processed, so cancel returns false
        const result = svc.cancel(msg.id);
        expect(result).toBe(false);
    });

    it('returns empty status for unknown agent', () => {
        const status = svc.getStatus('unknown');
        expect(status.pending).toBe(0);
        expect(status.processing).toBe(0);
        expect(status.sent).toBe(0);
        expect(status.failed).toBe(0);
    });
});
