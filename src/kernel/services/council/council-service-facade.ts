/**
 * CouncilService Facade — D4.2 (minimal, no mass migration).
 *
 * Wraps old CouncilService (C, 5 phases, 3 tables) → delegates to DebateEngine A (canonical)
 * when councilMode session exists in DebateStore, otherwise fallback to old repository (read-only rollback).
 * Pure mapper (council-to-debate-mapper.ts) used — no side effects in mapper, save is separate.
 * Old persistence not destroyed — kept for rollback until D4.5.
 */

import type { ICouncilService, CreateCouncilInput } from '../../contracts/council';
import type { CouncilSession } from '../../types/council-types';
import type { CouncilService } from './council-service';
import type { IDebateEngine } from '../../contracts/debate-runtime';
import { councilToDebateSnapshot } from './council-to-debate-mapper';
import { WeightedJudgeEvaluator } from './weighted-judge-evaluator';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('CouncilFacade');

export class CouncilServiceFacade implements ICouncilService {
    private weightedJudge: WeightedJudgeEvaluator;

    constructor(
        private old: CouncilService,
        private debateEngine?: IDebateEngine,
        weightedJudge?: WeightedJudgeEvaluator,
        private database?: import('../database-service').DatabaseService,
        private eventBus?: import('../../types/interfaces').IEventBus,
    ) {
        this.weightedJudge = weightedJudge ?? new WeightedJudgeEvaluator();
    }

    async init(): Promise<void> { await this.old.init(); }
    async destroy(): Promise<void> { await this.old.destroy(); }
    setLlmPort(llm: import('../../contracts/council').ICouncilLlmPort): void { this.old.setLlmPort(llm); }
    listLenses() { return this.old.listLenses(); }
    listPolarities() { return this.old.listPolarities(); }
    promptFor(p: import('../../types/council-types').CouncilParticipant) { return this.old.promptFor(p); }

