import { beforeEach, describe, expect, it } from 'vitest';
import { createTopicGraphDB, getTopicGraphDB } from './topic-graph-dexie';
import { TopicGraphServiceImpl } from './topic-graph-service';

describe('TopicGraphService (MVP)', () => {
    beforeEach(async () => {
        createTopicGraphDB('aios-topic-graph-test');
        const db = getTopicGraphDB();
        await db.delete();
        await db.open();
    });

    it('createTopic → list/get/update/archive/delete (с подтверждением)', async () => {
        const svc = new TopicGraphServiceImpl();
        const topic = await svc.createTopic('Water from air', 'study');
        expect(topic.id).toBeTruthy();

        const list = await svc.listTopics();
        expect(list).toHaveLength(1);

        const updated = await svc.updateTopic(topic.id, { status: 'paused' });
        expect(updated?.status).toBe('paused');

        const archived = await svc.archiveTopic(topic.id);
        expect(archived?.status).toBe('archived');

        expect(await svc.deleteTopic(topic.id)).toBe(false);
        expect(await svc.getTopic(topic.id)).toBeTruthy();

        expect(await svc.deleteTopic(topic.id, true)).toBe(true);
        expect(await svc.getTopic(topic.id)).toBeUndefined();
    });

    it('ingest: извлекает утверждения и сохраняет источники', async () => {
        const svc = new TopicGraphServiceImpl();
        const topic = await svc.createTopic('Test topic', '');

        const run = await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'doc-1',
            title: 'Doc 1',
            content:
                'The E-350 CPU has two cores. ' +
                'OpenCode 1.19.4 is a desktop app. ' +
                'This is a short note.',
        });

        expect(run.status).toBe('fallback');
        expect(run.stats.newClaims).toBeGreaterThanOrEqual(2);
        expect((await svc.sources(topic.id)).length).toBe(1);
        expect((await svc.claims(topic.id)).length).toBeGreaterThanOrEqual(2);
    });

    it('ingest: дедупликация повторов (одно утверждение из двух источников)', async () => {
        const svc = new TopicGraphServiceImpl();
        const topic = await svc.createTopic('Dedupe topic', '');

        await svc.ingest(topic.id, {
            kind: 'model-answer',
            ref: 'm1',
            title: 'Answer 1',
            content: 'OpenCode Desktop 1.19.4 is the current version.',
        });
        await svc.ingest(topic.id, {
            kind: 'model-answer',
            ref: 'm2',
            title: 'Answer 2',
            content: 'The current version of OpenCode Desktop is 1.19.4.',
        });

        const claims = await svc.claims(topic.id);
        const dup = claims.find((c) => c.sourceIds.length >= 2);
        expect(dup).toBeTruthy();
        expect(claims.length).toBeGreaterThanOrEqual(1);
    });

    it('ingest: находит противоречия', async () => {
        const svc = new TopicGraphServiceImpl();
        const topic = await svc.createTopic('Conflict topic', '');

        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'd1',
            title: 'Doc 1',
            content: 'OpenCode Desktop plugins are fully supported.',
        });
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'd2',
            title: 'Doc 2',
            content: 'OpenCode Desktop plugins are not supported.',
        });

        const conflicts = await svc.conflicts(topic.id);
        expect(conflicts.length).toBeGreaterThanOrEqual(1);
    });

    it('completeness/search/exportReport работают', async () => {
        const svc = new TopicGraphServiceImpl();
        const topic = await svc.createTopic('Full topic', 'desc');

        await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'd1',
            title: 'Doc 1',
            content: 'OpenCode is a coding agent. It runs on Windows 10. ' +
                'It uses MCP servers for integrations.',
        });

        const comp = await svc.completeness(topic.id);
        expect(comp.sources).toBe(1);
        expect(comp.totalClaims).toBeGreaterThanOrEqual(2);

        const found = await svc.search(topic.id, 'coding agent');
        expect(found.length).toBeGreaterThanOrEqual(1);

        const report = await svc.exportReport(topic.id);
        expect(report).toContain('# Topic Graph');
        expect(report).toContain('OpenCode');
    });
});
