import { getDexieDb } from '../database-service';
import type { IMetricsStorage, MetricSeries } from '../../contracts/metrics';

const STORAGE_KEY = 'metrics:series';

/**
 * DexieMetricsStorage — персистентный слой для MetricsService (SPEC_03).
 *
 * Хранит весь снимок серий одной KV-записью (Dexie keyValue). Т.к. это
 * единый зашифрованный/сериализованный документ, запись атомарна по построению.
 */
export class DexieMetricsStorage implements IMetricsStorage {
    async save(series: Record<string, MetricSeries>): Promise<void> {
        const db = getDexieDb();
        await db.keyValue.put({ id: STORAGE_KEY, value: series, createdAt: Date.now() });
    }

    async load(): Promise<Record<string, MetricSeries>> {
        try {
            const db = getDexieDb();
            const row = await db.keyValue.get(STORAGE_KEY);
            const value = row?.value;
            if (value && typeof value === 'object') {
                return value as Record<string, MetricSeries>;
            }
        } catch {
            // БД может быть недоступна на ранних этапах — возвращаем пусто.
        }
        return {};
    }
}
