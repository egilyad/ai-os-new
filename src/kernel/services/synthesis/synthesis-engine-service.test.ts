import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { SynthesisRepository } from '../../dal/synthesis-repository';
import { SynthesisEngineService } from './synthesis-engine-service';
import { LensEngineService } from '../lens-engine/lens-engine-service';
import type { IEventBus } from '../../types/interfaces';
import type { ICrystalVaultService } from '../../contracts/knowledge-crystal';
import type { Role } from '../../types/role-types';
import type { SynthesisInput } from '../../types/synthesis-types';

describe('SynthesisRepository', () => {
    let tdb: TestDb;
    let repo: SynthesisRepository;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        repo = new SynthesisRepository(tdb.db);
    });

    it('round-trips a session with perspectives', async () => {
        await repo.putSession({
            id: 's-1',
            question: 'Q',
            status: 'completed',
            depth: 'standard',
            preserveDissent: true,
            lensIds: ['lens:critical'],
            roleIds: ['arch'],
            createdAt: 1,
        });
        await repo.putPerspective({
            id: 'p-1',
            synthesisId: 's-1',
            roleId: 'arch',
            lensId: 'lens:critical',
            argument: 'arg',
            confidence: 0.5,
            tokensUsed: 40,
        });
        expect((await repo.getSession('s-1'))?.status).toBe('completed');
        expect(await repo.getPerspectives('s-1')).toHaveLength(1);
    });

    it('deletes a session with its perspectives', async () => {
        await repo.putSession({
            id: 's-2',
            question: 'Q',
            status: 'completed',
            depth: 'quick',
            preserveDissent: false,
            lensIds: [],
            roleIds: [],
            createdAt: 2,
        });
        await repo.putPerspective({
            id: 'p-2',
            synthesisId: 's-2',
            roleId: 'r',
            lensId: 'l',
            argument: 'a',
            confidence: 0.4,
            tokensUsed: 10,
        });
        await repo.delete('s-2');
        expect(await repo.getSession('s-2')).toBeUndefined();
        expect(await repo.getPerspectives('s-2')).toHaveLength(0);
    });
});

