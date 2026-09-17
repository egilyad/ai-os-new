export type MeetingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type MeetingRole = 'CHAIR' | 'MEMBER' | 'OBSERVER';
export type VoteResult = 'APPROVED' | 'REJECTED' | 'TABLED';

export interface Meeting {
    id: string;
    title: string;
    agenda?: string;
    status: MeetingStatus;
    scheduledAt?: number;
    startedAt?: number;
    endedAt?: number;
    creatorType: string;
    creatorId: string;
    summary?: string;
    createdAt: number;
    updatedAt: number;
}

export interface MeetingDecision {
    id?: number;
    meetingId: string;
    description: string;
    votesFor: number;
    votesAgainst: number;
    votesAbstain: number;
    result?: VoteResult;
    createdAt: number;
}
