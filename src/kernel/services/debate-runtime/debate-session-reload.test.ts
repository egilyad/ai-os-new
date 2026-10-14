import { describe, it, expect, beforeEach } from 'vitest';
import { createDexieStorage, resetDexieStorage } from '../storage/dexie-storage';
import { getDexieDb } from '../database-service';
import { recordToSession, sessionToRecord } from './debate-session-persistence';
import type { DebateSessionRecord } from '../../contracts/storage/debate-store';
import type { DebateSession } from '../../contracts/debate-types';

function args(n: number) {
    return Array.from({ length: n }, (_, i) => ({
        id: `s1-r1-${i}`,
        agentId: `ag${i % 2}`,
        agentName: `Agent ${i % 2}`,
        content: `argument content ${i} with enough length to be realistic`,
        round: 1,
        timestamp: 1000 + i,
    }));
}

function session(over: Partial<DebateSession> = {}): DebateSession {
    return {
        id: 's1',
        topic: 'Test topic',
        status: 'completed',
        strategy: 'round_robin',
        currentRound: 1,
        participants: [],
        arguments: args(3) as never,
        createdAt: 1000,
        ...over,
    } as DebateSession;
}

describe('Debate session reload (P3, real Dexie)', () => {
    beforeEach(async () => {
        resetDexieStorage();
        await getDexieDb().debateSessions.clear();
    });

    it('snapshot round-trip preserves arguments and order', async () => {
        const store = createDexieStorage().debates;
        await store.saveSnapshot(sessionToRecord(session()));
        // Fresh store handle, same DB — simulates a restart.
        const fresh = createDexieStorage().debates;
        const got = await fresh.getSnapshot('s1');
        expect(got).not.toBeNull();
        const restored = recordToSession(got as DebateSessionRecord);
        expect(restored.arguments.map((a) => a.id)).toEqual(['s1-r1-0', 's1-r1-1', 's1-r1-2']);
        expect(restored.arguments[0]!.content).toContain('argument content 0');
    });

    it('terminal rows are listable by status', async () => {
        const store = createDexieStorage().debates;
        await store.saveSnapshot(sessionToRecord(session({ id: 'done', status: 'completed' })));
        await store.saveSnapshot(
            sessionToRecord(session({ id: 'bad', status: 'failed' })),
        );
        await store.saveSnapshot(
            sessionToRecord(session({ id: 'stop', status: 'cancelled' })),
        );
        expect((await store.listSessions({ status: 'completed' })).map((r) => r.id)).toEqual([
            'done',
        ]);
        expect((await store.listSessions({ status: 'failed' })).map((r) => r.id)).toEqual([
            'bad',
        ]);
        expect((await store.listSessions({ status: 'cancelled' })).map((r) => r.id)).toEqual([
            'stop',
        ]);
    });

    it('stale version writes throw instead of silently clobbering', async () => {
        const store = createDexieStorage().debates;
        await store.saveSnapshot(sessionToRecord(session()));
        await store.saveSnapshot(sessionToRecord(session()));
        const stale = { ...sessionToRecord(session()), version: 1 };
        await expect(store.saveSnapshot(stale)).rejects.toThrow(/version conflict/i);
        const kept = await store.getSnapshot('s1');
        expect(kept).not.toBeNull();
    });

    it('missing rows read as null (no masquerade)', async () => {
        const store = createDexieStorage().debates;
        await expect(store.getSnapshot('ghost')).resolves.toBeNull();
    });
});
