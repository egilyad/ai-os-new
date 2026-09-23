/**
 * CouncilService — Wave 2 orchestrator (additive layer, Debate Runtime untouched).
 *
 * Phases: proposal -> [fact_gathering] -> debate -> consensus -> completed.
 * Channels: forum (broadcast) + whisper (private author -> to).
 * Modes: double-blind (aliases for judges), multi-judge tally, audience votes.
 * Roles: proponent / opponent / researcher / fact_checker / judge / moderator.
 */
import type { IEventBus } from '../../types/interfaces';
import type { CouncilRepository } from '../../dal/council-repository';
import type {
    AudienceVote,
    CouncilMessage,
    CouncilParticipant,
    CouncilSession,
    CreateCouncilInput,
    FactPacket,
    ICouncilLlmPort,
    ICouncilService,
    JudgeScore,
} from '../../contracts/council';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import {
    COUNCIL_LENSES,
    COUNCIL_POLARITIES,
    buildParticipantPrompt,
} from './council-lenses';

const LOGGER = rootLogger.child('CouncilService');

function now(): number {
    return Date.now();
}

function aliasFor(index: number): string {
    return `Speaker ${String.fromCharCode(65 + (index % 26))}`;
}

export interface CouncilServiceDeps {
    repository: CouncilRepository;
    eventBus: IEventBus;
    llm?: ICouncilLlmPort;
    /** D2.3: optional provenance wiring (additive, no web grounding). */
    provenance?: import('../../contracts/trust').IProvenanceService;
}

export class CouncilService implements ICouncilService {
    private repo: CouncilRepository;
    private events: IEventBus;
    private llm?: ICouncilLlmPort;
    private provenance?: import('../../contracts/trust').IProvenanceService;

    constructor(deps: CouncilServiceDeps) {
        this.repo = deps.repository;
        this.events = deps.eventBus;
        this.llm = deps.llm;
        this.provenance = deps.provenance;
    }

    async init(): Promise<void> {
        LOGGER.info('CouncilService', 'init', {});
    }

    async destroy(): Promise<void> {
        // no background work
    }

    /** GAP E.1 — attach the real LLM port (stance drafts + judge ballots). */
    setLlmPort(llm: ICouncilLlmPort): void {
        this.llm = llm;
    }

