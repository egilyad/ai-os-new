import { describe, expect, it, vi } from 'vitest';
import { RunHistoryService } from './run-history-service';
import type { RunHistoryRecord } from '../../contracts/run-history';

function fakeDatabase() {
    const store = new Map<string, unknown>();
    return {
        store,
        getKv: vi.fn(async <T>(id: string): Promise<T | null> => (store.get(id) as T) ?? null),
        setKv: vi.fn(async <T>(id: string, value: T): Promise<void> => {
            store.set(id, value);
        }),
    };
}

function record(runId: string, finishedAt: number): RunHistoryRecord {
    return {
        runId,
        goal: 'goal',
        status: 'completed',
        startedAt: finishedAt - 10,
        finishedAt,
        steps: [
            {
                nodeId: 'research',
                input: {},
                output: { research: 'x'.repeat(3000) },
                timestamp: finishedAt - 5,
            },
        ],
        artifacts: [
            {
                nodeId: 'research',
                type: 'report',
                content: 'y'.repeat(3000),
                createdAt: finishedAt - 5,
            },
        ],
    };
}

describe('RunHistoryService', () => {
    it('сохраняет запись по runId и возвращает её через get/list', async () => {
        const db = fakeDatabase();
        const service = new RunHistoryService({ database: db });
        await service.save(record('run-1', 100));

        const loaded = await service.get('run-1');
        expect(loaded?.runId).toBe('run-1');
        expect(loaded?.status).toBe('completed');
        expect(await service.get('missing')).toBeNull();
        expect((await service.list()).map((r) => r.runId)).toEqual(['run-1']);
    });

    it('ограничивает размер контента и хранит индекс без дублей', async () => {
        const db = fakeDatabase();
        const service = new RunHistoryService({ database: db });
        await service.save(record('run-1', 100));
        await service.save(record('run-1', 200));
        await service.save(record('run-2', 300));

        const loaded = await service.get('run-1');
        expect(loaded?.artifacts[0]!.content).toHaveLength(2000);
        expect(db.store.get('run-history:index')).toEqual(['run-1', 'run-2']);
        expect((await service.list()).map((r) => r.runId)).toEqual(['run-2', 'run-1']);
    });

    it('не ломается при ошибке хранилища', async () => {
        const db = fakeDatabase();
        db.setKv.mockRejectedValueOnce(new Error('indexeddb down'));
        const service = new RunHistoryService({ database: db });
        await expect(service.save(record('run-1', 100))).resolves.toBeUndefined();
        expect(await service.get('run-1')).toBeNull();
    });
});
