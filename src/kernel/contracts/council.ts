import type { ILifecycle } from './lifecycle';
import type {
    AudienceVote,
    CouncilChannel,
    CouncilConfig,
    CouncilMessage,
    CouncilParticipant,
    CouncilRoleKind,
    CouncilSession,
    FactPacket,
    JudgeScore,
} from '../types/council-types';

export type {
    AudienceVote,
    CouncilChannel,
    CouncilConfig,
    CouncilMessage,
    CouncilParticipant,
    CouncilPhase,
    CouncilRoleKind,
    CouncilSession,
    FactPacket,
    JudgeScore,
} from '../types/council-types';

export interface CreateCouncilInput {
    topic: string;
    config?: CouncilConfig;
    participants?: Array<{
        name: string;
        kind: CouncilRoleKind;
        lensId?: string;
        polarityId?: string;
    }>;
    judges?: Array<{ name: string; dimensions?: string[]; weight?: number }>;
}

export interface CouncilProposal {
    sessionId: string;
    stance: string;
    authorId: string;
}

/** LLM boundary — Council works fully offline without it (deterministic fallback). */
export interface ICouncilLlmPort {
    draftStance(input: { topic: string; participant: CouncilParticipant }): Promise<string>;
    judgeRound(input: {
        topic: string;
        messages: CouncilMessage[];
        judgeName: string;
        dimensions: string[];
        blindMap?: Record<string, string>;
    }): Promise<{ winnerId: string; scores: Record<string, number>; rationale: string }>;
}

/**
 * CouncilService — Wave 2 orchestrator ( additive layer over Debate Runtime ).
 *
 * Owns CouncilSession aggregate exclusively; Debate/Forum/Chat services are
 * never modified. All transitions persist to Dexie and emit `council:*`.
 */
export interface ICouncilService extends ILifecycle {
    createSession(input: CreateCouncilInput): Promise<CouncilSession>;
    getSession(id: string): Promise<CouncilSession | null>;
    listSessions(): Promise<CouncilSession[]>;

    /** Proposal phase: each proponent/opponent posts an opening stance. */
    submitProposal(sessionId: string, authorId: string, stance: string): Promise<CouncilMessage>;
    /** Fact-gathering phase: researcher/fact-checker packets. */
    submitFact(
        sessionId: string,
        authorId: string,
        claim: string,
        verdict?: FactPacket['verdict'],
        sources?: string[],
    ): Promise<FactPacket>;
    /** Debate phase: forum broadcast or whisper (private author->to). */
    postMessage(
        sessionId: string,
        authorId: string,
        body: string,
        channel?: CouncilChannel,
        toId?: string,
    ): Promise<CouncilMessage>;
    /** Advance Proposal -> [FactGathering] -> Debate -> Consensus -> Completed. */
    advancePhase(sessionId: string): Promise<CouncilSession>;
    /** One judge ballot (blind when session is double-blind). */
    submitJudgeScore(
        sessionId: string,
        judgeId: string,
        winnerId: string,
        scores?: Record<string, number>,
        rationale?: string,
    ): Promise<JudgeScore>;
    /** Audience vote mid-debate (user). */
    castAudienceVote(sessionId: string, voterId: string, pickId: string): Promise<AudienceVote>;
    /** Tally judges (+ audience as advisory) and finish with winner + summary. */
    conclude(sessionId: string): Promise<CouncilSession>;
    abort(sessionId: string): Promise<void>;

    // ── Lens / polarity helpers (Wave 2.1) ──
    listLenses(): Array<{ id: string; name: string; prompt: string }>;
    listPolarities(): Array<{ id: string; name: string; sides: string[] }>;
    promptFor(participant: CouncilParticipant): string;
}
