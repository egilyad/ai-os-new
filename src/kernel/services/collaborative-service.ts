import type { DebateSession, HumanVote } from '../contracts/debate-types';
import { EVENTS } from '../events/event-names';

export type CollabRole = 'pro' | 'con' | 'judge' | 'neutral';

export interface HumanParticipant {
    userName: string;
    role: CollabRole;
    joinedAt: number;
}

interface CollabSession {
    sessionId: string;
    debateId: string;
    participants: HumanParticipant[];
}

interface CollabServiceDeps {
    eventBus: {
        emit: (event: string, payload: unknown) => void;
        onSafe: <T>(event: string, handler: (data: T) => void) => () => void;
    };
    humanService: {
        addArgument: (
            session: DebateSession | null,
            agentName: string,
            content: string,
            confidence?: number,
            options?: { position?: 'pro' | 'con' | 'neutral' },
        ) => Promise<void>;
    };
    debateApiService: {
        getSession: (id: string) => DebateSession | null;
    };
}

const MAX_SESSIONS = 100;

export class CollaborativeService {
    private sessions = new Map<string, CollabSession>();

    constructor(private deps: CollabServiceDeps) {}

    destroy(): void {
        this.sessions.clear();
    }

    joinDebate(sessionId: string, userName: string, role: CollabRole, debateId?: string): boolean {
        let session = this.sessions.get(sessionId);
        if (!session) {
            session = { sessionId, debateId: debateId ?? sessionId, participants: [] };
            this.sessions.set(sessionId, session);
            if (this.sessions.size > MAX_SESSIONS) {
                const oldest = this.sessions.keys().next().value;
                if (oldest !== undefined) this.sessions.delete(oldest);
            }
        }
        if (session.participants.some((p) => p.userName === userName)) return false;
        session.participants.push({ userName, role, joinedAt: Date.now() });
        const activeSession = this.deps.debateApiService.getSession(session.debateId);
        if (activeSession) this.deps.eventBus.emit(EVENTS.DEBATE_UPDATED, activeSession);
        return true;
    }

    leaveDebate(sessionId: string, userName: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        session.participants = session.participants.filter((p) => p.userName !== userName);
        if (session.participants.length === 0) this.sessions.delete(sessionId);
        const activeSession = this.deps.debateApiService.getSession(session.debateId);
        if (activeSession) this.deps.eventBus.emit(EVENTS.DEBATE_UPDATED, activeSession);
    }

    getParticipants(sessionId: string): HumanParticipant[] {
        return this.sessions.get(sessionId)?.participants ?? [];
    }

    async submitArgument(sessionId: string, userName: string, content: string): Promise<boolean> {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        const participant = session.participants.find((p) => p.userName === userName);
        if (!participant) return false;
        const position =
            participant.role === 'judge'
                ? ('neutral' as const)
                : (participant.role as 'pro' | 'con');
        const debateSession = this.deps.debateApiService.getSession(session.debateId);
        if (!debateSession) return false;
        await this.deps.humanService.addArgument(debateSession, userName, content, 1.0, {
            position,
        });
        return true;
    }

    async submitVote(
        sessionId: string,
        userName: string,
        votedAgentId: string,
        score: number,
    ): Promise<void> {
        const session = this.sessions.get(sessionId);
        const debateSession = session
            ? this.deps.debateApiService.getSession(session.debateId)
            : null;
        const vote: HumanVote = {
            round: debateSession?.currentRound ?? 0,
            voter: 'human',
            votedAgentId,
            score,
            timestamp: Date.now(),
        };
        this.deps.eventBus.emit(EVENTS.DEBATE_HUMAN_VOTE, { sessionId, vote, userName });
    }

    getCollabDebateSessionId(): string | null {
        return null;
    }
}
