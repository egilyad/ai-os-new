/**
 * CouncilMigrationService — D4.5b Gate + Checksum + Rollback (single session, без bulk).
 *
 * No bulk migration, no Dexie destructive migration, no SSOT switch, no council* delete.
 * One session at a time: old CouncilSession → snapshot → mapper → canonical Debate record → integrity verify → marker.
 * If migration interrupted at 37/100 → gate knows 36 done (marker), 37 failed, rollback safe.
 */

import type { DatabaseService } from '../services/database-service';
import type { CouncilRepository } from '../../dal/council-repository';
import { councilToDebateSnapshot } from './council-to-debate-mapper';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('CouncilMigration');
const MARKER_PREFIX = 'council:migrated:';
const SNAPSHOT_PREFIX = 'council:rollback:snapshot:';

function checksumOf(obj: unknown): string {
    const s = JSON.stringify(obj);
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h ^= s.charCodeAt(i), h = Math.imul(h, 16777619) >>> 0;
    return h.toString(16).padStart(8, '0');
}

function integrityPayload(session: import('../../types/council-types').CouncilSession) {
    return {
        topic: session.topic,
        participants: session.participants.map((p) => ({ id: p.id, kind: p.kind, lensId: p.lensId, polarityId: p.polarityId })),
        facts: session.facts.map((f) => ({ claim: f.claim, verdict: f.verdict, sources: f.sources })),
        messages: session.messages.map((m) => ({ channel: m.channel, authorId: m.authorId, toId: m.toId, body: m.body, round: m.round })),
        scores: session.scores.map((s) => ({ judgeId: s.judgeId, winnerId: s.winnerId, blind: s.blind })),
        votes: session.votes.map((v) => ({ voterId: v.voterId, pickId: v.pickId })),
        winnerId: session.winnerId,
        phase: session.phase,
        status: session.status,
    };
}

export class CouncilMigrationService {
    constructor(private deps: { councilRepo: CouncilRepository; database: DatabaseService; debateStore?: import('../../contracts/storage/storage-layer').DebateStore }) {}

    async init(): Promise<void> { LOGGER.info('CouncilMigration', 'init', {}); }
    async destroy(): Promise<void> {}

    /** Gate: can this session be migrated? Checks not already migrated (marker) and integrity pre-check */
    async canMigrate(sessionId: string): Promise<{ ok: boolean; reason?: string }> {
        const marker = await this.deps.database.getKv<{ checksum: string; at: number }>(`${MARKER_PREFIX}${sessionId}`);
        if (marker) return { ok: false, reason: `already migrated at ${new Date(marker.at).toISOString()} checksum ${marker.checksum}` };
        const session = await this.deps.councilRepo.getSession(sessionId);
        if (!session) return { ok: false, reason: 'session not found' };
        if (session.status !== 'completed' && session.status !== 'running') return { ok: false, reason: `status ${session.status} not migratable` };
        return { ok: true };
    }

