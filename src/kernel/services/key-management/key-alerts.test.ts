import { describe, it, expect, vi } from 'vitest';
import { KeyAlerts } from './key-alerts';
import type { ApiKey, ProviderAlert } from '../../types/metrics-types';

function alert(partial: Partial<ProviderAlert> = {}): ProviderAlert {
    return {
        id: 'a1',
        type: 'quota_exceeded',
        severity: 'critical',
        message: 'quota',
        timestamp: Date.now(),
        resolved: false,
        ...partial,
    };
}

function keyWithAlerts(id: string, alerts: ProviderAlert[] = []): ApiKey {
    return {
        id,
        provider: 'openai',
        key: 'sk-1',
        label: id,
        status: 'active',
        stats: {
            successCount: 0,
            errorCount: 0,
            totalTokens: 0,
            avgLatency: 0,
            minLatency: 0,
            maxLatency: 0,
            extended: { alerts } as never,
        },
    } as ApiKey;
}

function makeDeps() {
    return { eventBus: { emit: vi.fn() } };
}

describe('KeyAlerts', () => {
    it('addAlert appends and notifies; dedups identical unresolved within an hour', () => {
        const deps = makeDeps();
        const alerts = new KeyAlerts(deps);
        const k = keyWithAlerts('k1');
        alerts.addAlert(k, { type: 'quota_exceeded', severity: 'critical', message: 'quota' });
        alerts.addAlert(k, { type: 'quota_exceeded', severity: 'critical', message: 'quota' });
        expect(k.stats.extended?.alerts).toHaveLength(1);
        expect(deps.eventBus.emit).toHaveBeenCalledTimes(1);
    });

    it('getAlerts returns only unresolved alerts sorted by recency', () => {
        const deps = makeDeps();
        const alerts = new KeyAlerts(deps);
        const k = keyWithAlerts('k1', [
            alert({ id: 'old', timestamp: 100, resolved: true }),
            alert({ id: 'new', timestamp: 300 }),
        ]);
        const result = alerts.getAlerts([k]);
        expect(result.map((a) => a.id)).toEqual(['new']);
    });

    it('resolveAlert marks resolved and emits KEY_ALERT_RESOLVED', () => {
        const deps = makeDeps();
        const alerts = new KeyAlerts(deps);
        const k = keyWithAlerts('k1', [alert()]);
        alerts.resolveAlert([k], 'a1');
        expect(k.stats.extended?.alerts?.[0]?.resolved).toBe(true);
        expect(deps.eventBus.emit).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ alertId: 'a1', keyId: 'k1' }),
        );
    });

    it('getAlertSummary counts total/unresolved/critical', () => {
        const deps = makeDeps();
        const alerts = new KeyAlerts(deps);
        const k = keyWithAlerts('k1', [
            alert({ severity: 'critical' }),
            alert({ id: 'a2', severity: 'medium', resolved: true }),
            alert({ id: 'a3', severity: 'high' }),
        ]);
        const summary = alerts.getAlertSummary([k]);
        expect(summary.total).toBe(3);
        expect(summary.unresolved).toBe(2);
        expect(summary.critical).toBe(1);
    });
});
