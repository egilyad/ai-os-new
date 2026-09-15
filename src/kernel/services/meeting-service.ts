/**
 * Meeting service — AGEMS port, Phase 5.
 * Dexie-persisted meeting CRUD, lifecycle, voting, messages, task extraction.
 */
import type {
    Meeting,
    MeetingDecision,
    MeetingMessage,
    MeetingStatus,
    MeetingRole,
} from '../types/meeting-types';
import type { IMeetingService } from '../contracts/meeting';
import { rootLogger } from './logger-service';

const log = rootLogger.child('MeetingService');

let counter = 0;

export class MeetingService implements IMeetingService {
    private db: {
        meetings: {
            toArray(): Promise<Record<string, unknown>[]>;
            get(id: string): Promise<Record<string, unknown> | undefined>;
            put(v: Record<string, unknown>): Promise<string>;
            delete(id: string): Promise<void>;
        };
        meetingDecisions: {
            toArray(): Promise<Record<string, unknown>[]>;
            put(v: Record<string, unknown>): Promise<string>;
        };
        meetingMessages: {
            toArray(): Promise<Record<string, unknown>[]>;
            put(v: Record<string, unknown>): Promise<string>;
        };
    };

    constructor(db: {
        meetings: {
            toArray(): Promise<Record<string, unknown>[]>;
            get(id: string): Promise<Record<string, unknown> | undefined>;
            put(v: Record<string, unknown>): Promise<string>;
            delete(id: string): Promise<void>;
        };
        meetingDecisions: {
            toArray(): Promise<Record<string, unknown>[]>;
            put(v: Record<string, unknown>): Promise<string>;
        };
        meetingMessages: {
            toArray(): Promise<Record<string, unknown>[]>;
            put(v: Record<string, unknown>): Promise<string>;
        };
    }) {
        this.db = db;
    }

    private genId(): string {
        return `meeting-${Date.now()}-${++counter}`;
    }

    async create(input: {
        title: string;
        agenda: string;
        scheduledAt: number;
        creatorType: 'agent' | 'human';
        creatorId: string;
        participants?: Array<{ agentId: string; role: MeetingRole }>;
    }): Promise<Meeting> {
        const now = Date.now();
        const meeting: Meeting = {
            id: this.genId(),
            title: input.title,
            agenda: input.agenda,
            status: 'scheduled',
            scheduledAt: input.scheduledAt,
            creatorType: input.creatorType,
            creatorId: input.creatorId,
            participants: input.participants?.map(p => ({ ...p })) ?? [],
            createdAt: now,
            updatedAt: now,
        };
        await this.db.meetings.put(meeting as unknown as Record<string, unknown>);
        log.info('create', `Created meeting "${meeting.title}" (${meeting.id})`);
        return meeting;
    }

    async get(id: string): Promise<Meeting | undefined> {
        const record = await this.db.meetings.get(id);
        return record as unknown as Meeting | undefined;
    }

    async list(status?: MeetingStatus): Promise<Meeting[]> {
        const all = await this.db.meetings.toArray() as unknown as Meeting[];
        if (status) return all.filter(m => m.status === status);
        return all;
    }

    async update(id: string, updates: Partial<Pick<Meeting, 'title' | 'agenda' | 'status' | 'summary'>>): Promise<Meeting> {
        const meeting = await this.get(id);
        if (!meeting) throw new Error(`Meeting not found: ${id}`);
        const updated: Meeting = { ...meeting, ...updates, updatedAt: Date.now() };
        await this.db.meetings.put(updated as unknown as Record<string, unknown>);
        return updated;
    }

    async delete(id: string): Promise<void> {
        await this.db.meetings.delete(id);
    }

    async start(id: string): Promise<Meeting> {
        const meeting = await this.get(id);
        if (!meeting) throw new Error(`Meeting not found: ${id}`);
        return this.update(id, { status: 'in_progress', startedAt: Date.now() });
    }

    async complete(id: string, summary?: string): Promise<Meeting> {
        const meeting = await this.get(id);
        if (!meeting) throw new Error(`Meeting not found: ${id}`);
        return this.update(id, { status: 'completed', endedAt: Date.now(), summary });
    }

    async cancel(id: string): Promise<Meeting> {
        const meeting = await this.get(id);
        if (!meeting) throw new Error(`Meeting not found: ${id}`);
        return this.update(id, { status: 'cancelled', endedAt: Date.now() });
    }