    async createSession(input: CreateCouncilInput): Promise<CouncilSession> {
        // Keep old persistence as primary for D4.2 (no mass migration yet) — also create Debate snapshot for new canonical path if engine available
        const session = await this.old.createSession(input);
        if (this.debateEngine) {
            try {
                const snapshot = councilToDebateSnapshot(session);
                // D4.3 P0 ID: canonical ID same — use createSessionWithId (minimal extension, no new runtime)
                const debateId = (this.debateEngine as unknown as { createSessionWithId?: (id: string, t: unknown, topic: string, parts: unknown[], lang?: string) => string }).createSessionWithId
                    ? (this.debateEngine as unknown as { createSessionWithId: (id: string, t: unknown, topic: string, parts: unknown[], lang?: string) => string }).createSessionWithId(session.id, snapshot.topology, snapshot.topic, [...(snapshot.participants ?? [])], snapshot.language)
                    : this.debateEngine.createSession(snapshot.topology, snapshot.topic, [...(snapshot.participants ?? [])], snapshot.language);
                LOGGER.info('CouncilFacade', 'facade: also created Debate snapshot for council (councilMode)', { councilId: session.id, debateId });
            } catch (e) {
                LOGGER.warn('CouncilFacade', 'facade: Debate snapshot create failed, fallback to old only (rollback-safe)', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return session;
    }

    async getSession(id: string): Promise<CouncilSession | null> {
        const base = await this.old.getSession(id);
        if (!base) return null;
        // D4.3a+b + D4.5a: merge canonical judge + audience votes persisted via keyValue (restore after reload)
        if (this.debateEngine) {
            try {
                await this.weightedJudge.restoreSession(id);
                const sessionVotes = (this.weightedJudge as unknown as { votes: Map<string, Map<string, { winnerId: string; weight: number }>> }).votes?.get(id);
                const audienceMap = (this.weightedJudge as unknown as { audienceVotes: Map<string, Map<string, string>> }).audienceVotes?.get(id);
                let mergedScores = base.scores;
                let mergedVotes = base.votes;
                if (sessionVotes) {
                    mergedScores = [...base.scores];
                    for (const [judgeId, vote] of sessionVotes) {
                        if (!mergedScores.some((s) => s.judgeId === judgeId && s.winnerId === vote.winnerId)) {
                            mergedScores.push({
                                judgeId,
                                sessionId: id,
                                winnerId: vote.winnerId,
                                scores: {},
                                blind: base.config.doubleBlind ?? false,
                                createdAt: Date.now(),
                            });
                        }
                    }
                }
                if (audienceMap) {
                    mergedVotes = [...base.votes];
                    for (const [voterId, pickId] of audienceMap) {
                        if (!mergedVotes.some((v) => v.voterId === voterId && v.pickId === pickId)) {
                            mergedVotes.push({ id: `vote-${voterId}-${id}-${Date.now()}`, sessionId: id, voterId, pickId, createdAt: Date.now() });
                        }
                    }
                }
                if (sessionVotes || audienceMap) return { ...base, scores: mergedScores, votes: mergedVotes };
            } catch { /* fallback */ }
        }
        return base;
    }

    async listSessions() { return this.old.listSessions(); }
    async submitProposal(sessionId: string, authorId: string, stance: string) { return this.old.submitProposal(sessionId, authorId, stance); }
    async submitFact(sessionId: string, authorId: string, claim: string, verdict?: import('../../types/council-types').FactPacket['verdict'], sources?: string[]) { return this.old.submitFact(sessionId, authorId, claim, verdict, sources); }
    async postMessage(sessionId: string, authorId: string, body: string, channel?: 'forum'|'whisper', toId?: string) { return this.old.postMessage(sessionId, authorId, body, channel, toId); }
    async advancePhase(sessionId: string) { return this.old.advancePhase(sessionId); }
    async submitJudgeScore(sessionId: string, judgeId: string, winnerId: string, scores?: Record<string, number>, rationale?: string) {
        // D4.3a: canonical path → DebateEngine + WeightedJudgeEvaluator (councilMode), old Council judge persistence NOT called
        if (this.debateEngine) {
            try {
                // Resolve judge weight from old session (read-only) for tally
                const oldSession = await this.old.getSession(sessionId);
                const weight = oldSession?.judges.find((j) => j.id === judgeId)?.weight ?? 1;
                this.weightedJudge.recordJudgeVote(sessionId, judgeId, winnerId, weight);
                const entry: import('../../types/council-types').JudgeScore = {
                    judgeId,
                    sessionId,
                    winnerId,
                    scores: scores ?? {},
                    rationale,
                    blind: oldSession?.config.doubleBlind ?? false,
                    createdAt: Date.now(),
                };
                // D4.4a persistence: TimelineEntry + keyValue CAS + DebateStore snapshot (no new table, not old councilVotes)
                try {
                    if (this.eventBus) {
                        (this.eventBus as unknown as { emit: (n: string, p: unknown) => void }).emit('council:judge:score', { sessionId, judgeId, winnerId });
                    }
                    if (this.database) {
                        const key = `council:judge:${sessionId}`;
                        const votesMap = (this.weightedJudge as unknown as { votes: Map<string, Map<string, { winnerId: string; weight: number }>> }).votes.get(sessionId);
                        const payload = votesMap ? Object.fromEntries(votesMap) : {};
                        const checksum = JSON.stringify(payload).length.toString(16);
                        await this.database.setKv(key, { votes: payload, checksum, updatedAt: Date.now() });
                    }
                    if (this.debateEngine) {
                        // Trigger DebateStore snapshot version CAS via saveSnapshot (fire-and-forget, best-effort)
                        this.debateEngine.saveSnapshot(sessionId).catch(() => {});
                    }
                } catch (e) {
                    LOGGER.warn('CouncilFacade', 'facade judge persistence best-effort failed', { error: e instanceof Error ? e.message : String(e) });
                }
                LOGGER.info('CouncilFacade', 'facade submitJudgeScore → canonical WeightedJudgeEvaluator', { sessionId, judgeId, winnerId });
                return entry;
            } catch (e) {
                LOGGER.warn('CouncilFacade', 'facade submitJudgeScore canonical failed, fallback to old (rollback-safe)', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return this.old.submitJudgeScore(sessionId, judgeId, winnerId, scores, rationale);
    }
    async castAudienceVote(sessionId: string, voterId: string, pickId: string) {
        // D4.3b + D4.4b: canonical audience vote → WeightedJudgeEvaluator + Timeline + keyValue + snapshot
        if (this.debateEngine) {
            try {
                const oldSession = await this.old.getSession(sessionId);
                if (oldSession && !oldSession.config.allowAudienceVoting) throw new Error('Audience voting is disabled for this session');
                this.weightedJudge.recordAudienceVote(sessionId, voterId, pickId);
                const vote: import('../../types/council-types').AudienceVote = { id: `vote-${voterId}-${sessionId}-${Date.now()}`, sessionId, voterId, pickId, createdAt: Date.now() };
                try {
                    if (this.eventBus) {
                        (this.eventBus as unknown as { emit: (n: string, p: unknown) => void }).emit('council:audience:vote', { sessionId, voterId, pickId });
                    }
                    if (this.database) {
                        const key = `council:audience:${sessionId}`;
                        const map = (this.weightedJudge as unknown as { audienceVotes: Map<string, Map<string, string>> }).audienceVotes.get(sessionId);
                        const payload = map ? Object.fromEntries(map) : {};
                        const checksum = JSON.stringify(payload).length.toString(16);
                        await this.database.setKv(key, { votes: payload, checksum, updatedAt: Date.now() });
                    }
                    if (this.debateEngine) {
                        this.debateEngine.saveSnapshot(sessionId).catch(() => {});
                    }
                } catch (e) {
                    LOGGER.warn('CouncilFacade', 'facade audience persistence best-effort failed', { error: e instanceof Error ? e.message : String(e) });
                }
                return vote;
            } catch (e) {
                if (e instanceof Error && e.message.includes('disabled')) throw e;
            }
        }
        return this.old.castAudienceVote(sessionId, voterId, pickId);
    }
    async conclude(sessionId: string): Promise<CouncilSession> {
        // D4.3c: canonical conclude via WeightedJudgeEvaluator (same tally as old CouncilService:359) — old tally NOT called when engine exists
        if (this.debateEngine) {
            try {
                const base = await this.old.getSession(sessionId);
                if (!base) throw new Error(`Council session not found: ${sessionId}`);
                if (base.status !== 'running') throw new Error(`Council ${sessionId} is ${base.status}`);
                if (!['debate', 'consensus'].includes(base.phase)) throw new Error(`Phase ${base.phase} does not allow conclude`);

                // Canonical tally: weighted judges from evaluator + audience advisory (same as old CouncilService:359)
                let winnerId = this.weightedJudge.tallyWinner(sessionId);
                let best = 0;
                // Determine best weight for tie-break
                if (winnerId !== 'draw') {
                    const tally = new Map<string, number>();
                    const votes = (this.weightedJudge as unknown as { votes: Map<string, Map<string, { winnerId: string; weight: number }>> }).votes.get(sessionId);
                    if (votes) for (const { winnerId: wid, weight } of votes.values()) if (wid !== 'draw') tally.set(wid, (tally.get(wid) ?? 0) + weight);
                    best = tally.get(winnerId) ?? 0;
                }
                // Audience advisory tie-break (same as old:373)
                const audienceTally = this.weightedJudge.tallyAudience(sessionId);
                if ((winnerId === 'draw' || best === 0) && audienceTally.size > 0) {
                    for (const [id, v] of audienceTally) if (v > best) { best = v; winnerId = id; }
                }
                // Fallback to old votes if evaluator empty (read-only old still has some votes)
                if ((winnerId === 'draw' || best === 0) && (base.scores.length > 0 || base.votes.length > 0)) {
                    // Use old base scores/votes for backward compat when evaluator empty (before D4.3a/b votes)
                    const oldTally = new Map<string, number>();
                    for (const s of base.scores) {
                        const w = base.judges.find((j) => j.id === s.judgeId)?.weight ?? 1;
                        oldTally.set(s.winnerId, (oldTally.get(s.winnerId) ?? 0) + w);
                    }
                    let oldWinner = 'draw'; let oldBest = 0;
                    for (const [id, v] of oldTally) if (id !== 'draw' && v > oldBest) { oldBest = v; oldWinner = id; }
                    if ((oldWinner === 'draw' || oldBest === 0) && base.votes.length > 0) {
                        const counts = new Map<string, number>();
                        for (const v of base.votes) counts.set(v.pickId, (counts.get(v.pickId) ?? 0) + 1);
                        for (const [id, v] of counts) if (v > oldBest) { oldBest = v; oldWinner = id; }
                    }
                    if (oldBest > best) { winnerId = oldWinner; best = oldBest; }
                }

                const winner = base.participants.find((p) => p.id === winnerId);
                const forumCount = base.messages.filter((m) => m.channel === 'forum').length;
                const whisperCount = base.messages.filter((m) => m.channel === 'whisper').length;
                const summary =
                    `Council on "${base.topic}": ${base.participants.length} participants, ` +
                    `${forumCount} forum + ${whisperCount} whisper messages, ${base.facts.length} facts, ` +
                    `${(this.weightedJudge as unknown as { votes: Map<string, Map<string, unknown>> }).votes.get(sessionId)?.size ?? base.scores.length} judge ballot(s), ${(this.weightedJudge as unknown as { audienceVotes: Map<string, Map<string, unknown>> }).audienceVotes.get(sessionId)?.size ?? base.votes.length} audience vote(s). ` +
                    `Winner: ${winner ? winner.name : 'draw'}. (canonical via WeightedJudgeEvaluator)`;

                // Persist canonical result to old councilSessions for UI (read-only rollback kept, but tally via evaluator, not old tally)
                // We use old repository directly to avoid old tally re-run, but still write to councilSessions (old persistence as mirror, not second judging)
                // For D4.3c we keep old persistence as mirror (not second judging) — DebateStore canonical result will be D4.5
                const updated: CouncilSession = { ...base, winnerId, summary, phase: 'completed', status: 'completed', updatedAt: Date.now() };
                // Bypass old tally: write directly via repository (old CouncilService.conclude would re-tally)
                const repo = (this.old as unknown as { repo: import('../../dal/council-repository').CouncilRepository }).repo;
                if (repo) await repo.putSession(updated);
                else await this.old.conclude(sessionId); // fallback

                // Emit same event as old CouncilService.conclude
                try {
                    const { EVENTS } = await import('../../events/event-names');
                    const bus = (this.old as unknown as { events: import('../../types/interfaces').IEventBus }).events;
                    if (bus) bus.emit(EVENTS.COUNCIL_COMPLETED, { sessionId, winnerId,                     judgeCount: (this.weightedJudge as unknown as { votes: Map<string, Map<string, unknown>> }).votes.get(sessionId)?.size ?? 0, audienceCount: (this.weightedJudge as unknown as { audienceVotes: Map<string, Map<string, unknown>> }).audienceVotes.get(sessionId)?.size ?? 0 });
                } catch { /* ignore */ }

                LOGGER.info('CouncilFacade', 'facade conclude → canonical WeightedJudgeEvaluator tally', { sessionId, winnerId });
                return updated;
            } catch (e) {
                LOGGER.warn('CouncilFacade', 'facade conclude canonical failed, fallback to old (rollback-safe)', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return this.old.conclude(sessionId);
    }
    async abort(sessionId: string) { return this.old.abort(sessionId); }
}
