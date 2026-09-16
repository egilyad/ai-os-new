/**
 * Council (advanced Debate) domain types — Roadmap Wave 2.
 *
 * Unifies on top of the existing Debate Runtime (untouched):
 *   lenses/polarities + Forum/Whisper + double-blind + fact-gathering +
 *   blind judge + multi-judge + audience voting + Researcher/FactChecker +
 *   Proposal → Debate → Consensus phases + State-Graph node adapter.
 *
 * Persistence: Dexie `councilSessions` + `councilMessages` + `councilVotes` (v24).
 * Communication: EventBus only (`council:*`).
 */

export type CouncilPhase =
    | 'proposal'
    | 'fact_gathering'
    | 'debate'
    | 'consensus'
    | 'completed'
    | 'aborted';

export type CouncilStatus = 'running' | 'completed' | 'aborted';

export type CouncilRoleKind =
    | 'proponent'
    | 'opponent'
    | 'researcher'
    | 'fact_checker'
    | 'judge'
    | 'moderator';

export type CouncilChannel = 'forum' | 'whisper';

export interface CouncilParticipant {
    id: string;
    name: string;
    kind: CouncilRoleKind;
    /** Analytical lens id (council-lenses.ts). */
    lensId?: string;
    /** Polarity side id (council-lenses.ts), e.g. 'optimist' vs 'skeptic'. */
    polarityId?: string;
}

export interface CouncilJudge {
    id: string;
    name: string;
    /** Independent judging dimensions, e.g. ['logic','evidence','clarity']. */
    dimensions: string[];
    weight?: number;
}

export interface CouncilConfig {
    topic: string;
    /** Double-blind: judges/audience see anonymized aliases, not identities. */
    doubleBlind?: boolean;
    /** Separate fact-gathering stage before the debate. */
    factGathering?: boolean;
    maxRounds?: number;
    allowAudienceVoting?: boolean;
}

export interface FactPacket {
    id: string;
    sessionId: string;
    authorId: string;
    claim: string;
    /** 'verified' | 'disputed' | 'unverifiable' */
    verdict: 'verified' | 'disputed' | 'unverifiable';
    sources?: string[];
    createdAt: number;
}

export interface CouncilMessage {
    id: string;
    sessionId: string;
    channel: CouncilChannel;
    authorId: string;
    /** Whisper target participant id (undefined = forum broadcast). */
    toId?: string;
    body: string;
    round?: number;
    createdAt: number;
}

export interface JudgeScore {
    judgeId: string;
    sessionId: string;
    /** Winner participant id or 'draw'. */
    winnerId: string;
    scores: Record<string, number>;
    rationale?: string;
    blind?: boolean;
    createdAt: number;
}

export interface AudienceVote {
    id: string;
    sessionId: string;
    voterId: string;
    pickId: string;
    createdAt: number;
}

export interface CouncilSession {
    id: string;
    topic: string;
    config: CouncilConfig;
    phase: CouncilPhase;
    status: CouncilStatus;
    participants: CouncilParticipant[];
    judges: CouncilJudge[];
    /** Alias map for double-blind mode: participantId -> alias (e.g. 'Speaker A'). */
    aliases?: Record<string, string>;
    facts: FactPacket[];
    messages: CouncilMessage[];
    scores: JudgeScore[];
    votes: AudienceVote[];
    /** Winning participant id or 'draw' (set at consensus/completion). */
    winnerId?: string;
    summary?: string;
    createdAt: number;
    updatedAt: number;
}

/** Dexie rows (embedded arrays keep v24 simple — sessions are small). */
export interface CouncilSessionRecord {
    id: string;
    topic: string;
    config: CouncilConfig;
    phase: CouncilPhase;
    status: CouncilStatus;
    participants: CouncilParticipant[];
    judges: CouncilJudge[];
    aliases?: Record<string, string>;
    winnerId?: string;
    summary?: string;
    createdAt: number;
    updatedAt: number;
}

export interface CouncilMessageRecord {
    id: string;
    sessionId: string;
    channel: CouncilChannel;
    authorId: string;
    toId?: string;
    body: string;
    round?: number;
    createdAt: number;
}

export interface CouncilVoteRecord {
    id: string;
    sessionId: string;
    kind: 'judge' | 'audience' | 'fact';
    voterId: string;
    pickId: string;
    payload?: Record<string, unknown>;
    createdAt: number;
}
