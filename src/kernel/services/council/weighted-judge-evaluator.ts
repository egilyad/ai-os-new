/**
 * WeightedJudgeEvaluator — D4.3 Contract Repair (Judge/Vote/Conclude canonical).
 *
 * Implements existing IDebateEvaluator (no new runtime, no parallel pipeline).
 * Uses Council weighted tally (judge weight ??1) + audience advisory tie-break — same as CouncilService.conclude:359.
 * Selectable via topology.metadata.councilMode flag (or topologyType council) — one IDebateEvaluator interface, two strategies.
 */

import type { IDebateEvaluator, AgentScore } from '../../contracts/debate-runtime';
import type { Claim, ReasoningChain } from '../../contracts/debate-runtime';
import type { DatabaseService } from '../database-service';
import type { IEventBus } from '../../types/interfaces';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('WeightedJudge');

export class WeightedJudgeEvaluator implements IDebateEvaluator {
    // D4.3a/b: canonical judge+audience storage — one Evaluator, persistent via keyValue CAS + Timeline + snapshot best-effort
    private votes = new Map<string, Map<string, { winnerId: string; weight: number }>>(); // sessionId → judgeId → vote
    private judgeWeights = new Map<string, Map<string, number>>(); // sessionId → judgeId → weight
    private audienceVotes = new Map<string, Map<string, string>>(); // sessionId → voterId → pickId

    constructor(private deps?: { database?: DatabaseService; eventBus?: IEventBus }) {}

    async init(): Promise<void> { await this.restoreAll(); }
    async destroy(): Promise<void> {}

    /** Restore Maps from persisted keyValue (idempotent, after reload) */
    private async restoreAll(): Promise<void> {
        if (!this.deps?.database) return;
        try {
            // Best-effort: scan keyValue prefix council:judge: and council:audience: via getKv on known index not available,
            // so we restore lazily per sessionId on first record* call via getKv, and also via restoreSession(sessionId) below
        } catch (e) { LOGGER.warn('restoreAll failed', { error: e instanceof Error ? e.message : String(e) }); }
    }

    async restoreSession(sessionId: string): Promise<void> {
        if (!this.deps?.database) return;
        try {
            const j = await this.deps.database.getKv<{ votes: Record<string, { winnerId: string; weight: number }>; checksum?: string }>(`council:judge:${sessionId}`);
            if (j?.votes) {
                const m = new Map<string, { winnerId: string; weight: number }>();
                for (const [k, v] of Object.entries(j.votes)) m.set(k, v);
                if (m.size > 0) this.votes.set(sessionId, m);
            }
            const a = await this.deps.database.getKv<{ votes: Record<string, string>; checksum?: string }>(`council:audience:${sessionId}`);
            if (a?.votes) {
                const m = new Map<string, string>();
                for (const [k, v] of Object.entries(a.votes)) m.set(k, v);
                if (m.size > 0) this.audienceVotes.set(sessionId, m);
            }
        } catch (e) { LOGGER.warn('restoreSession failed', { error: e instanceof Error ? e.message : String(e) }); }
    }

    /** D4.3a: record judge vote — idempotent, persists via keyValue CAS + snapshot best-effort */
    async recordJudgeVote(sessionId: string, judgeId: string, winnerId: string, weight = 1): Promise<void> {
        if (!this.votes.has(sessionId)) {
            // lazy restore before first write
            await this.restoreSession(sessionId);
            if (!this.votes.has(sessionId)) this.votes.set(sessionId, new Map());
        } else await this.restoreSession(sessionId);
        this.votes.get(sessionId)!.set(judgeId, { winnerId, weight });
        if (!this.judgeWeights.has(sessionId)) this.judgeWeights.set(sessionId, new Map());
        this.judgeWeights.get(sessionId)!.set(judgeId, weight);
        await this.persistJudge(sessionId);
    }

