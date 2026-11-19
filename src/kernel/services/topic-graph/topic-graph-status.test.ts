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
