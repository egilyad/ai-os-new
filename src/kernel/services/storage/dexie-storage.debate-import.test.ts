import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { createDexieStorage, resetDexieStorage } from './dexie-storage';
import { getDexieDb } from '../database-service';
import type { DebateSessionRecord, DebateVerdictRecord } from '../../contracts/storage/debate-store';

const sess = (id: string): DebateSessionRecord => ({
    id,
    topic: `Topic ${id}`,
    topologyType: 'roundtable',
    phase: 'completed',
    round: 1,
    totalTokens: 0,
    totalCost: 0,
    agentStates: '{}',
    arguments: '[]',
    topology: '{}',
    participants: '[]',
    memory: '{}',
    startedAt: 1,
    updatedAt: 2,
    createdAt: 1,
});

const verdict = (sessionId: string): DebateVerdictRecord => ({
    sessionId,
    topic: `Topic ${sessionId}`,
    summary: 's',
    conclusionType: 'consensus',
    stanceResult: 'balanced',
    keyArguments: '[]',
    reasoning: 'r',
    confidence: 0.8,
    generatedAt: 3,
    roundsTotal: 1,
    totalTokens: 0,
});

describe('DexieDebateStore import (round-trip)', () => {
    beforeEach(async () => {
        resetDexieStorage();
        const db = getDexieDb();
        await db.debateSessions.clear();
        await db.debateVerdicts.clear();
    });

    it('importSessions inserts fresh records and skips existing ids', async () => {
        const store = createDexieStorage().debates;
        const first = await store.importSessions([sess('a'), sess('b'), sess('c')]);
        expect(first).toEqual({ imported: 3, skipped: 0 });

        const second = await store.importSessions([sess('a'), sess('d')]);
        expect(second).toEqual({ imported: 1, skipped: 1 });

        const all = await store.listAllSessions();
        expect(all.map((s) => s.id).sort()).toEqual(['a', 'b', 'c', 'd']);
    });

    it('importSessions ignores malformed records', async () => {
        const store = createDexieStorage().debates;
        const bad = { id: '', topic: '' } as unknown as DebateSessionRecord;
        const result = await store.importSessions([bad, sess('ok')]);
        expect(result).toEqual({ imported: 1, skipped: 1 });
        const all = await store.listAllSessions();
        expect(all.map((s) => s.id)).toEqual(['ok']);
    });

    it('importVerdicts only writes verdicts for allowed session ids', async () => {
        const store = createDexieStorage().debates;
        await store.importSessions([sess('x'), sess('y')]);

        const imported = await store.importVerdicts(
            [verdict('x'), verdict('y'), verdict('z')],
            ['x'],
        );
        expect(imported).toBe(1);

        const all = await store.listAllVerdicts();
        expect(all.map((v) => v.sessionId)).toEqual(['x']);
    });
});
