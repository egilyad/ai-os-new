/**
 * CouncilRepository — DAL for Council persistence (Wave 2).
 *
 * Dexie v24 tables:
 *   - councilSessions: 'id, phase, status, createdAt'
 *   - councilMessages: 'id, sessionId, channel, authorId, createdAt'
 *   - councilVotes: 'id, sessionId, kind, voterId, createdAt'
 *
 * Sessions embed participants/judges/aliases; messages/votes live in their
 * own tables and are re-attached on read (single aggregate root: session).
 */
import type { DatabaseService } from '../services/database-service';
import type {
    AudienceVote,
    CouncilMessage,
    CouncilSession,
    CouncilSessionRecord,
    FactPacket,
    JudgeScore,
} from '../types/council-types';

function hashClaim(claim: string): string {
    let h = 2166136261;
    for (let i = 0; i < claim.length; i++) h ^= claim.charCodeAt(i), h = Math.imul(h, 16777619) >>> 0;
    return `fact:${h.toString(16).padStart(8, '0')}`;
}

export class CouncilRepository {
    constructor(private db: DatabaseService) {}

    async putSession(session: CouncilSession): Promise<void> {
        const { facts, messages, scores, votes, ...rest } = session;
        const record: CouncilSessionRecord = { ...rest };
        await this.db.councilSessions.put(record);
        // Facts are stored as vote-kind rows so the audit trail is uniform.
        // D2.3: fix truncation — pickId is stable hash, full claim in payload.claim
        for (const f of facts) {
            await this.db.councilVotes.put({
                id: f.id,
                sessionId: f.sessionId,
                kind: 'fact',
                voterId: f.authorId,
                pickId: hashClaim(f.claim),
                payload: {
                    claim: f.claim,
                    verdict: f.verdict,
                    sources: f.sources ?? [],
                    createdAt: f.createdAt,
                },
                createdAt: f.createdAt,
            });
        }
        for (const m of messages) {
            await this.db.councilMessages.put({ ...m });
        }
        for (const s of scores) {
            await this.db.councilVotes.put({
                id: `judge-${s.judgeId}-${s.sessionId}-${s.createdAt}`,
                sessionId: s.sessionId,
                kind: 'judge',
                voterId: s.judgeId,
                pickId: s.winnerId,
                payload: { scores: s.scores, rationale: s.rationale, blind: s.blind },
                createdAt: s.createdAt,
            });
        }
        for (const v of votes) {
            await this.db.councilVotes.put({
                id: v.id,
                sessionId: v.sessionId,
                kind: 'audience',
                voterId: v.voterId,
                pickId: v.pickId,
                createdAt: v.createdAt,
            });
        }
    }

    async getSession(id: string): Promise<CouncilSession | null> {
        const rec = await this.db.councilSessions.get(id);
        if (!rec) return null;
        const [msgRows, voteRows] = await Promise.all([
            this.db.councilMessages.where('sessionId').equals(id).toArray(),
            this.db.councilVotes.where('sessionId').equals(id).toArray(),
        ]);
        msgRows.sort((a, b) => a.createdAt - b.createdAt);
        const messages: CouncilMessage[] = msgRows.map((m) => ({ ...m }));
        const facts: FactPacket[] = voteRows
            .filter((v) => v.kind === 'fact')
            .map((v) => {
                const payload = v.payload as { claim?: string; verdict?: FactPacket['verdict']; sources?: string[] } | undefined;
                return {
                    id: v.id,
                    sessionId: v.sessionId,
                    authorId: v.voterId,
                    claim: payload?.claim ?? v.pickId,
                    verdict: payload?.verdict ?? 'unverifiable',
                    sources: payload?.sources ?? [],
                    createdAt: v.createdAt,
                };
            });
        const scores: JudgeScore[] = voteRows
            .filter((v) => v.kind === 'judge')
            .map((v) => {
                const p = (v.payload ?? {}) as {
                    scores?: Record<string, number>;
                    rationale?: string;
                    blind?: boolean;
                };
                return {
                    judgeId: v.voterId,
                    sessionId: v.sessionId,
                    winnerId: v.pickId,
                    scores: p.scores ?? {},
                    rationale: p.rationale,
                    blind: p.blind,
                    createdAt: v.createdAt,
                };
            });
        const votes: AudienceVote[] = voteRows
            .filter((v) => v.kind === 'audience')
            .map((v) => ({
                id: v.id,
                sessionId: v.sessionId,
                voterId: v.voterId,
                pickId: v.pickId,
                createdAt: v.createdAt,
            }));
        return { ...rec, facts, messages, scores, votes };
    }

    async listSessions(): Promise<CouncilSession[]> {
        const rows = await this.db.councilSessions.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        const out: CouncilSession[] = [];
        for (const r of rows) {
            const full = await this.getSession(r.id);
            if (full) out.push(full);
        }
        return out;
    }

    async deleteSession(id: string): Promise<void> {
        const [msgs, votes] = await Promise.all([
            this.db.councilMessages.where('sessionId').equals(id).toArray(),
            this.db.councilVotes.where('sessionId').equals(id).toArray(),
        ]);
        await Promise.all([
            ...msgs.map((m) => this.db.councilMessages.delete(m.id)),
            ...votes.map((v) => this.db.councilVotes.delete(v.id)),
        ]);
        await this.db.councilSessions.delete(id);
    }

    async clear(): Promise<void> {
        await this.db.councilVotes.clear();
        await this.db.councilMessages.clear();
        await this.db.councilSessions.clear();
    }
}