    // ── Sessions ──
    async createSession(input: CreateCouncilInput): Promise<CouncilSession> {
        const t = now();
        const id = genId('council');
        const participants: CouncilParticipant[] = (input.participants ?? []).map((p) => ({
            id: genId('cmember'),
            name: p.name,
            kind: p.kind,
            lensId: p.lensId,
            polarityId: p.polarityId,
        }));
        if (participants.length === 0) {
            // Sensible default: proponent + opponent + researcher + fact-checker.
            participants.push(
                { id: genId('cmember'), name: 'Proponent', kind: 'proponent', lensId: 'steelman' },
                { id: genId('cmember'), name: 'Opponent', kind: 'opponent', lensId: 'devil' },
                { id: genId('cmember'), name: 'Researcher', kind: 'researcher', lensId: 'empiricist' },
                { id: genId('cmember'), name: 'Fact Checker', kind: 'fact_checker', lensId: 'popper' },
            );
        }
        const config = {
            topic: input.topic,
            doubleBlind: input.config?.doubleBlind ?? false,
            factGathering: input.config?.factGathering ?? true,
            maxRounds: input.config?.maxRounds ?? 3,
            allowAudienceVoting: input.config?.allowAudienceVoting ?? true,
            ...(input.config ?? {}),
        };
        const judges = (input.judges ?? [{ name: 'Blind Judge' }]).map((j) => ({
            id: genId('judge'),
            name: j.name,
            dimensions: j.dimensions ?? ['logic', 'evidence', 'clarity'],
            weight: j.weight ?? 1,
        }));
        const aliases: Record<string, string> | undefined = config.doubleBlind
            ? Object.fromEntries(participants.map((p, i) => [p.id, aliasFor(i)]))
            : undefined;
        const session: CouncilSession = {
            id,
            topic: input.topic,
            config,
            phase: 'proposal',
            status: 'running',
            participants,
            judges,
            aliases,
            facts: [],
            messages: [],
            scores: [],
            votes: [],
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putSession(session);
        this.events.emit(EVENTS.COUNCIL_CREATED, {
            sessionId: id,
            topic: input.topic.slice(0, 280),
            phase: 'proposal',
            participantCount: participants.length,
            judgeCount: judges.length,
        });
        return session;
    }

    async getSession(id: string): Promise<CouncilSession | null> {
        return this.repo.getSession(id);
    }

    async listSessions(): Promise<CouncilSession[]> {
        return this.repo.listSessions();
    }

    // ── Proposal ──
    async submitProposal(sessionId: string, authorId: string, stance: string): Promise<CouncilMessage> {
        const session = await this.require(sessionId);
        this.assertPhase(session, ['proposal']);
        const author = this.requireMember(session, authorId);
        const msg: CouncilMessage = {
            id: genId('cmsg'),
            sessionId,
            channel: 'forum',
            authorId: author.id,
            body: stance,
            round: 0,
            createdAt: now(),
        };
        session.messages.push(msg);
        session.updatedAt = now();
        await this.repo.putSession(session);
        this.events.emit(EVENTS.COUNCIL_PROPOSAL, {
            sessionId,
            authorId: this.publicId(session, author.id),
            stance: stance.slice(0, 500),
        });
        // Optional LLM co-draft is advisory only — the submitted stance always wins.
        if (this.llm) {
            try {
                const draft = await this.llm.draftStance({ topic: session.topic, participant: author });
                LOGGER.debug('CouncilService', 'llm draft stance (advisory)', { len: draft.length });
            } catch (e) {
                LOGGER.warn('CouncilService', 'llm draftStance failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return msg;
    }

    // ── Fact gathering ──
    async submitFact(
        sessionId: string,
        authorId: string,
        claim: string,
        verdict: FactPacket['verdict'] = 'unverifiable',
        sources: string[] = [],
    ): Promise<FactPacket> {
        const session = await this.require(sessionId);
        this.assertPhase(session, ['proposal', 'fact_gathering']);
        const author = this.requireMember(session, authorId);
        if (author.kind !== 'researcher' && author.kind !== 'fact_checker' && author.kind !== 'moderator') {
            throw new Error(`Role ${author.kind} cannot submit facts (researcher/fact_checker only)`);
        }
        const fact: FactPacket = {
            id: genId('fact'),
            sessionId,
            authorId: author.id,
            claim,
            verdict,
            sources,
            createdAt: now(),
        };
        session.facts.push(fact);
        if (session.phase === 'proposal' && session.config.factGathering) {
            session.phase = 'fact_gathering';
        }
        session.updatedAt = now();
        await this.repo.putSession(session);
        // D2.3: wire Claim → Sources → Provenance (additive, no web grounding → RUNTIME-PENDING)
        if (this.provenance) {
            try {
                const claimNode = await this.provenance.addNode('data', `Claim: ${claim.slice(0, 120)}`, sessionId);
                for (const src of sources.slice(0, 5)) {
                    const srcNode = await this.provenance.addNode('data', `Source: ${src.slice(0, 120)}`, sessionId);
                    await this.provenance.link(srcNode.id, claimNode.id, 'informed_by');
                }
                const verdictNode = await this.provenance.addNode('decision', `Fact verdict:${fact.verdict}`, fact.id);
                await this.provenance.link(claimNode.id, verdictNode.id, 'derived_from');
                // also link verdict → session trace anchor
                const sessionNode = await this.provenance.addNode('prompt', `Council:${session.topic.slice(0, 80)}`, sessionId);
                await this.provenance.link(verdictNode.id, sessionNode.id, 'derived_from');
            } catch (e) {
                LOGGER.warn('CouncilService', 'provenance wire failed (D2.3, non-fatal)', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        this.events.emit(EVENTS.COUNCIL_FACT, {
            sessionId,
            factId: fact.id,
            verdict: fact.verdict,
            claim: claim.slice(0, 280),
        });
        return fact;
    }

    // ── Debate messages (forum + whisper) ──
    async postMessage(
        sessionId: string,
        authorId: string,
        body: string,
        channel: 'forum' | 'whisper' = 'forum',
        toId?: string,
    ): Promise<CouncilMessage> {
        const session = await this.require(sessionId);
        this.assertPhase(session, ['debate', 'fact_gathering', 'proposal']);
        const author = this.requireMember(session, authorId);
        if (channel === 'whisper') {
            if (!toId) throw new Error('Whisper requires a toId (private recipient)');
            const target = this.requireMember(session, toId);
            if (target.id === author.id) throw new Error('Whisper target must differ from author');
        }
        // Auto-advance into debate phase on first debate message.
        if (session.phase !== 'debate' && channel === 'forum' && session.messages.length > 0) {
            session.phase = 'debate';
        }
        const round = session.messages.filter((m) => m.channel === 'forum').length;
        const msg: CouncilMessage = {
            id: genId('cmsg'),
            sessionId,
            channel,
            authorId: author.id,
            toId,
            body,
            round,
            createdAt: now(),
        };
        session.messages.push(msg);
        if (session.phase === 'proposal') session.phase = 'debate';
        session.updatedAt = now();
        await this.repo.putSession(session);
        if (channel === 'whisper') {
            this.events.emit(EVENTS.COUNCIL_WHISPER, {
                sessionId,
                fromId: this.publicId(session, author.id),
                toId: this.publicId(session, toId as string),
            });
        } else {
            this.events.emit(EVENTS.COUNCIL_MESSAGE, {
                sessionId,
                authorId: this.publicId(session, author.id),
                round,
            });
        }
        return msg;
    }

    // ── Phase machine ──
    async advancePhase(sessionId: string): Promise<CouncilSession> {
        const session = await this.require(sessionId);
        const next: Record<string, string> = {
            proposal: session.config.factGathering ? 'fact_gathering' : 'debate',
            fact_gathering: 'debate',
            debate: 'consensus',
            consensus: 'completed',
        };
        const to = next[session.phase];
        if (!to) throw new Error(`Council ${sessionId} is terminal (${session.phase})`);
        session.phase = to as CouncilSession['phase'];
        if (to === 'completed') session.status = 'completed';
        session.updatedAt = now();
        await this.repo.putSession(session);
        this.events.emit(EVENTS.COUNCIL_PHASE, { sessionId, phase: session.phase });
        return session;
    }

    // ── Judging (multi-judge, blind-aware) ──
    async submitJudgeScore(
        sessionId: string,
        judgeId: string,
        winnerId: string,
        scores: Record<string, number> = {},
        rationale?: string,
    ): Promise<JudgeScore> {
        const session = await this.require(sessionId);
        this.assertPhase(session, ['debate', 'consensus']);
        const judge = session.judges.find((j) => j.id === judgeId);
        if (!judge) throw new Error(`Judge not found: ${judgeId}`);
        if (winnerId !== 'draw' && !session.participants.some((p) => p.id === winnerId)) {
            throw new Error(`Winner must be a participant id or 'draw'`);
        }
        const entry: JudgeScore = {
            judgeId,
            sessionId,
            winnerId,
            scores,
            rationale,
            blind: session.config.doubleBlind ?? false,
            createdAt: now(),
        };
        session.scores.push(entry);
        session.updatedAt = now();
        await this.repo.putSession(session);
        this.events.emit(EVENTS.COUNCIL_JUDGED, {
            sessionId,
            judgeId,
            winnerId: winnerId === 'draw' ? 'draw' : this.publicId(session, winnerId),
            blind: entry.blind ?? false,
        });
        return entry;
    }

    async castAudienceVote(sessionId: string, voterId: string, pickId: string): Promise<AudienceVote> {
        const session = await this.require(sessionId);
        if (!session.config.allowAudienceVoting) throw new Error('Audience voting is disabled for this session');
        this.assertPhase(session, ['debate', 'consensus']);
        const vote: AudienceVote = { id: genId('vote'), sessionId, voterId, pickId, createdAt: now() };
        session.votes.push(vote);
        session.updatedAt = now();
        await this.repo.putSession(session);
        this.events.emit(EVENTS.COUNCIL_VOTE, { sessionId, voterId, pickId });
        return vote;
    }

    async conclude(sessionId: string): Promise<CouncilSession> {
        const session = await this.require(sessionId);
        this.assertPhase(session, ['debate', 'consensus']);
        // Weighted judge tally; audience is advisory (tie-break only).
        const tally = new Map<string, number>();
        for (const s of session.scores) {
            const judge = session.judges.find((j) => j.id === s.judgeId);
            const w = judge?.weight ?? 1;
            tally.set(s.winnerId, (tally.get(s.winnerId) ?? 0) + w);
        }
        let winnerId = 'draw';
        let best = 0;
        for (const [id, v] of tally) {
            if (id !== 'draw' && v > best) {
                best = v;
                winnerId = id;
            }
        }
        if ((winnerId === 'draw' || best === 0) && session.votes.length > 0) {
            const counts = new Map<string, number>();
            for (const v of session.votes) counts.set(v.pickId, (counts.get(v.pickId) ?? 0) + 1);
            for (const [id, v] of counts) {
                if (v > best) {
                    best = v;
                    winnerId = id;
                }
            }
        }
        const winner = session.participants.find((p) => p.id === winnerId);
        const forumCount = session.messages.filter((m) => m.channel === 'forum').length;
        const whisperCount = session.messages.filter((m) => m.channel === 'whisper').length;
        session.winnerId = winnerId;
        session.summary =
            `Council on "${session.topic}": ${session.participants.length} participants, ` +
            `${forumCount} forum + ${whisperCount} whisper messages, ${session.facts.length} facts, ` +
            `${session.scores.length} judge ballot(s), ${session.votes.length} audience vote(s). ` +
            `Winner: ${winner ? winner.name : 'draw'}.`;
        session.phase = 'completed';
        session.status = 'completed';
        session.updatedAt = now();
        await this.repo.putSession(session);
        this.events.emit(EVENTS.COUNCIL_COMPLETED, {
            sessionId,
            winnerId: winnerId === 'draw' ? 'draw' : this.publicId(session, winnerId),
            judgeCount: session.scores.length,
            audienceCount: session.votes.length,
        });
        return session;
    }

    async abort(sessionId: string): Promise<void> {
        const session = await this.require(sessionId);
        session.phase = 'aborted';
        session.status = 'aborted';
        session.updatedAt = now();
        await this.repo.putSession(session);
        this.events.emit(EVENTS.COUNCIL_ABORTED, { sessionId });
    }

    // ── Lenses / polarities ──
    listLenses(): Array<{ id: string; name: string; prompt: string }> {
        return COUNCIL_LENSES.map((l) => ({ id: l.id, name: l.name, prompt: l.prompt }));
    }

    listPolarities(): Array<{ id: string; name: string; sides: string[] }> {
        return COUNCIL_POLARITIES.map((p) => ({ id: p.id, name: p.name, sides: [...p.sides] }));
    }

    promptFor(participant: CouncilParticipant): string {
        return buildParticipantPrompt({
            name: participant.name,
            kind: participant.kind,
            lensId: participant.lensId,
            polarityId: participant.polarityId,
        });
    }

    // ── internals ──
    private async require(id: string): Promise<CouncilSession> {
        const s = await this.repo.getSession(id);
        if (!s) throw new Error(`Council session not found: ${id}`);
        return s;
    }

    private requireMember(session: CouncilSession, id: string): CouncilParticipant {
        const m = session.participants.find((p) => p.id === id);
        if (!m) throw new Error(`Council member not found: ${id}`);
        return m;
    }

    private assertPhase(session: CouncilSession, allowed: string[]): void {
        if (session.status !== 'running') throw new Error(`Council ${session.id} is ${session.status}`);
        if (!allowed.includes(session.phase)) {
            throw new Error(`Phase ${session.phase} does not allow this action (allowed: ${allowed.join(', ')})`);
        }
    }

    /** Double-blind: expose alias to judges/audience, real id otherwise. */
    private publicId(session: CouncilSession, memberId: string): string {
        if (session.config.doubleBlind && session.aliases?.[memberId]) {
            return session.aliases[memberId] as string;
        }
        return memberId;
    }
}
