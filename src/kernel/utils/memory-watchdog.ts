/**
 * Lightweight memory watchdog — logs heap usage every N seconds.
 * Warns if heap grows more than a threshold within the interval.
 *
 * Usage:
 *   import { MemoryWatchdog } from '../utils/memory-watchdog';
 *   const watchdog = new MemoryWatchdog({ intervalMs: 5000, thresholdMB: 100 });
 *   watchdog.start();
 *   // later: watchdog.stop();
 */

import type { IEventBus } from '../types/interfaces';
import { EVENTS } from '../events/event-names';
import { rootLogger } from '../services/logger-service';

const LOGGER = rootLogger.child('MemoryWatchdog');

export interface WatchdogOptions {
    /** How often to log (ms). Default: 5000 */
    intervalMs?: number;
    /** Heap delta (MB) to trigger warning. Default: 100 */
    thresholdMB?: number;
    /** Absolute heap threshold (MB) to trigger warning. Default: 500 */
    absoluteThresholdMB?: number;
}

export class MemoryWatchdog {
    private timer: ReturnType<typeof setInterval> | null = null;
    private lastHeapMB = 0;
    private readonly intervalMs: number;
    private readonly thresholdMB: number;
    private readonly absoluteThresholdMB: number;
    private enabled: boolean;
    private pressureCallbacks: Array<() => void> = [];
    private readonly _eventBus: IEventBus | null;

    constructor(opts?: WatchdogOptions, eventBus?: IEventBus) {
        this.intervalMs = opts?.intervalMs ?? 5000;
        this.thresholdMB = opts?.thresholdMB ?? 100;
        this.absoluteThresholdMB = opts?.absoluteThresholdMB ?? 200;
        this.enabled = typeof performance !== 'undefined' && 'memory' in performance;
        this._eventBus = eventBus ?? null;
    }

    /** Register a callback to fire when heap exceeds absoluteThresholdMB. */
    onPressure(cb: () => void): void {
        this.pressureCallbacks.push(cb);
    }

    start(): void {
        if (!this.enabled || this.timer) return;
        this.lastHeapMB = this.currentMB();
        this.timer = setInterval(() => this.tick(), this.intervalMs);
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    getStats(): { currentMB: number; deltaMB: number; enabled: boolean } {
        return {
            currentMB: this.currentMB(),
            deltaMB: this.currentMB() - this.lastHeapMB,
            enabled: this.enabled,
        };
    }

    private currentMB(): number {
        if (!this.enabled) return 0;
        const mem = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
        return mem.usedJSHeapSize / (1024 * 1024);
    }

    private tick(): void {
        try {
            const current = this.currentMB();
            const delta = current - this.lastHeapMB;
            this.lastHeapMB = current;

            LOGGER.debug('MemoryWatchdog', 'heap usage', {
                currentMB: current.toFixed(1),
                deltaMB: delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1),
            });

            // HIGH-K7: emit via queueMicrotask to avoid recursion from handler chains
            if (delta > this.thresholdMB) {
                const msg = `heap grew ${delta.toFixed(1)}MB in ${this.intervalMs}ms (now ${current.toFixed(1)}MB)`;
                LOGGER.warn('MemoryWatchdog', 'OOM risk', { message: msg });
                queueMicrotask(() =>
                    this._eventBus?.emit(EVENTS.NOTIFICATION, {
                        message: `[MemoryWatchdog] ${msg}`,
                        type: 'warning',
                    }),
                );
            }

            if (current > this.absoluteThresholdMB) {
                const msg = `heap at ${current.toFixed(1)}MB exceeds absolute threshold ${this.absoluteThresholdMB}MB`;
                LOGGER.warn('MemoryWatchdog', 'OOM risk', { message: msg });
                queueMicrotask(() =>
                    this._eventBus?.emit(EVENTS.NOTIFICATION, {
                        message: `[MemoryWatchdog] ${msg}`,
                        type: 'error',
                    }),
                );
                // Proactive: fire pressure callbacks to clear caches before OOM
                for (const cb of this.pressureCallbacks) {
                    try {
                        cb();
                    } catch (e) {
                        LOGGER.warn('MemoryWatchdog', 'pressure callback failed', { error: e });
                    }
                }
            }
        } catch (e) {
            LOGGER.warn('MemoryWatchdog', 'tick failed', { error: e });
        }
    }
}
