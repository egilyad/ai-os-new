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

    it('consolidate merges near-duplicate claims via LLM verdicts', async () => {
        const llm = {
            chat: async () => ({ content: 'да' }),
        };
        const svc = new TopicGraphServiceImpl(getTopicGraphDB(), { llm } as never);
        const topic = await svc.createTopic('ConsolidateLlm', '');
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

        await svc.consolidate(topic.id);
        const claims = await svc.claims(topic.id);
        expect(claims.length).toBe(1);
    });

    it('runDiff reports added/removed sources between two runs', async () => {
        const svc = new TopicGraphServiceImpl(getTopicGraphDB());
        const topic = await svc.createTopic('RunDiff', '');
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
            content: 'Квантовые вычисления используют кубиты.',
        });
        const runs = await svc.runs(topic.id);
        const sorted = [...runs].sort((a, b) => a.createdAt - b.createdAt);

        const diff = await svc.runDiff(topic.id, sorted[0]!.id, sorted[1]!.id);
        expect(diff.addedSources.length).toBe(1);
        expect(diff.removedSources.length).toBe(1);
        expect(diff.statsB.newClaims).toBeGreaterThan(0);
    });

    it('decomposes topic into aspects via LLM', async () => {
        const llm = {
            chat: async () => ({
                content: JSON.stringify(['архитектура', 'безопасность', 'производительность']),
            }),
        };
        const svc = new TopicGraphServiceImpl(getTopicGraphDB(), { llm } as never);
        const topic = await svc.createTopic('Aspects', 'Проект OpenCode');

        const aspects = await svc.decomposeAspects(topic.id);
        expect(aspects.length).toBe(3);
        expect(aspects.map((a) => a.name)).toEqual([
            'архитектура',
            'безопасность',
            'производительность',
        ]);
        // Идемпотентно: повторный вызов не плодит дубли.
        const again = await svc.decomposeAspects(topic.id);
        expect(again.length).toBe(3);
    });

    it('computes aspect coverage in completeness', async () => {
        const llm = {
            chat: async () => ({
                content: JSON.stringify(['архитектура', 'безопасность']),
            }),
        };
        const svc = new TopicGraphServiceImpl(getTopicGraphDB(), { llm } as never);
        const topic = await svc.createTopic('AspectCov', '');
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

        const aspects = await svc.decomposeAspects(topic.id);
        expect(aspects.length).toBe(2);
        // Привяжем оба аспекта к обоим утверждениям.
        const claims = await svc.claims(topic.id);
        const now = Date.now();
        const withClaims = aspects.map((a, i) => ({
            ...a,
            claimIds: claims.map((c) => c.id),
            minFacts: 1,
            updatedAt: now + i,
        }));
        await getTopicGraphDB().topicAspects.bulkPut(withClaims);

        const comp = await svc.completeness(topic.id);
        expect(comp.aspectCoverage).toBeDefined();
        expect(comp.aspectCoverage!.total).toBe(2);
        expect(comp.aspectCoverage!.covered).toBe(2);
        expect(comp.collectionProgress).toBe(1);
    });

    it('generates clarifying questions for weak aspects', async () => {
        const llm = {
            chat: async (messages: Array<{ role: string; content: string }>) => {
                const last = messages[messages.length - 1]!.content;
                if (last.includes('Тема:')) {
                    return { content: JSON.stringify(['архитектура', 'безопасность']) };
                }
                return {
                    content: JSON.stringify(['Что такое MCP?', 'Как OpenCode подключает MCP?']),
                };
            },
        };
        const svc = new TopicGraphServiceImpl(getTopicGraphDB(), { llm } as never);
        const topic = await svc.createTopic('Questions', '');
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'a',
            title: 'A',
            content: 'OpenCode поддерживает MCP-серверы.',
        });

        const aspects = await svc.decomposeAspects(topic.id);
        expect(aspects.length).toBeGreaterThan(0);
        // Аспекты без фактов — слабые; вопросы должны сгенерироваться.
        const questions = await svc.aspectQuestions(topic.id);
        expect(questions.length).toBeGreaterThan(0);
        expect(questions[0]!.questions.length).toBeGreaterThan(0);
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
