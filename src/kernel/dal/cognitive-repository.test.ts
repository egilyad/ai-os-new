import { beforeEach, describe, expect, it } from 'vitest';
import type { CognitiveTrace, CognitiveSkill, Connector } from '../types/domain-types';
import { CognitiveRepository } from './cognitive-repository';
import { createTestDb, type TestDb } from './_test-harness';

function skill(id: string): CognitiveSkill {
    return {
        id,
        name: `skill-${id}`,
        description: `desc-${id}`,
        category: 'analysis',
        status: 'active',
        toolsUsed: ['search'],
        version: '1.0.0',
        executionCount: 0,
    };
}

function connector(id: string): Connector {
    return {
        id,
        name: `conn-${id}`,
        type: 'api',
        description: `desc-${id}`,
        color: '#000',
        status: 'connected',
    };
}

function cogTrace(id: string): CognitiveTrace {
    return {
        id,
        traceId: `trace-${id}`,
        startTime: 100,
        input: `in-${id}`,
        status: 'completed',
        steps: [],
        decisionGraph: { nodes: [], edges: [] },
        totalLatency: 1,
        totalTokens: 1,
        estimatedCost: 0.1,
        semanticConfidence: 0.9,
    };
}

describe('CognitiveRepository', () => {
    let testDb: TestDb;
    let repo: CognitiveRepository;

    beforeEach(async () => {
        testDb = await createTestDb();
        await testDb.clearAll();
        repo = new CognitiveRepository(testDb.db);
    });

    it('saves and lists skills', async () => {
        await repo.saveSkill(skill('s1'));
        await repo.saveSkill(skill('s2'));
        expect((await repo.getAllSkills()).map((s) => s.id).sort()).toEqual(['s1', 's2']);
        expect((await repo.getSkill('s1'))?.name).toBe('skill-s1');
    });

    it('deletes a skill', async () => {
        await repo.saveSkill(skill('s1'));
        await repo.deleteSkill('s1');
        expect(await repo.getSkill('s1')).toBeUndefined();
    });

    it('saves and lists connectors', async () => {
        await repo.saveConnector(connector('c1'));
        expect((await repo.getConnector('c1'))?.status).toBe('connected');
        expect(await repo.getAllConnectors()).toHaveLength(1);
    });

    it('deletes a connector', async () => {
        await repo.saveConnector(connector('c1'));
        await repo.deleteConnector('c1');
        expect(await repo.getConnector('c1')).toBeUndefined();
    });

    it('saves and lists cognitive traces with limit', async () => {
        await repo.saveCognitiveTrace(cogTrace('t1'));
        await repo.saveCognitiveTrace(cogTrace('t2'));
        expect(await repo.getAllCognitiveTraces()).toHaveLength(2);
        expect(await repo.getAllCognitiveTraces(1)).toHaveLength(1);
        expect((await repo.getCognitiveTrace('t2'))?.traceId).toBe('trace-t2');
    });

    it('deletes a cognitive trace', async () => {
        await repo.saveCognitiveTrace(cogTrace('t1'));
        await repo.deleteCognitiveTrace('t1');
        expect(await repo.getCognitiveTrace('t1')).toBeUndefined();
    });
});
