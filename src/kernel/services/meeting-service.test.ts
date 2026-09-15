/**
 * MeetingService tests — AGEMS port Phase 5.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MeetingService } from './meeting-service';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

function makeMeetingsDb() {
    const meetings = new Map<string, Record<string, unknown>>();
    const decisions = new Map<string, Record<string, unknown>>();
    const messages = new Map<string, Record<string, unknown>>();
    return {
        meetings: {
            toArray: async () => Array.from(meetings.values()),
            get: async (id: string) => meetings.get(id),
            put: async (v: Record<string, unknown>) => { meetings.set(v.id as string, v); return v.id as string; },
            delete: async (id: string) => { meetings.delete(id); },
        },
        meetingDecisions: {
            toArray: async () => Array.from(decisions.values()),
            put: async (v: Record<string, unknown>) => { decisions.set(v.id as string, v); return v.id as string; },
        },
        meetingMessages: {
            toArray: async () => Array.from(messages.values()),
            put: async (v: Record<string, unknown>) => { messages.set(v.id as string, v); return v.id as string; },
        },
    };
}

describe('MeetingService', () => {
    let db: ReturnType<typeof makeMeetingsDb>;
    let svc: MeetingService;

    beforeEach(() => {
        db = makeMeetingsDb();
        svc = new MeetingService(db);
    });

    it('creates and retrieves a meeting', async () => {
        const m = await svc.create({
            title: 'Sprint Review',
            agenda: 'Review completed work',
            scheduledAt: Date.now() + 3600000,
            creatorType: 'agent',
            creatorId: 'agent-1',
        });
        expect(m.id).toMatch(/^meeting-/);
        expect(m.status).toBe('scheduled');
        expect(m.title).toBe('Sprint Review');
        expect(m.participants).toHaveLength(0);

        const retrieved = await svc.get(m.id);
        expect(retrieved?.title).toBe('Sprint Review');
    });

    it('lists meetings filtered by status', async () => {
        const m1 = await svc.create({ title: 'A', agenda: '', scheduledAt: 0, creatorType: 'agent', creatorId: 'a' });
        const m2 = await svc.create({ title: 'B', agenda: '', scheduledAt: 0, creatorType: 'agent', creatorId: 'a' });
        await svc.start(m1.id);

        const inProgress = await svc.list('in_progress');
        expect(inProgress.length).toBe(1);
        expect(inProgress[0].id).toBe(m1.id);

        const scheduled = await svc.list('scheduled');
        expect(scheduled.length).toBe(1);
        expect(scheduled[0].id).toBe(m2.id);
    });

    it('lifecycle: start → complete', async () => {
        const m = await svc.create({ title: 'X', agenda: '', scheduledAt: 0, creatorType: 'agent', creatorId: 'a' });
        const started = await svc.start(m.id);
        expect(started.status).toBe('in_progress');
        expect(started.startedAt).toBeGreaterThan(0);

        const completed = await svc.complete(m.id, 'All done');
        expect(completed.status).toBe('completed');
        expect(completed.endedAt).toBeGreaterThan(0);
        expect(completed.summary).toBe('All done');
    });

    it('cancel meeting', async () => {
        const m = await svc.create({ title: 'X', agenda: '', scheduledAt: 0, creatorType: 'agent', creatorId: 'a' });
        const cancelled = await svc.cancel(m.id);
        expect(cancelled.status).toBe('cancelled');
    });

    it('add and remove participants', async () => {
        const m = await svc.create({ title: 'X', agenda: '', scheduledAt: 0, creatorType: 'agent', creatorId: 'a' });
        const withP = await svc.addParticipant(m.id, 'agent-1', 'chair');
        expect(withP.participants).toHaveLength(1);
        expect(withP.participants[0].role).toBe('chair');

        const removed = await svc.removeParticipant(m.id, 'agent-1');
        expect(removed.participants).toHaveLength(0);
    });

    it('messages flow', async () => {
        const m = await svc.create({ title: 'X', agenda: '', scheduledAt: 0, creatorType: 'agent', creatorId: 'a' });
        const msg1 = await svc.addMessage(m.id, 'agent-1', 'agent', 'Hello');
        const msg2 = await svc.addMessage(m.id, 'human-1', 'human', 'Hi there');
        expect(msg1.content).toBe('Hello');

        const msgs = await svc.getMessages(m.id);
        expect(msgs.length).toBe(2);
        expect(msgs[0].content).toBe('Hello');
        expect(msgs[1].content).toBe('Hi there');
    });

    it('decisions and voting', async () => {
        const m = await svc.create({ title: 'X', agenda: '', scheduledAt: 0, creatorType: 'agent', creatorId: 'a' });
        const dec = await svc.createDecision(m.id, 'Use React');
        expect(dec.result).toBe('tabled');

        const voted1 = await svc.castVote(dec.id, 'agent-1', 'for');
        expect(voted1.votesFor).toHaveLength(1);
        expect(voted1.result).toBe('approved');

        const voted2 = await svc.castVote(dec.id, 'agent-2', 'against');
        expect(voted2.votesAgainst).toHaveLength(1);
        expect(voted2.result).toBe('tabled'); // 1 for vs 1 against = tie

        const voted3 = await svc.castVote(dec.id, 'agent-3', 'against');
        expect(voted3.result).toBe('rejected'); // more against now
    });

    it('extract action items from messages', async () => {
        const m = await svc.create({ title: 'X', agenda: '', scheduledAt: 0, creatorType: 'agent', creatorId: 'a' });
        await svc.addMessage(m.id, 'agent-1', 'agent', '@agent-2: Review the code');
        await svc.addMessage(m.id, 'agent-1', 'agent', '@agent-3: Write tests');

        const items = await svc.extractActionItems(m.id);
        expect(items.length).toBe(2);
        expect(items[0].assignee).toBe('agent-2');
        expect(items[0].task).toBe('Review the code');
        expect(items[1].assignee).toBe('agent-3');
    });

    it('throws on get/start/complete/cancel of missing meeting', async () => {
        await expect(svc.get('missing')).resolves.toBeUndefined();
        await expect(svc.start('missing')).rejects.toThrow('not found');
        await expect(svc.complete('missing')).rejects.toThrow('not found');
        await expect(svc.cancel('missing')).rejects.toThrow('not found');
    });

    it('delete meeting', async () => {
        const m = await svc.create({ title: 'X', agenda: '', scheduledAt: 0, creatorType: 'agent', creatorId: 'a' });
        await svc.delete(m.id);
        const gone = await svc.get(m.id);
        expect(gone).toBeUndefined();
    });
});
