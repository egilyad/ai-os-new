import { beforeEach, describe, expect, it } from 'vitest';
import { createTopicGraphDB, getTopicGraphDB } from './topic-graph-dexie';
import { TopicGraphServiceImpl } from './topic-graph-service';

const A = {
    title: 'OpenCode overview',
    content:
        'OpenCode is a local AI coding agent. ' +
        'OpenCode Desktop version is 1.19.4. ' +
        'It has a server API with sessions and messages. ' +
        'It supports MCP servers.',
};

const B = {
    title: 'OpenCode duplicate rephrase',
    content:
        'The current AI coding agent version of OpenCode Desktop is 1.19.4. ' +
        'OpenCode can integrate MCP servers.',
};

const C = {
    title: 'OpenCode conflict',
    content:
        'OpenCode Desktop does not support MCP servers. ' +
        'OpenCode Desktop has 10 built-in panels.',
};

const D = {
    title: 'OpenCode numbers',
    content:
        'OpenCode Desktop memory usage is about 300 MB. ' +
        'OpenCode Desktop memory usage is about 900 MB.',
};

describe('TopicGraph quality corpus', () => {
    beforeEach(async () => {
        createTopicGraphDB('aios-topic-graph-quality-test');
        const db = getTopicGraphDB();
        await db.delete();
        await db.open();
    });

    it('повторы объединяются (sourceIds накапливаются), уникальные факты сохраняются', async () => {
        const svc = new TopicGraphServiceImpl();
        const topic = await svc.createTopic('OpenCode', '');

        await svc.ingest(topic.id, { kind: 'document', ref: 'a', title: A.title, content: A.content });
        await svc.ingest(topic.id, { kind: 'document', ref: 'b', title: B.title, content: B.content });

        const claims = await svc.claims(topic.id);

        // Версия 1.19.4 должна встречаться в 2 источниках (дедупликация).
        const versionClaim = claims.find((c) => c.text.includes('1.19.4'));
        expect(versionClaim).toBeTruthy();
        expect(versionClaim!.sourceIds).toHaveLength(2);

        // "10 built-in panels" уникален (из C, но C в этом тесте не грузили).
        // Проверяем, что уникальные факты из B сохранились.
        const mcpClaim = claims.find((c) => c.text.toLowerCase().includes('mcp'));
        expect(mcpClaim).toBeTruthy();

        // Evidence ссылается на оригинальный фрагмент с offset.
        const evs = await getTopicGraphDB().topicEvidence.toArray();
        const versionEv = evs.find((e) => e.quote.startsWith('OpenCode Desktop version is 1.19.4.'));
        expect(versionEv).toBeTruthy();
        expect(versionEv!.offset).toBeGreaterThan(0);
    });

    it('прямые противоречия фиксируются как конфликты', async () => {
        const svc = new TopicGraphServiceImpl();
        const topic = await svc.createTopic('OpenCode', '');

        await svc.ingest(topic.id, { kind: 'document', ref: 'a', title: A.title, content: A.content });
        await svc.ingest(topic.id, { kind: 'document', ref: 'c', title: C.title, content: C.content });

        const conflicts = await svc.conflicts(topic.id);
        const mcpConflict = conflicts.find((cf) => cf.reason.includes('polarity'));
        expect(mcpConflict).toBeTruthy();

        // Связи: противоречие → contradicticts, иначе нейтральная related_to.
        const relations = await svc.relations(topic.id);
        expect(relations.some((r) => r.relation === 'contradicts')).toBe(true);
        expect(relations.every((r) => r.relation === 'contradicts' || r.relation === 'related_to')).toBe(true);
        expect(relations.some((r) => r.relation === 'supports')).toBe(false);
    });

    it('несовпадающие цифры не теряются и не схлопываются', async () => {
        const svc = new TopicGraphServiceImpl();
        const topic = await svc.createTopic('Memory', '');

        await svc.ingest(topic.id, { kind: 'document', ref: 'd1', title: D.title, content: D.content });

        const claims = await svc.claims(topic.id);
        const with300 = claims.find((c) => c.text.includes('300'));
        const with900 = claims.find((c) => c.text.includes('900'));
        expect(with300).toBeTruthy();
        expect(with900).toBeTruthy();
    });

    it('LLM обрабатывает большой документ чанками, а не первыми 6000', async () => {
        const calls: string[] = [];
        const llm = {
            chat: async (msgs: Array<{ role: string; content: string }>) => {
                const last = msgs[msgs.length - 1]!.content;
                calls.push(last);
                return { content: JSON.stringify([`claim-chunk-${last.length}`]) };
            },
        };
        const svc = new TopicGraphServiceImpl(getTopicGraphDB(), { llm } as never);
        const topic = await svc.createTopic('Big', '');
        const big = 'Слово повторяется часто '.repeat(1500);
        const run = await svc.ingest(topic.id, { kind: 'document', ref: 'big', title: 'Big', content: big });
        expect(calls.length).toBeGreaterThan(1);
        expect(run.status).toBe('completed');
        expect(run.stats.extracted).toBeGreaterThan(0);
        expect(run.stats.mergeCandidates).toBeGreaterThanOrEqual(0);
    });

    it('LLM evidence: цитата из оригинала, если найдена; иначе пометка model', async () => {
        const sourceContent = 'OpenCode Desktop version is 1.19.4. It supports MCP servers.';
        const llm = {
            chat: async () => ({
                content: JSON.stringify([
                    'OpenCode Desktop version is 1.19.4',
                    'Компьютеры летают',
                ]),
            }),
        };
        const svc = new TopicGraphServiceImpl(getTopicGraphDB(), { llm } as never);
        const topic = await svc.createTopic('Provenance', '');
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'src',
            title: 'Src',
            content: sourceContent,
        });

        const evs = await getTopicGraphDB().topicEvidence.toArray();
        const fromSource = evs.find((e) => e.quote.includes('OpenCode Desktop version is 1.19.4'));
        const fromModel = evs.find((e) => e.quote.includes('Компьютеры летают'));
        expect(fromSource).toBeTruthy();
        expect(fromSource!.origin).toBe('source');
        expect(fromSource!.offset).toBe(0);
        expect(fromModel).toBeTruthy();
        expect(fromModel!.origin).toBe('model');
        expect(fromModel!.offset).toBeUndefined();
    });

    it('locateFragment: offset корректен при переносах строк и повторяющихся пробелах', async () => {
        const sourceContent = 'Начало\n\nOpenCode  Desktop version is 1.19.4.';
        const llm = {
            chat: async () => ({ content: JSON.stringify(['OpenCode Desktop version is 1.19.4']) }),
        };
        const svc = new TopicGraphServiceImpl(getTopicGraphDB(), { llm } as never);
        const topic = await svc.createTopic('Offsets', '');
        await svc.ingest(topic.id, { kind: 'document', ref: 'src', title: 'Src', content: sourceContent });

        const evs = await getTopicGraphDB().topicEvidence.toArray();
        const ev = evs.find((e) => e.quote.includes('OpenCode'));
        expect(ev).toBeTruthy();
        expect(ev!.offset).toBe(sourceContent.indexOf('OpenCode'));
        expect(ev!.origin).toBe('source');
    });

    it('дубликат из второго источника получает отдельное Evidence', async () => {
        const svc = new TopicGraphServiceImpl();
        const topic = await svc.createTopic('TwoSrc', '');
        await svc.ingest(topic.id, { kind: 'document', ref: 'a', title: 'A', content: 'OpenCode Desktop version is 1.19.4.' });
        await svc.ingest(topic.id, { kind: 'document', ref: 'b', title: 'B', content: 'According to docs, OpenCode Desktop version is 1.19.4.' });

        const claims = await svc.claims(topic.id);
        const version = claims.find((c) => c.text.includes('1.19.4'));
        expect(version).toBeTruthy();
        expect(version!.sourceIds).toHaveLength(2);

        const evs = await getTopicGraphDB().topicEvidence.toArray();
        const forClaim = evs.filter((e) => e.claimId === version!.id);
        expect(forClaim).toHaveLength(2);
        expect(new Set(forClaim.map((e) => e.sourceId)).size).toBe(2);
        expect(forClaim.every((e) => e.origin === 'source')).toBe(true);
    });

    it('малформированный JSON от LLM фиксируется как ошибка чанка', async () => {
        const llm = { chat: async () => ({ content: '{not json' }) };
        const svc = new TopicGraphServiceImpl(getTopicGraphDB(), { llm } as never);
        const topic = await svc.createTopic('BadJson', '');
        const run = await svc.ingest(topic.id, { kind: 'document', ref: 'x', title: 'X', content: 'Короткий текст.' });
        expect(run.status).toBe('completed');
        expect(run.warnings?.some((w) => w.includes('не обработал'))).toBe(true);
    });

    it('пустой ответ LLM — ошибка чанка', async () => {
        const llm = { chat: async () => ({ content: '' }) };
        const svc = new TopicGraphServiceImpl(getTopicGraphDB(), { llm } as never);
        const topic = await svc.createTopic('EmptyLlm', '');
        const run = await svc.ingest(topic.id, { kind: 'document', ref: 'x', title: 'X', content: 'Короткий текст.' });
        expect(run.status).toBe('completed');
        expect(run.warnings?.some((w) => w.includes('не обработал'))).toBe(true);
    });

    it('LLM частичные сбои чанков фиксируются в warnings', async () => {
        let calls = 0;
        const llm = {
            chat: async () => {
                calls++;
                if (calls > 1) throw new Error('LLM down');
                return { content: JSON.stringify(['Факт из первого чанка']) };
            },
        };
        const svc = new TopicGraphServiceImpl(getTopicGraphDB(), { llm } as never);
        const topic = await svc.createTopic('Partial', '');
        const big = 'Слово узкое '.repeat(800);
        const run = await svc.ingest(topic.id, { kind: 'document', ref: 'big', title: 'Big', content: big });
        expect(run.status).toBe('completed');
        expect(run.warnings?.some((w) => w.includes('не обработал'))).toBe(true);
    });

    it('дополнение новыми сведениями расширяет граф', async () => {
        const svc = new TopicGraphServiceImpl();
        const topic = await svc.createTopic('OpenCode', '');

        await svc.ingest(topic.id, { kind: 'document', ref: 'a', title: A.title, content: A.content });
        const before = (await svc.claims(topic.id)).length;

        await svc.ingest(topic.id, { kind: 'document', ref: 'd', title: D.title, content: D.content });
        const after = (await svc.claims(topic.id)).length;

        expect(after).toBeGreaterThan(before);
    });
});