describe('SynthesisEngineService', () => {
    let tdb: TestDb;
    let service: SynthesisEngineService;
    const events: string[] = [];
    let proposed: string[] = [];

    const roles = new Map<string, Role>([
        [
            'arch',
            {
                id: 'arch',
                name: 'Архитектор',
                description: 'Оценивает структурную целостность решения.',
                systemPrompt: 'Ты архитектор систем.',
                capabilities: ['architecture'],
                permissions: ['memory:read'],
                metadata: { category: 'analytical', created: 1, updated: 1 },
            },
        ],
        [
            'llm',
            {
                id: 'llm',
                name: 'LLM-инженер',
                description: 'Оценивает поведение языковых моделей.',
                systemPrompt: 'Ты инженер по языковым моделям.',
                capabilities: ['llm'],
                permissions: ['memory:read'],
                metadata: { category: 'technical', created: 1, updated: 1 },
            },
        ],
    ]);

    const baseInput: SynthesisInput = {
        question:
            'Что важнее для надёжности системы: изоляция ответственности между слоями или сквозная трассировка?',
        roleIds: ['arch', 'llm'],
        lensIds: ['lens:critical', 'lens:meta-consensus'],
    };

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        events.length = 0;
        proposed = [];
        const eventBus = {
            emit: (name: string) => {
                events.push(name);
            },
            on: () => () => undefined,
            onSafe: () => () => undefined,
            off: () => undefined,
            emitOnce: () => true,
            subscribeAll: () => () => undefined,
        } as unknown as IEventBus;

        const crystalVault = {
            propose: async (input: { content: { statement: string } }) => {
                const id = `crystal-${proposed.length + 1}`;
                proposed.push(input.content.statement);
                return id;
            },
            search: async () => [],
            list: async () => [],
        } as unknown as ICrystalVaultService;

        service = new SynthesisEngineService({
            repository: new SynthesisRepository(tdb.db),
            eventBus,
            lensEngine: new LensEngineService(),
            crystalVault,
            roles: async (roleId: string) => roles.get(roleId),
        });
        await service.init();
    });

    it('synthesizes and emits started + completed events', async () => {
        const id = await service.synthesize(baseInput);
        expect(id.startsWith('synthesis-')).toBe(true);
        expect(events).toContain('synthesis:started');
        expect(events).toContain('synthesis:completed');
    });

    it('produces one perspective per role×lens pair', async () => {
        const id = await service.synthesize(baseInput);
        const s = await service.getSynthesis(id);
        expect(s).not.toBeNull();
        expect(s!.perspectives.length).toBeGreaterThan(0);
        // 2 roles × 2 lenses = 4 pairs (≤ standard cap 8)
        expect(s!.perspectives.length).toBe(4);
    });

    it('assigns role + lens names to perspectives', async () => {
        const id = await service.synthesize(baseInput);
        const s = await service.getSynthesis(id);
        expect(s!.perspectives[0]!.roleName).toBe('Архитектор');
        expect(s!.perspectives[0]!.lensName).toBeTruthy();
    });

    it('builds a qualified synthesis statement', async () => {
        const id = await service.synthesize(baseInput);
        const s = await service.getSynthesis(id);
        expect(s!.synthesizedStatement.length).toBeGreaterThan(10);
        expect(s!.confidenceDistribution).toBeDefined();
        const { consensus, dissent, uncertainty } = s!.confidenceDistribution;
        expect(Math.abs(consensus + dissent + uncertainty - 1)).toBeLessThan(0.02);
    });

    it('returns null for unknown synthesis', async () => {
        expect(await service.getSynthesis('nope')).toBeNull();
    });

    it('lists syntheses with status filter', async () => {
        await service.synthesize(baseInput);
        const all = await service.list({});
        const completed = await service.list({ status: 'completed' });
        expect(all.length).toBe(1);
        expect(completed.length).toBe(1);
    });

    it('persists session + perspectives rows', async () => {
        await service.synthesize(baseInput);
        expect((await tdb.db.synthSessions.toArray()).length).toBe(1);
        expect((await tdb.db.synthPerspectives.toArray()).length).toBe(4);
    });

    it('refine creates a new synthesis linked to parent', async () => {
        const id = await service.synthesize(baseInput);
        const refined = await service.refine(id, { comments: 'Учти cost-эффективность.' });
        expect(refined).not.toBeNull();
        expect(refined!.refinedFrom).toBe(id);
        expect(refined!.status).toBe('refined');
        expect(events).toContain('synthesis:refined');
    });

    it('refine returns null for unknown synthesis', async () => {
        expect(await service.refine('nope', {})).toBeNull();
    });

    it('exportToCrystal proposes a crystal and emits event', async () => {
        const id = await service.synthesize(baseInput);
        const crystalId = await service.exportToCrystal(id);
        expect(crystalId.startsWith('crystal-')).toBe(true);
        expect(proposed.length).toBe(1);
        expect(events).toContain('synthesis:exported-to-crystal');
        const s = await service.getSynthesis(id);
        expect(s!.generatedCrystalId).toBe(crystalId);
    });

    it('exportToForum returns a topic id and emits event', async () => {
        const id = await service.synthesize(baseInput);
        const topicId = await service.exportToForum(id);
        expect(topicId.startsWith('topic-')).toBe(true);
        expect(events).toContain('synthesis:exported-to-forum');
    });

    it('rejects input without a question', async () => {
        await expect(service.synthesize({ ...baseInput, question: '   ' })).rejects.toThrow();
    });

    it('caps perspectives by depth', async () => {
        const deepInput: SynthesisInput = {
            ...baseInput,
            roleIds: ['arch', 'llm'],
            lensIds: [
                'lens:critical',
                'lens:meta-consensus',
                'lens:meta-dissent',
                'lens:meta-uncertainty',
            ],
            depth: 'quick',
        };
        const id = await service.synthesize(deepInput);
        const s = await service.getSynthesis(id);
        // 8 pairs but quick cap = 4
        expect(s!.perspectives.length).toBeLessThanOrEqual(4);
    });
});
