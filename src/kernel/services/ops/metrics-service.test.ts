import { describe, expect, it } from 'vitest';
import type { IMetricsStorage, MetricSeries } from '../../contracts/metrics';
import { MetricsService } from './metrics-service';

class MemoryStorage implements IMetricsStorage {
    data: Record<string, MetricSeries> = {};
    async save(series: Record<string, MetricSeries>): Promise<void> {
        this.data = series;
    }
    async load(): Promise<Record<string, MetricSeries>> {
        return this.data;
    }
}

describe('MetricsService (SPEC_03)', () => {
    it('inc/record/gauge накапливают очки', () => {
        const m = new MetricsService();
        m.inc('llm.request');
        m.inc('llm.request', 2);
        m.record('llm.latency', 100);
        m.record('llm.latency', 200);
        m.gauge('provider.active', 3);
        const snap = m.snapshot();
        expect(snap['llm.request'].kind).toBe('counter');
        expect(snap['llm.request'].summary.sum).toBe(3);
        expect(snap['llm.latency'].summary.count).toBe(2);
        expect(snap['llm.latency'].summary.min).toBe(100);
        expect(snap['llm.latency'].summary.max).toBe(200);
        expect(snap['provider.active'].summary.sum).toBe(3);
    });

    it('теги разделяют серии', () => {
        const m = new MetricsService();
        m.inc('llm.request', 1, { provider: 'gemini' });
        m.inc('llm.request', 1, { provider: 'openrouter' });
        const snap = m.snapshot();
        expect(Object.keys(snap).length).toBe(2);
        expect(snap['llm.request{provider=gemini}']).toBeDefined();
        expect(snap['llm.request{provider=openrouter}']).toBeDefined();
    });

    it('percentiles считает линейно', () => {
        const m = new MetricsService();
        for (let i = 1; i <= 10; i++) m.record('m', i);
        const s = m.snapshot()['m'];
        const p = m.percentiles(s, [0.5, 0.9]);
        expect(p['0.5']).toBeCloseTo(5.5, 5);
        expect(p['0.9']).toBeCloseTo(9.1, 5);
    });

    it('subscribe/отписка', () => {
        const m = new MetricsService();
        let calls = 0;
        const unsub = m.subscribe('ev', () => calls++);
        m.inc('ev');
        expect(calls).toBe(1);
        unsub();
        m.inc('ev');
        expect(calls).toBe(1);
    });

    it('flush сохраняет в storage', async () => {
        const storage = new MemoryStorage();
        const m = new MetricsService(storage);
        m.record('lat', 50);
        m.record('lat', 150);
        await m.flush();
        expect(storage.data['lat']).toBeDefined();
        expect(storage.data['lat'].summary.percentiles['0.5']).toBeCloseTo(100, 5);
    });

    it('snapshot поддерживает wildcard-префикс', () => {
        const m = new MetricsService();
        m.inc('llm.request');
        m.inc('llm.latency', 1, { provider: 'x' });
        m.inc('memory.writes');
        const llm = m.snapshot('llm.*');
        expect(Object.keys(llm).length).toBe(2);
        expect(llm['llm.request']).toBeDefined();
        expect(llm['memory.writes']).toBeUndefined();
    });

    it('subscribe по паттерну получает события подходящих серий', () => {
        const m = new MetricsService();
        let got: string[] = [];
        const unsub = m.subscribe('llm.*', (s) => got.push(s.name));
        m.inc('llm.request');
        m.inc('llm.latency', 5);
        m.inc('memory.writes');
        expect(got).toEqual(['llm.request', 'llm.latency']);
        unsub();
        m.inc('llm.request');
        expect(got.length).toBe(2);
    });
});
