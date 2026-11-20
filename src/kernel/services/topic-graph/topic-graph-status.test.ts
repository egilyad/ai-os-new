import { describe, it, expect } from 'vitest';
import { TopicGraphServiceImpl } from './topic-graph-service';
import { getTopicGraphDB } from './topic-graph-dexie';

describe('TopicGraph claim status machine (phase 1)', () => {
    it('marks a claim validated when a second independent source confirms it', async () => {
        const svc = new TopicGraphServiceImpl(getTopicGraphDB());
        const topic = await svc.createTopic('Status', '');
        const content = 'OpenCode Desktop version is 1.19.4 and supports MCP servers.';

        await svc.ingest(topic.id, { kind: 'document', ref: 'a', title: 'A', content });
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'b',
            title: 'B',
            content,
        });

        const claims = await svc.claims(topic.id);
        const version = claims.find((c) => c.text.includes('1.19.4'));
        expect(version).toBeTruthy();
        expect(version!.sourceIds).toHaveLength(2);
        expect(version!.status).toBe('validated');
    });

    it('keeps a claim extracted when it appears in a single source', async () => {
        const svc = new TopicGraphServiceImpl(getTopicGraphDB());
        const topic = await svc.createTopic('Status2', '');
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'a',
            title: 'A',
            content: 'Только одно уникальное утверждение про квантовые алгоритмы здесь.',
        });
        const claims = await svc.claims(topic.id);
        const single = claims.find((c) => c.text.includes('квантовые алгоритмы'));
        expect(single).toBeTruthy();
        expect(single!.sourceIds).toHaveLength(1);
        expect(single!.status).toBe('extracted');
    });

    it('accumulates surface variants when a paraphrase merges', async () => {
        const svc = new TopicGraphServiceImpl(getTopicGraphDB());
        const topic = await svc.createTopic('Variants', '');
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'a',
            title: 'A',
            content: 'OpenCode Desktop version is 1.19.4.',
        });
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'b',
            title: 'B',
            content: 'Version 1.19.4 of OpenCode Desktop.',
        });

        const claims = await svc.claims(topic.id);
        const version = claims.find((c) => c.text.includes('1.19.4'));
        expect(version).toBeTruthy();
        expect(version!.variants?.length ?? 0).toBeGreaterThan(0);
        expect(version!.variants!.some((v) => v.includes('Version 1.19.4'))).toBe(true);
    });

    it('mergeClaims merges two claims into one canonical claim', async () => {
        const svc = new TopicGraphServiceImpl(getTopicGraphDB());
        const topic = await svc.createTopic('Merge2', '');
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'a',
            title: 'A',
            content: 'OpenCode Desktop version is 1.19.4.',
        });
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'b',
            title: 'B',
            content: 'Версия десктопного приложения OpenCode — одна целая девятнадцать четыре.',
        });

        let claims = await svc.claims(topic.id);
        const keep = claims.find((c) => c.text.includes('OpenCode Desktop version'));
        const absorb = claims.find((c) => c.text.includes('десктопного приложения'));
        expect(keep).toBeTruthy();
        expect(absorb).toBeTruthy();
        expect(keep!.id).not.toBe(absorb!.id);

        await svc.mergeClaims(topic.id, keep!.id, absorb!.id);

        claims = await svc.claims(topic.id);
        expect(claims.find((c) => c.id === absorb!.id)).toBeUndefined();
        const merged = claims.find((c) => c.id === keep!.id);
        expect(merged).toBeTruthy();
        expect(merged!.variants!.some((v) => v.includes('десктопного приложения'))).toBe(true);
        expect(merged!.sourceIds).toHaveLength(2);
    });

    it('finds merge candidates for similar claims', async () => {
        const svc = new TopicGraphServiceImpl(getTopicGraphDB());
        const topic = await svc.createTopic('Candidates', '');
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'a',
            title: 'A',
            content:
                'OpenCode поддерживает MCP-серверы. ' +
                'Скорость протокола обусловлена малым весом. ' +
                'Панель настроек включает восемь вкладок.',
        });
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'b',
            title: 'B',
            content:
                'Поддержка веб-протокола MCP встроена в OpenCode. ' +
                'Протокол быстрый, потому что лёгкий. ' +
                'Настройки содержат восемь вкладок интерфейса.',
        });

        const cands = await svc.mergeCandidates(topic.id, 20);
        expect(cands.length).toBeGreaterThan(0);
        const pair = cands.find((p) => p.similarity >= 0.25);
        expect(pair).toBeTruthy();
    });

    it('uses LLM verification to merge deep paraphrases (grey zone)', async () => {
        const llm = {
            chat: async () => ({ content: 'да' }),
        };
        const svc = new TopicGraphServiceImpl(getTopicGraphDB(), { llm } as never);
        const topic = await svc.createTopic('LlmDedupe', '');
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'a',
            title: 'A',
            content: 'OpenCode поддерживает MCP-серверы и умеет работать с ними.',
        });
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'b',
            title: 'B',
            content: 'OpenCode поддерживает MCP-серверы и умеет с ними работать.',
        });

        const claims = await svc.claims(topic.id);
        expect(claims.length).toBe(1);
        expect(claims[0]!.variants?.length ?? 0).toBeGreaterThan(0);
        expect(claims[0]!.status).toBe('validated');
    });

    it('does not merge when LLM says facts are different', async () => {
        const llm = {
            chat: async () => ({ content: 'нет' }),
        };
        const svc = new TopicGraphServiceImpl(getTopicGraphDB(), { llm } as never);
        const topic = await svc.createTopic('LlmNoMerge', '');
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'a',
            title: 'A',
            content: 'Скорость протокола обусловлена малым весом.',
        });
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'b',
            title: 'B',
            content: 'Протокол быстрый, потому что лёгкий.',
        });

        const claims = await svc.claims(topic.id);
        expect(claims.length).toBe(2);
    });

    it('extracts typed relations (supports/part_of) via LLM and resolves by name', async () => {
        const llm = {
            chat: async () => ({
                content: JSON.stringify([
                    {
                        text: 'OpenCode поддерживает MCP-серверы.',
                        relations: [
                            { a: 'OpenCode', b: 'MCP', kind: 'supports' },
                            { a: 'MCP', b: 'OpenCode', kind: 'part_of' },
                        ],
                    },
                    { text: 'OpenCode может работать с MCP-серверами.' },
                    { text: 'MCP-серверы подключаются к OpenCode.' },
                ]),
            }),
        };
        const svc = new TopicGraphServiceImpl(getTopicGraphDB(), { llm } as never);
        const topic = await svc.createTopic('TypedRels', '');
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'a',
            title: 'A',
            content:
                'OpenCode поддерживает MCP-серверы. OpenCode может работать с MCP-серверами. MCP-серверы подключаются к OpenCode.',
        });

        const relations = await svc.relations(topic.id);
        expect(relations.some((r) => r.relation === 'supports')).toBe(true);
        expect(relations.some((r) => r.relation === 'part_of')).toBe(true);
    });

    it('clusters concepts into subtopics by shared claims', async () => {
        const svc = new TopicGraphServiceImpl(getTopicGraphDB());
        const topic = await svc.createTopic('Clusters', '');
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'a',
            title: 'A',
            content:
                'OpenCode поддерживает MCP-серверы. ' +
                'OpenCode может работать с MCP-серверами. ' +
                'MCP-серверы подключаются к OpenCode. ' +
                'Квантовые вычисления используют кубиты. ' +
                'Кубиты находятся в суперпозиции.',
        });

        const clusters = await svc.clusters(topic.id);
        // Группы с ≥2 концептами должны получить подтему.
        const named = clusters.filter((c) => c.name !== 'Без подтемы');
        expect(named.length).toBeGreaterThanOrEqual(1);
        const all = await svc.concepts(topic.id);
        expect(all.some((c) => c.subtopic)).toBe(true);
    });

    it('resolves a conflict and marks the loser as superseded', async () => {
        const svc = new TopicGraphServiceImpl(getTopicGraphDB());
        const topic = await svc.createTopic('Resolve', '');
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'a',
            title: 'A',
            content: 'OpenCode поддерживает MCP-серверы.',
        });
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'b',
            title: 'B',
            content: 'OpenCode не поддерживает MCP-серверы.',
        });

        const conflicts = await svc.conflicts(topic.id);
        expect(conflicts.length).toBeGreaterThan(0);
        const c = conflicts[0]!;
        await svc.resolveConflict(topic.id, c.id, c.claimAId, 'superseded');

        const after = await svc.conflicts(topic.id);
        expect(after[0]!.resolved).toBe(true);
        const claims = await svc.claims(topic.id);
        const loser = claims.find((cl) => cl.id === c.claimBId);
        expect(loser!.status).toBe('superseded');
        const winner = claims.find((cl) => cl.id === c.claimAId);
        expect(winner!.status).toBe('validated');
    });

    it('marks conflict participants as contradicted', async () => {
        const svc = new TopicGraphServiceImpl(getTopicGraphDB());
        const topic = await svc.createTopic('ConflictStatus', '');
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'a',
            title: 'A',
            content: 'OpenCode поддерживает MCP-серверы.',
        });
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'b',
            title: 'B',
            content: 'OpenCode не поддерживает MCP-серверы.',
        });

        const conflicts = await svc.conflicts(topic.id);
        expect(conflicts.length).toBeGreaterThan(0);
        const claims = await svc.claims(topic.id);
        const conflicted = claims.filter((c) => c.status === 'contradicted');
        expect(conflicted.length).toBe(2);
    });
});
