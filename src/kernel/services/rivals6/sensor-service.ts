/**
 * SensorService — K.2 (Airflow-style sensors, additive).
 *
 * Pokes a tool until its output contains `expect` (or timeout). Bounded
 * attempts, no unbounded sleeping: interval is honored between attempts but
 * the total is capped by timeoutMs. Reschedule mode returns after each miss
 * so an outer scheduler can re-drive (same contract, `reschedule: true`).
 */
import type { IEventBus } from '../../types/interfaces';
import type { IToolRunnerService } from '../../contracts/parity';
import type { ISensorService } from '../../contracts/rivals6';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Sensor');

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export class SensorService implements ISensorService {
    constructor(
        private events: IEventBus,
        private tools?: IToolRunnerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Sensor', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async poke(input: {
        tool: string;
        args?: Record<string, unknown>;
        expect?: string;
        intervalMs?: number;
        timeoutMs?: number;
    }): Promise<{ ok: boolean; attempts: number; last: string }> {
        if (!this.tools) throw new Error('Tool runner unavailable');
        const interval = Math.max(0, Math.min(30000, input.intervalMs ?? 1000));
        const timeout = Math.max(1000, Math.min(300000, input.timeoutMs ?? 30000));
        const expect = input.expect ?? '';
        const deadline = Date.now() + timeout;
        let attempts = 0;
        let last: string;
        for (;;) {
            attempts += 1;
            try {
                last = await this.tools.callTool('sensor', input.tool, input.args ?? {});
            } catch (e) {
                last = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
            }
            if (!expect || last.includes(expect)) {
                this.events.emit(EVENTS.SENSOR_OK, { tool: input.tool, attempts });
                return { ok: true, attempts, last: last.slice(0, 2000) };
            }
            if (Date.now() + interval >= deadline || attempts >= 60) {
                return { ok: false, attempts, last: last.slice(0, 2000) };
            }
            await sleep(interval);
        }
    }
}
