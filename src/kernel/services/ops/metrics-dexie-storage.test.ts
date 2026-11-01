import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MetricSeries } from '../../contracts/metrics';

const mockKeyValue = {
    put: vi.fn(async () => {}),
    get: vi.fn(async (): Promise<{ value?: Record<string, MetricSeries> } | null> => null),
};

vi.mock('../database-service', () => ({
    getDexieDb: () => ({ keyValue: mockKeyValue }),
}));

import { DexieMetricsStorage } from './metrics-dexie-storage';

function emptySeries(name: string, kind: MetricSeries['kind']): MetricSeries {
    return { name, kind, points: [], summary: { count: 0, sum: 0, min: 0, max: 0, percentiles: {} } };
}

describe('DexieMetricsStorage', () => {
    beforeEach(() => {
        mockKeyValue.put.mockClear();
        mockKeyValue.get.mockClear();
    });

    it('save пишет серии одной KV-записью', async () => {
        const storage = new DexieMetricsStorage();
        const series: Record<string, MetricSeries> = {
            a: emptySeries('a', 'counter'),
        };
        await storage.save(series);
        expect(mockKeyValue.put).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'metrics:series', value: series }),
        );
    });

    it('load возвращает сохранённые серии', async () => {
        const data: Record<string, MetricSeries> = {
            a: { ...emptySeries('a', 'gauge'), points: [{ ts: 1, value: 1 }] },
        };
        mockKeyValue.get.mockResolvedValue({ value: data });
        const storage = new DexieMetricsStorage();
        const loaded = await storage.load();
        expect(loaded['a'].kind).toBe('gauge');
        expect(loaded['a'].points).toHaveLength(1);
    });

    it('load при отсутствии данных возвращает пусто', async () => {
        mockKeyValue.get.mockResolvedValue(null);
        const storage = new DexieMetricsStorage();
        expect(await storage.load()).toEqual({});
    });
});
