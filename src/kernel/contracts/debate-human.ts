import type { HumanVote, DebateSession } from './debate-types';

export interface IDebateHumanService {
    addArgument(
        session: DebateSession | null,
        agentName: string,
        content: string,
        confidence?: number,
        opts?: { position?: 'pro' | 'con' | 'neutral' },
    ): Promise<void>;

    recordHumanVote(session: DebateSession | null, vote: HumanVote): void;

    removeHumanVote(
        session: DebateSession | null,
        round: number,
        voter: string,
        votedAgentId: string,
    ): void;

    getHumanVotes(session: DebateSession | null): HumanVote[];

    getVoteAlignmentSummary(session: DebateSession | null): Array<{
        round: number;
        humanPicks: string[];
        aiPick: string | null;
        aligned: boolean;
    }>;
}
