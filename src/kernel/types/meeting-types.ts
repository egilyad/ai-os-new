/**
 * Meeting types — AGEMS port, Phase 5.
 */

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MeetingRole = 'chair' | 'member' | 'observer';
export type VoteResult = 'approved' | 'rejected' | 'tabled';

export interface MeetingParticipant {
    agentId: string;
    role: MeetingRole;
    joinedAt?: number;
    leftAt?: number;
}

export interface Meeting {
    id: string;
    title: string;
    agenda: string;
    status: MeetingStatus;
    scheduledAt: number;
    startedAt?: number;
    endedAt?: number;
    creatorType: 'agent' | 'human';
    creatorId: string;
    summary?: string;
    participants: MeetingParticipant[];
    createdAt: number;
    updatedAt: number;
}

export interface MeetingDecision {
    id: string;
    meetingId: string;
    description: string;
    votesFor: string[];
    votesAgainst: string[];
    votesAbstain: string[];
    result: VoteResult;
    createdAt: number;
}

export interface MeetingMessage {
    id: string;
    meetingId: string;
    authorId: string;
    authorType: 'agent' | 'human';
    content: string;
    timestamp: number;
}