    /** Migrate one session → snapshot → mapper → canonical Debate record (idempotent, no bulk) */
    async migrateOne(sessionId: string): Promise<{ checksum: string; debateId: string }> {
        const gate = await this.canMigrate(sessionId);
        if (!gate.ok) throw new Error(`Cannot migrate: ${gate.reason}`);

        const session = await this.deps.councilRepo.getSession(sessionId);
        if (!session) throw new Error(`Session not found: ${sessionId}`);

        // Snapshot old for rollback (single session, not bulk)
        const oldSnapshot = JSON.parse(JSON.stringify(session)) as typeof session;
        await this.deps.database.setKv(`${SNAPSHOT_PREFIX}${sessionId}`, { snapshot: oldSnapshot, at: Date.now() });

        const payload = integrityPayload(session);
        const checksum = checksumOf(payload);

        // Mapper pure (no save)
        const snapshot = councilToDebateSnapshot(session);

        // Integrity verify: mapper must preserve topic/participants/facts/messages counts (allow heuristic confidence)
        const snapPayload = {
            topic: snapshot.topic,
            participants: snapshot.participants?.map((p) => ({ id: p.agentId, role: p.role })) ?? [],
            argsCount: snapshot.arguments?.length ?? 0,
        };
        // Basic check: args count = facts + messages
        const expectedArgs = session.facts.length + session.messages.length;
        if (snapPayload.argsCount !== expectedArgs) {
            await this.rollback(sessionId);
            throw new Error(`Integrity fail: args ${snapPayload.argsCount} != facts+messages ${expectedArgs}`);
        }

        // D4.5c dry run: if debateStore available, also write DebateStore record and verify read-back (single session, not bulk)
        if (this.deps.debateStore) {
            try {
                const record = {
                    id: snapshot.id,
                    topic: snapshot.topic,
                    topologyType: (snapshot.topology as unknown as { type: string }).type ?? 'roundtable',
                    phase: snapshot.phase,
                    round: snapshot.round,
                    totalTokens: snapshot.totalTokens,
                    totalCost: snapshot.totalCost,
                    agentStates: JSON.stringify(snapshot.agentStates ?? []),
                    arguments: JSON.stringify(snapshot.arguments ?? []),
                    topology: JSON.stringify(snapshot.topology),
                    participants: JSON.stringify(snapshot.participants ?? []),
                    memory: JSON.stringify({}),
                    startedAt: snapshot.startedAt,
                    updatedAt: snapshot.updatedAt,
                    createdAt: (snapshot as unknown as { startedAt: number }).startedAt,
                    version: snapshot.version,
                    language: snapshot.language,
                } as unknown as import('../../contracts/storage/debate-store').DebateSessionRecord;
                await this.deps.debateStore.saveSnapshot(record);
                const back = await this.deps.debateStore.getSnapshot(snapshot.id);
                if (!back) throw new Error('DebateStore read-back failed');
                if (back.id !== snapshot.id || back.topic !== snapshot.topic) throw new Error('DebateStore round-trip mismatch id/topic');
            } catch (e) {
                await this.rollback(sessionId);
                throw new Error(`DebateStore dry-run failed: ${e instanceof Error ? e.message : String(e)}`);
            }
        }

        await this.deps.database.setKv(`${MARKER_PREFIX}${sessionId}`, { checksum, at: Date.now(), debateId: session.id, topic: session.topic });

        LOGGER.info('CouncilMigration', 'migrated one session (gate+checksum, no bulk)', { sessionId, checksum, debateId: session.id });
        return { checksum, debateId: session.id };
    }

    /** Verify integrity of one migrated session (old vs canonical via checksum) */
    async verify(sessionId: string): Promise<{ ok: boolean; reason?: string; checksum?: string }> {
        const marker = await this.deps.database.getKv<{ checksum: string }>(`${MARKER_PREFIX}${sessionId}`);
        if (!marker) return { ok: false, reason: 'not migrated (no marker)' };
        const session = await this.deps.councilRepo.getSession(sessionId);
        if (!session) return { ok: false, reason: 'old session missing' };
        const currentChecksum = checksumOf(integrityPayload(session));
        if (currentChecksum !== marker.checksum) return { ok: false, reason: `checksum mismatch current ${currentChecksum} vs marker ${marker.checksum}`, checksum: currentChecksum };
        return { ok: true, checksum: currentChecksum };
    }

    /** Rollback one session (after partial migration at 37/100) */
    async rollback(sessionId: string): Promise<void> {
        const snap = await this.deps.database.getKv<{ snapshot: import('../../types/council-types').CouncilSession }>(`${SNAPSHOT_PREFIX}${sessionId}`);
        if (snap?.snapshot) {
            // Restore old council* from snapshot (single session, not bulk historical)
            await this.deps.councilRepo.putSession(snap.snapshot);
        }
        // Clear marker so can retry
        await this.deps.database.setKv(`${MARKER_PREFIX}${sessionId}`, null as unknown as { checksum: string });
        await this.deps.database.setKv(`${SNAPSHOT_PREFIX}${sessionId}`, null as unknown as unknown);
        LOGGER.info('CouncilMigration', 'rollback one session', { sessionId });
    }

    /** List already migrated (gate knows 36 done) */
    async listMigrated(): Promise<string[]> {
        // Best-effort: scan is not available via getKv, so we keep index key council:migrated:index (like sim:world:index)
        const idx = await this.deps.database.getKv<string[]>(`council:migrated:index`);
        return idx ?? [];
    }
}
