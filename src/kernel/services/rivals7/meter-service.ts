/**
 * MeterService — M.3 (Grafana-style meters + alerts, additive).
 *
 * Counters, gauges and histogram observations in DAL kv (ring buffers,
 * cap 500 points). Alert rules fire once per breach window and notify
 * through the mobile inbox (best-effort) + event.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IMobileAccessService } from '../../contracts/ops';
import type { IMeterService } from '../../contracts/rivals7';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Meter');

const CAP = 500;

interface AlertRule {
    name: string;
    threshold: number;
    direction: 'above' | 'below';
    lastFiredAt?: number;
}

export class MeterService implements IMeterService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private inbox?: IMobileAccessService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Meter', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async inc(name: string, by = 1): Promise<void> {
        const key = `meter-counter/${name.slice(0, 120)}`;
        const v = ((await this.dal.kv.get<number>(key)) ?? 0) + by;
        await this.dal.kv.set(key, v);
        await this.push(name, v);
    }

    async gauge(name: string, value: number): Promise<void> {
        await this.dal.kv.set(`meter-gauge/${name.slice(0, 120)}`, value);
        await this.push(name, value);
    }

    async observe(name: string, value: number): Promise<void> {
        await this.push(name, value);
    }

    async series(name: string, last = 100): Promise<Array<{ at: number; value: number }>> {
        const pts = (await this.dal.kv.get<Array<{ at: number; value: number }>>(`meter-series/${name}`)) ?? [];
        return pts.slice(-Math.max(1, last));
    }

    async addAlert(name: string, threshold: number, direction: 'above' | 'below' = 'above'): Promise<void> {
        const rules = (await this.dal.kv.get<AlertRule[]>(`meter-alerts`)) ?? [];
        const rest = rules.filter((r) => r.name !== name);
        rest.push({ name: name.slice(0, 120), threshold, direction });
        await this.dal.kv.set('meter-alerts', rest);
    }

    async checkAlerts(): Promise<Array<{ name: string; value: number }>> {
        const rules = (await this.dal.kv.get<AlertRule[]>(`meter-alerts`)) ?? [];
        const fired: Array<{ name: string; value: number }> = [];
        for (const rule of rules) {
            const pts = await this.series(rule.name, 1);
            const value = pts.length > 0 ? (pts[pts.length - 1]!.value as number) : undefined;
            if (value === undefined) continue;
            const breach =
                rule.direction === 'above' ? value > rule.threshold : value < rule.threshold;
            if (!breach) continue;
            // Once per breach window: skip if fired in the last 5 minutes.
            if (rule.lastFiredAt && Date.now() - rule.lastFiredAt < 5 * 60 * 1000) continue;
            rule.lastFiredAt = Date.now();
            fired.push({ name: rule.name, value });
            this.events.emit(EVENTS.METER_ALERT, { name: rule.name, value });
            if (this.inbox) {
                try {
                    await this.inbox.notify({
                        title: `Alert: ${rule.name}`,
                        body: `${rule.direction} ${rule.threshold} (now ${value})`,
                        actionRef: `metric:${rule.name}`,
                    });
                } catch {
                    // inbox best-effort
                }
            }
        }
        if (fired.length > 0) {
            const all = (await this.dal.kv.get<AlertRule[]>(`meter-alerts`)) ?? [];
            await this.dal.kv.set('meter-alerts', all.map((r) => {
                const f = fired.find((x) => x.name === r.name);
                return f ? { ...r, lastFiredAt: Date.now() } : r;
            }));
        }
        return fired;
    }

    private async push(name: string, value: number): Promise<void> {
        const key = `meter-series/${name.slice(0, 120)}`;
        const pts = (await this.dal.kv.get<Array<{ at: number; value: number }>>(key)) ?? [];
        pts.push({ at: Date.now(), value });
        if (pts.length > CAP) pts.splice(0, pts.length - CAP);
        await this.dal.kv.set(key, pts);
    }
}