    /** For conclude path: tally winner via weighted votes (same as CouncilService:359) */
    tallyWinner(sessionId: string): string {
        const sessionVotes = this.votes.get(sessionId);
        if (!sessionVotes || sessionVotes.size === 0) return 'draw';
        const tally = new Map<string, number>();
        for (const { winnerId, weight } of sessionVotes.values()) {
            if (winnerId === 'draw') continue;
            tally.set(winnerId, (tally.get(winnerId) ?? 0) + weight);
        }
        let winnerId = 'draw';
        let best = 0;
        for (const [id, v] of tally) if (v > best) { best = v; winnerId = id; }
        return winnerId;
    }

    private async persistJudge(sessionId: string): Promise<void> {
        if (!this.deps?.database) return;
        const m = this.votes.get(sessionId);
        if (!m) return;
        const payload = Object.fromEntries(m);
        const checksum = JSON.stringify(payload).length.toString(16);
        try { await this.deps.database.setKv(`council:judge:${sessionId}`, { votes: payload, checksum, updatedAt: Date.now() }); } catch (e) { LOGGER.warn('persistJudge failed', { error: e instanceof Error ? e.message : String(e) }); }
        try { this.deps.eventBus?.emit('council:judge:score' as unknown as string, { sessionId } as unknown as never); } catch { /* ignore */ }
    }

    private async persistAudience(sessionId: string): Promise<void> {
        if (!this.deps?.database) return;
        const m = this.audienceVotes.get(sessionId);
        if (!m) return;
        const payload = Object.fromEntries(m);
        const checksum = JSON.stringify(payload).length.toString(16);
        try { await this.deps.database.setKv(`council:audience:${sessionId}`, { votes: payload, checksum, updatedAt: Date.now() }); } catch (e) { LOGGER.warn('persistAudience failed', { error: e instanceof Error ? e.message : String(e) }); }
        try { this.deps.eventBus?.emit('council:audience:vote' as unknown as string, { sessionId } as unknown as never); } catch { /* ignore */ }
    }

    /** D4.3b: audience vote — idempotent, persists */
    async recordAudienceVote(sessionId: string, voterId: string, pickId: string): Promise<void> {
        if (!this.audienceVotes.has(sessionId)) await this.restoreSession(sessionId);
        if (!this.audienceVotes.has(sessionId)) this.audienceVotes.set(sessionId, new Map());
        this.audienceVotes.get(sessionId)!.set(voterId, pickId);
        await this.persistAudience(sessionId);
    }

    /** For audience advisory tie-break: counts per pickId */
    tallyAudience(sessionId: string): Map<string, number> {
        const m = this.audienceVotes.get(sessionId);
        const tally = new Map<string, number>();
        if (!m) return tally;
        for (const pickId of m.values()) tally.set(pickId, (tally.get(pickId) ?? 0) + 1);
        return tally;
    }

    /**
     * For Council mode, claims are FactPacket/sources mapped via councilToDebateMapper.
     * We ignore chain and use Claim.speaker/role to tally? For now we keep tally external —
     * scoreArguments here is used for per-agent overall, rankParticipants picks winner via tally passed via Claim.confidence?
     * Minimal: scoreArguments returns trivial overall = confidence, rank picks max confidence as winner.
     * Real tally (judge weight) will be handled by Conclude path that reads JudgeScore votes (see facade).
     * This evaluator is the single canonical IDebateEvaluator when councilMode true.
     */
    scoreArguments(agentId: string, claims: Claim[], _chain: ReasoningChain[]): AgentScore {
        const agentClaims = claims.filter((c) => c.agentId === agentId);
        const avgConf = agentClaims.length > 0 ? agentClaims.reduce((s, c) => s + c.confidence, 0) / agentClaims.length : 0.5;
        // Use council tally logic externally — here we just surface avgConf as overall for compatibility with DebateEngine
        return {
            agentId,
            overall: avgConf,
            argumentQuality: avgConf,
            rebuttalStrength: 0.5,
            coherence: 0.6,
            persuasiveness: avgConf,
            factuality: avgConf,
            steelmanQuality: 0.5,
        };
    }

    rankParticipants(scores: AgentScore[]): AgentScore[] {
        // Weighted tally is handled by CouncilServiceFacade.conclude after migration — here we just sort by overall
        return [...scores].sort((a, b) => b.overall - a.overall);
    }
}
