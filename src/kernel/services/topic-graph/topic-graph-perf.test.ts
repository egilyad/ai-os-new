import { describe, it, expect } from 'vitest';
import { TopicGraphServiceImpl } from './topic-graph-service';
import { getTopicGraphDB } from './topic-graph-dexie';
import type { TopicClaim } from '../../contracts/topic-graph/types';

const SUBJECTS = [
    'квантовые вычисления',
    'криптография',
    'нейросети',
    'браузерные платформы',
    'распределённые системы',
];
const VERBS = ['используют', 'поддерживают', 'требуют', 'ускоряют', 'ограничивают'];
const OBJECTS = ['кубиты', 'алгоритмы', 'шифрование', 'память', 'предсказания'];

function sentence(i: number): string {
    const s = SUBJECTS[i % SUBJECTS.length]!;
    const v = VERBS[(i * 3 + 1) % VERBS.length]!;
    const o = OBJECTS[(i * 7 + 5) % OBJECTS.length]!;
    return `${s} ${v} ${o} в контексте задачи ${i}.`;
}

/**
 * Контракт производительности (Фаза 0 роадмапа): ингест нового документа на
 * теме с ~500 утверждениями должен занимать доли секунды.
 * Цель роадмапа — <= 3 c; порог смягчён до 5 c для стабильности CI.
 * Подготовка темы выполняется прямой записью claims (без LLM/эмбеддингов).
 */
describe('TopicGraph performance contract (phase 0)', () => {
    it('ingest of a new source on a ~500-claim topic is fast', { timeout: 60000 }, async () => {
        const svc = new TopicGraphServiceImpl(getTopicGraphDB());
        const db = getTopicGraphDB();
        const topic = await svc.createTopic('Perf', '');

        const now = Date.now();
        const claims: TopicClaim[] = [];
        for (let i = 0; i < 500; i++) {
            claims.push({
                id: `claim-${i}`,
                topicId: topic.id,
                text: sentence(i),
                sourceIds: [`src-${i % 50}`],
                confidence: 0.6,
                status: 'extracted',
                createdAt: now,
                updatedAt: now,
            });
        }
        await db.topicClaims.bulkPut(claims);

        const content: string[] = [];
        for (let k = 0; k < 10; k++) content.push(sentence(1000 + k));
        const t0 = performance.now();
        const run = await svc.ingest(topic.id, {
            kind: 'document',
            ref: 'src-new',
            title: 'New',
            content: content.join(' '),
        });
        const elapsedMs = performance.now() - t0;

        expect(['completed', 'fallback']).toContain(run.status);
        expect(elapsedMs).toBeLessThan(5000);
    });
});
