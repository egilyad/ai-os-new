/**
 * Meeting service contract — AGEMS port, Phase 5.
 */
import type { Meeting, MeetingDecision, MeetingMessage, MeetingStatus, MeetingRole } from '../types/meeting-types';

export interface IMeetingService {
    // CRUD
    create(input: {
        title: string;
        agenda: string;
        scheduledAt: number;
        creatorType: 'agent' | 'human';
        creatorId: string;
        participants?: Array<{ agentId: string; role: MeetingRole }>;
    }): Promise<Meeting>;

    get(id: string): Promise<Meeting | undefined>;
    list(status?: MeetingStatus): Promise<Meeting[]>;
    update(id: string, updates: Partial<Pick<Meeting, 'title' | 'agenda' | 'status' | 'summary'>>): Promise<Meeting>;
    delete(id: string): Promise<void>;

    // Lifecycle
    start(id: string): Promise<Meeting>;
    complete(id: string, summary?: string): Promise<Meeting>;
    cancel(id: string): Promise<Meeting>;

    // Participants
    addParticipant(meetingId: string, agentId: string, role: MeetingRole): Promise<Meeting>;
    removeParticipant(meetingId: string, agentId: string): Promise<Meeting>;

    // Messages
    addMessage(meetingId: string, authorId: string, authorType: 'agent' | 'human', content: string): Promise<MeetingMessage>;
    getMessages(meetingId: string): Promise<MeetingMessage[]>;

    // Decisions + Voting
    createDecision(meetingId: string, description: string): Promise<MeetingDecision>;
    castVote(decisionId: string, agentId: string, vote: 'for' | 'against' | 'abstain'): Promise<MeetingDecision>;
    getDecisions(meetingId: string): Promise<MeetingDecision[]>;

    // Task extraction
    extractActionItems(meetingId: string): Promise<Array<{ assignee: string; task: string; deadline?: number }>>;
}
