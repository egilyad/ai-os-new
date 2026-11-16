import { beforeEach, describe, expect, it } from 'vitest';
import { createTopicGraphDB, getTopicGraphDB } from './topic-graph-dexie';
import { TopicGraphServiceImpl } from './topic-graph-service';

/**
 * Эталонный корпус: заранее известные факты, повторы, противоречия,
 * числа, условие. Прогоняется после каждого изменения алгоритмов.
 */
const GOLDEN = [
    { ref: 'd1', title: 'Doc 1', content: 'OpenCode Desktop version is 1.19.4. OpenCode Desktop supports MCP servers.' },
    { ref: 'd2', title: 'Doc 2', content: 'The current version of OpenCode Desktop is 1.19.4.' },
    { ref: 'd3', title: 'Doc 3', content: 'OpenCode Desktop does not support MCP servers.' },
    { ref: 'd4', title: 'Doc 4', content: 'OpenCode Desktop memory usage is about 300 MB. A later build uses about 900 MB.' },
    { ref: 'd5', title: 'Doc 5', content: 'If MCP is enabled, OpenCode can connect to external tools.' },
    { ref: 'd6', title: 'Doc 6', content: 'OpenCode runs on Windows 10 Education and costs nothing.' },
];

describe('TopicGraph golden corpus', () => {
    beforeEach(async () => {
        createTopicGraphDB('aios-topic-graph-golden');
        const db = getTopicGraphDB();
        await db.delete();
        await db.open();
    });

    it('сохраняет ожидаемые свойства графа', async () => {
        const svc = new TopicGraphServiceImpl();
        const topic = await svc.createTopic('Golden topic', '');

        for (const g of GOLDEN) {
            await svc.ingest(topic.id, {
                kind: 'document',
                ref: g.ref,
                title: g.title,
                content: g.content,
            });
        }

        const claims = await svc.claims(topic.id);
        const conflicts = await svc.conflicts(topic.id);
        const concepts = await svc.concepts(topic.id);
        const relations = await svc.relations(topic.id);

        // Один и тот же факт (версия) из нескольких источников — дедуп.
        const versionClaim = claims.find((c) => c.text.includes('1.19.4'));
        expect(versionClaim).toBeTruthy();
        expect(versionClaim!.sourceIds.length).toBeGreaterThanOrEqual(2);

        // Прямое противоречие по MCP обнаружено.
        expect(conflicts.length).toBeGreaterThanOrEqual(1);

        // Разные числовые значения не сливаются.
        expect(claims.some((c) => c.text.includes('300'))).toBe(true);
        expect(claims.some((c) => c.text.includes('900'))).toBe(true);

        // Утверждение с условием сохранено.
        expect(claims.some((c) => /\bif\b/i.test(c.text))).toBe(true);

        // Концепты выделены.
        expect(concepts.length).toBeGreaterThanOrEqual(3);

        // Иерархия концептов: desktop вложен в opencode (part_of).
        expect(relations.some((r) => r.relation === 'part_of')).toBe(true);

        // Консолидация по требованию идемпотентна.
        await svc.consolidate(topic.id);
        expect((await svc.relations(topic.id)).some((r) => r.relation === 'part_of')).toBe(true);

        // Центральность считает степень узлов.
        const cent = await svc.centrality(topic.id);
        expect(cent.some((n) => n.kind === 'claim' && n.normalized > 0)).toBe(true);

        // Гибридный поиск находит релевантные утверждения.
        const found = await svc.search(topic.id, 'OpenCode version 1.19.4');
        expect(found.length).toBeGreaterThanOrEqual(1);
        expect(found.some((c) => c.text.includes('1.19.4'))).toBe(true);

        // Всё evidence имеет source-происхождение и корректные offsets.
        const evs = await getTopicGraphDB().topicEvidence.toArray();
        expect(evs.length).toBeGreaterThan(0);
        expect(evs.every((e) => e.origin === 'source' && typeof e.offset === 'number' && typeof e.end === 'number')).toBe(true);
        expect(evs.every((e) => e.extraction === 'fallback')).toBe(true);
    });
});
