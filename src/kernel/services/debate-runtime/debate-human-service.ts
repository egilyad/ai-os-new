import type { IDebateHumanService } from '../../contracts/debate-human';
import type { HumanVote, DebateSession, DebateArgument } from '../../contracts/debate-types';
import type { IEventBus } from '../../types/interfaces';
import type { DebateStore } from '../../contracts/storage/debate-store';
import { EVENTS } from '../../events/event-names';
import { persistActiveSession } from './debate-session-persistence';

export class DebateHumanService implements IDebateHumanService {
    private eventBus: IEventBus;
    private debateStore: DebateStore;
    private updateConvergenceScore: ((session: DebateSession) => void) | null;

    constructor(
        eventBus: IEventBus,
        debateStore: DebateStore,
        deps?: { updateConvergenceScore?: (session: DebateSession) => void },
    ) {
        this.eventBus = eventBus;
        this.debateStore = debateStore;
        this.updateConvergenceScore = deps?.updateConvergenceScore ?? null;
    }

    async addArgument(
        session: DebateSession | null,
        agentName: string,
        content: string,
        confidence = 1.0,
        opts?: { position?: 'pro' | 'con' | 'neutral' },
    ): Promise<void> {
        if (!session || session.status === 'completed') return;

        const arg: DebateArgument = {
            id: crypto.randomUUID(),
            agentId: 'human',
            agentName,
            content,
            confidence,
            timestamp: Date.now(),
            round: session.currentRound,
            source: 'human' as const,
            position: opts?.position ?? ('neutral' as const),
        };

        session.arguments.push(arg);
        if (this.updateConvergenceScore) this.updateConvergenceScore(session);
        this.eventBus.emit(EVENTS.DEBATE_ARGUMENT, {
            sessionId: session.id,
            argument: arg,
        });
        this.eventBus.emitOnce(EVENTS.DEBATE_UPDATED, session.id, session);
        void persistActiveSession(this.debateStore, session);
    }

    recordHumanVote(session: DebateSession | null, vote: HumanVote): void {
        if (!session) return;
        if (!session.roundVotes) session.roundVotes = {};
        const list = [...(session.roundVotes[vote.round] || [])];
        const idx = list.findIndex(
            (v) => v.voter === vote.voter && v.votedAgentId === vote.votedAgentId,
        );
        if (vote.score <= 0) {
            if (idx >= 0) list.splice(idx, 1);
        } else if (idx >= 0) {
            list[idx] = vote;
        } else {
            list.push(vote);
        }
        session.roundVotes[vote.round] = list;
        this.eventBus.emitOnce(EVENTS.DEBATE_UPDATED, session.id, session);
        void persistActiveSession(this.debateStore, session);
    }

    removeHumanVote(
        session: DebateSession | null,
        round: number,
        voter: string,
        votedAgentId: string,
    ): void {
        if (!session?.roundVotes) return;
        const list = [...(session.roundVotes[round] || [])];
        const idx = list.findIndex((v) => v.voter === voter && v.votedAgentId === votedAgentId);
        if (idx >= 0) list.splice(idx, 1);
        session.roundVotes[round] = list;
        this.eventBus.emitOnce(EVENTS.DEBATE_UPDATED, session.id, session);
        void persistActiveSession(this.debateStore, session);
    }

    getHumanVotes(session: DebateSession | null): HumanVote[] {
        if (!session?.roundVotes) return [];
        return Object.values(session.roundVotes).flat();
    }

    getVoteAlignmentSummary(session: DebateSession | null): Array<{
        round: number;
        humanPicks: string[];
        aiPick: string | null;
        aligned: boolean;
    }> {
        if (!session?.roundVotes) return [];
        return Object.entries(session.roundVotes)
            .map(([roundStr, votes]) => {
                const round = Number(roundStr);
                const humanPicks = votes.filter((v) => v.score >= 5).map((v) => v.votedAgentId);
                const aiPick = this.getAiRoundWinner(session, round);
                const aligned = aiPick !== null && humanPicks.includes(aiPick);
                return { round, humanPicks, aiPick, aligned };
            })
            .sort((a, b) => a.round - b.round);
    }

    private getAiRoundWinner(session: DebateSession, round: number): string | null {
        const args =
            session.arguments.filter((a) => a.round === round && a.agentId !== 'human') ?? [];
        if (args.length === 0) return null;
        let best = args[0];
        for (const arg of args) {
            if (arg.confidence > best!.confidence) best = arg;
        }
        return best!.agentId;
    }
}
