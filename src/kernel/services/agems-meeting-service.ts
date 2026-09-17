import { getDexieDb } from './dexie-schema';
import type { Meeting, MeetingDecision } from '../types/agems-meeting';

export class AgemsMeetingService {
    async create(input: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: Meeting['status'] }): Promise<Meeting> {
        const m: Meeting = {
            id: `meeting-${crypto.randomUUID()}`,
            title: input.title.slice(0, 120),
            agenda: input.agenda?.slice(0, 2000),
            status: input.status ?? 'SCHEDULED',
            scheduledAt: input.scheduledAt,
            creatorType: input.creatorType,
            creatorId: input.creatorId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await getDexieDb().meetings.add(m as never);
        return m;
    }

    async list(): Promise<Meeting[]> {
        return ((await getDexieDb().meetings.toArray()) as unknown as Meeting[]).sort((a, b) => b.createdAt - a.createdAt);
    }

    async start(id: string): Promise<Meeting | undefined> {
        await getDexieDb().meetings.update(id, { status: 'IN_PROGRESS', startedAt: Date.now(), updatedAt: Date.now() } as never);
        return (await getDexieDb().meetings.get(id)) as unknown as Meeting | undefined;
    }

    async complete(id: string, summary?: string): Promise<void> {
        await getDexieDb().meetings.update(id, { status: 'COMPLETED', summary, endedAt: Date.now(), updatedAt: Date.now() } as never);
    }

    async createDecision(meetingId: string, description: string): Promise<MeetingDecision> {
        const d: MeetingDecision = { meetingId, description: description.slice(0, 500), votesFor: 0, votesAgainst: 0, votesAbstain: 0, createdAt: Date.now() };
        const id = (await getDexieDb().meetingDecisions.add(d as never)) as unknown as number;
        return { ...d, id } as MeetingDecision;
    }

    async vote(decisionId: number, vote: 'for' | 'against' | 'abstain'): Promise<void> {
        const d = (await getDexieDb().meetingDecisions.get(decisionId)) as unknown as MeetingDecision | undefined;
        if (!d) return;
        const upd: Partial<MeetingDecision> = {};
        if (vote === 'for') upd.votesFor = d.votesFor + 1;
        else if (vote === 'against') upd.votesAgainst = d.votesAgainst + 1;
        else upd.votesAbstain = d.votesAbstain + 1;
        // simple result
        const totalFor = (upd.votesFor ?? d.votesFor) ?? 0;
        const totalAgainst = (upd.votesAgainst ?? d.votesAgainst) ?? 0;
        if (totalFor > totalAgainst) upd.result = 'APPROVED';
        else if (totalAgainst > totalFor) upd.result = 'REJECTED';
        await getDexieDb().meetingDecisions.update(decisionId, upd as never);
    }

    async decisions(meetingId: string): Promise<MeetingDecision[]> {
        return (await getDexieDb().meetingDecisions.where('meetingId').equals(meetingId).toArray()) as unknown as MeetingDecision[];
    }
}

export const agemsMeetingService = new AgemsMeetingService();