    async addParticipant(meetingId: string, agentId: string, role: MeetingRole): Promise<Meeting> {
        const meeting = await this.get(meetingId);
        if (!meeting) throw new Error(`Meeting not found: ${meetingId}`);
        const existing = meeting.participants.find(p => p.agentId === agentId);
        if (existing) {
            existing.role = role;
        } else {
            meeting.participants.push({ agentId, role });
        }
        return this.update(meetingId, { participants: meeting.participants } as Partial<Pick<Meeting, 'title' | 'agenda' | 'status' | 'summary'>>);
    }

    async removeParticipant(meetingId: string, agentId: string): Promise<Meeting> {
        const meeting = await this.get(meetingId);
        if (!meeting) throw new Error(`Meeting not found: ${meetingId}`);
        meeting.participants = meeting.participants.filter(p => p.agentId !== agentId);
        return this.update(meetingId, { participants: meeting.participants } as Partial<Pick<Meeting, 'title' | 'agenda' | 'status' | 'summary'>>);
    }

    async addMessage(meetingId: string, authorId: string, authorType: 'agent' | 'human', content: string): Promise<MeetingMessage> {
        const msg: MeetingMessage = {
            id: `msg-${Date.now()}-${++counter}`,
            meetingId,
            authorId,
            authorType,
            content,
            timestamp: Date.now(),
        };
        await this.db.meetingMessages.put(msg as unknown as Record<string, unknown>);
        return msg;
    }

    async getMessages(meetingId: string): Promise<MeetingMessage[]> {
        const all = await this.db.meetingMessages.toArray() as unknown as MeetingMessage[];
        return all.filter(m => m.meetingId === meetingId).sort((a, b) => a.timestamp - b.timestamp);
    }

    async createDecision(meetingId: string, description: string): Promise<MeetingDecision> {
        const decision: MeetingDecision = {
            id: `decision-${Date.now()}-${++counter}`,
            meetingId,
            description,
            votesFor: [],
            votesAgainst: [],
            votesAbstain: [],
            result: 'tabled',
            createdAt: Date.now(),
        };
        await this.db.meetingDecisions.put(decision as unknown as Record<string, unknown>);
        return decision;
    }

    async castVote(decisionId: string, agentId: string, vote: 'for' | 'against' | 'abstain'): Promise<MeetingDecision> {
        const all = await this.db.meetingDecisions.toArray() as unknown as MeetingDecision[];
        const decision = all.find(d => d.id === decisionId);
        if (!decision) throw new Error(`Decision not found: ${decisionId}`);

        // Remove from any previous vote
        decision.votesFor = decision.votesFor.filter(v => v !== agentId);
        decision.votesAgainst = decision.votesAgainst.filter(v => v !== agentId);
        decision.votesAbstain = decision.votesAbstain.filter(v => v !== agentId);

        // Add new vote
        if (vote === 'for') decision.votesFor.push(agentId);
        else if (vote === 'against') decision.votesAgainst.push(agentId);
        else decision.votesAbstain.push(agentId);

        // Determine result
        if (decision.votesFor.length > decision.votesAgainst.length) {
            decision.result = 'approved';
        } else if (decision.votesAgainst.length > decision.votesFor.length) {
            decision.result = 'rejected';
        } else {
            decision.result = 'tabled';
        }

        await this.db.meetingDecisions.put(decision as unknown as Record<string, unknown>);
        return decision;
    }

    async getDecisions(meetingId: string): Promise<MeetingDecision[]> {
        const all = await this.db.meetingDecisions.toArray() as unknown as MeetingDecision[];
        return all.filter(d => d.meetingId === meetingId);
    }

    async extractActionItems(meetingId: string): Promise<Array<{ assignee: string; task: string; deadline?: number }>> {
        const messages = await this.getMessages(meetingId);
        const items: Array<{ assignee: string; task: string; deadline?: number }> = [];

        for (const msg of messages) {
            // Simple extraction: look for patterns like "@agent: do X by Y"
            const matches = msg.content.match(/@(\S+):\s*(.+?)(?:\s+by\s+(\S+))?$/g);
            if (matches) {
                for (const match of matches) {
                    const parts = match.match(/@(\S+):\s*(.+)/);
                    if (parts) {
                        items.push({
                            assignee: parts[1],
                            task: parts[2].trim(),
                        });
                    }
                }
            }
        }
        return items;
    }
}
