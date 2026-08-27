import { beforeEach, describe, expect, it } from 'vitest';
import type { DebateSessionRecord, DebateVerdictRecord } from '../contracts/storage/debate-store';
import type {
    DebateTimelineEntry,
    DebateOverride,
    SessionLink,
} from '../contracts/session-manager';
import { DebateRepository } from './debate-repository';
import { createTestDb, type TestDb } from './_test-harness';

function sessionRecord(id: string, updatedAt: number): DebateSessionRecord {
    return {
        id,
        topic: `topic-${id}`,
        topologyType: 'roundtable',
        phase: 'completed',
        round: 1,
        totalTokens: 10,
        totalCost: 0.1,
        agentStates: '[]',
        arguments: '[]',
        topology: '{}',
        participants: '[]',
        memory: '{}',
        startedAt: 100,
        updatedAt,
        createdAt: 100,
    };
}

function verdict(sessionId: string): DebateVerdictRecord {
    return {
        sessionId,
        topic: `topic-${sessionId}`,
        summary: 'summary',
        conclusionType: 'consensus',
        stanceResult: 'balanced',
        keyArguments: '[]',
        reasoning: 'reasoning',
        confidence: 0.8,
        generatedAt: 200,
        roundsTotal: 2,
        totalTokens: 10,
    };
}

function timeline(entryId: string, sessionId: string): DebateTimelineEntry {
    return { id: entryId, sessionId, timestamp: 1, type: 'argument', payload: '{}' };
}

function override(overrideId: string, sessionId: string): DebateOverride {
    return { id: overrideId, sessionId, type: 'strategy', payload: '{}', appliedAt: 1 };
}

function link(linkId: string, sessionId: string): SessionLink {
    return {
        id: linkId,
        fromId: sessionId,
        toId: 'to-' + sessionId,
        linkType: 'continuation',
        context: 'ctx',
        createdAt: 1,
    };
}

describe('DebateRepository', () => {
    let testDb: TestDb;
    let repo: DebateRepository;

    beforeEach(async () => {
        testDb = await createTestDb();
        await testDb.clearAll();
        repo = new DebateRepository(testDb.db);
    });

    it('save/loads sessions, newest first', async () => {
        await repo.saveSession(sessionRecord('a', 1));
        await repo.saveSession(sessionRecord('b', 2));
        expect((await repo.listSessions()).map((s) => s.id)).toEqual(['b', 'a']);
        expect((await repo.getSession('a'))?.topic).toBe('topic-a');
    });

    it('deleteSession removes a session', async () => {
        await repo.saveSession(sessionRecord('a', 1));
        await repo.deleteSession('a');
        expect(await repo.getSession('a')).toBeUndefined();
    });

    it('saves and loads a verdict by sessionId', async () => {
        await repo.saveVerdict(verdict('s1'));
        expect((await repo.getVerdict('s1'))?.conclusionType).toBe('consensus');
    });

    it('put/get/delete timeline entries per session, sorted by timestamp', async () => {
        await repo.saveTimelineEntry(timeline('e2', 's1'));
        await repo.saveTimelineEntry(timeline('e1', 's1'));
        const entries = await repo.listTimeline('s1');
        expect(entries.map((e) => e.id)).toEqual(['e1', 'e2']);
        await repo.deleteTimelineBySession('s1');
        expect(await repo.listTimeline('s1')).toHaveLength(0);
    });

    it('put/list/delete overrides per session', async () => {
        await repo.saveOverride(override('o1', 's1'));
        await repo.saveOverride(override('o2', 's1'));
        expect(await repo.listOverrides('s1')).toHaveLength(2);
        await repo.deleteOverridesBySession('s1');
        expect(await repo.listOverrides('s1')).toHaveLength(0);
    });

    it('clearAll wipes sessions, verdicts, timeline, overrides, and session links', async () => {
        await repo.saveSession(sessionRecord('a', 1));
        await repo.saveVerdict(verdict('a'));
        await repo.saveTimelineEntry(timeline('e1', 'a'));
        await repo.saveOverride(override('o1', 'a'));
        await testDb.db.sessionLinks.put(link('l1', 'a'));

        await repo.clearAll();

        expect(await repo.listSessions()).toHaveLength(0);
        expect(await repo.getVerdict('a')).toBeUndefined();
        expect(await repo.listTimeline('a')).toHaveLength(0);
        expect(await repo.listOverrides('a')).toHaveLength(0);
        expect(await testDb.db.sessionLinks.count()).toBe(0);
    });

    it('clearTimelineAndOverrides removes both for a session', async () => {
        await repo.saveTimelineEntry(timeline('e1', 'a'));
        await repo.saveOverride(override('o1', 'a'));
        await repo.clearTimelineAndOverrides('a');
        expect(await repo.listTimeline('a')).toHaveLength(0);
        expect(await repo.listOverrides('a')).toHaveLength(0);
    });
});
