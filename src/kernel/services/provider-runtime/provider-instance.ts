import type { ApiKey } from '../../types/metrics-types';
import { CONFIG } from '../config-registry';

export type InstanceStatus = 'idle' | 'active' | 'degraded' | 'backoff' | 'dead';

export interface ProviderInstanceConfig {
    readonly maxConcurrent: number;
    readonly maxRetries: number;
    readonly backoffBaseMs: number;
    readonly backoffMaxMs: number;
    readonly healthCheckIntervalMs: number;
}

const DEFAULT_CONFIG: ProviderInstanceConfig = {
    maxConcurrent: CONFIG.keys.defaultRules.maxConcurrentRequests,
    maxRetries: CONFIG.llm.retry.maxRetries,
    backoffBaseMs: CONFIG.llm.retry.baseDelayMs,
    backoffMaxMs: CONFIG.keys.maxBackoffMs,
    healthCheckIntervalMs: CONFIG.keys.healthCheckTimeoutMs,
};

export interface IProviderInstance {
    readonly id: string;
    readonly key: ApiKey;
    status: InstanceStatus;
    concurrent: number;
    lastLatency: number;
    avgLatency: number;
    errorCount: number;
    successCount: number;
    lastErrorAt: number | null;
    isAvailable(): boolean;
    acquire(): boolean;
    release(): void;
    recordSuccess(latency: number): void;
    recordError(): void;
    getBackoffMs(): number;
    getHealth(): { healthy: boolean; reason?: string };
    getLoadFactor(): number;
    getConfig(): ProviderInstanceConfig;
}

export class ProviderInstance implements IProviderInstance {
    readonly id: string;
    readonly key: ApiKey;
    status: InstanceStatus = 'idle';
    concurrent = 0;
    lastLatency = 0;
    avgLatency = 0;
    errorCount = 0;
    successCount = 0;
    lastErrorAt: number | null = null;

    private _config: ProviderInstanceConfig;
    private backoffLevel = 0;
    private lastBackoffAt = 0;
    private latencyWindow: number[] = [];
    private slidingErrors: number[] = [];
    private slidingSuccesses: number[] = [];
    private static readonly ERROR_WINDOW_MS = 300_000; // 5 min sliding window

    constructor(key: ApiKey, config?: Partial<ProviderInstanceConfig>) {
        this.id = key.id;
        this.key = key;
        this._config = { ...DEFAULT_CONFIG, ...config };
    }

    isAvailable(): boolean {
        if (this.status === 'dead') return false;
        if (this.status === 'backoff') {
            if (Date.now() - this.lastBackoffAt >= this.getBackoffMs()) return true;
            return false;
        }
        if (this.concurrent >= this._config.maxConcurrent) return false;
        return true;
    }

    private tryRecoverFromBackoff(): void {
        if (this.status === 'backoff' && Date.now() - this.lastBackoffAt >= this.getBackoffMs()) {
            this.status = 'idle';
        }
    }

    acquire(): boolean {
        this.tryRecoverFromBackoff();
        if (!this.isAvailable()) return false;
        this.concurrent++;
        this.status = 'active';
        return true;
    }

    release(): void {
        this.concurrent = Math.max(0, this.concurrent - 1);
        if (this.concurrent === 0 && this.status === 'active') {
            this.status = 'idle';
        }
    }

    recordSuccess(latency: number): void {
        this.successCount++;
        this.slidingSuccesses.push(Date.now());
        this.pruneSlidingSuccesses();
        this.lastLatency = latency;
        this.latencyWindow.push(latency);
        if (this.latencyWindow.length > 20) this.latencyWindow.shift();
        this.avgLatency = this.latencyWindow.reduce((a, b) => a + b, 0) / this.latencyWindow.length;
        this.backoffLevel = 0;
        this.lastErrorAt = null;
        if (this.status === 'degraded' || this.status === 'backoff') {
            this.status = 'idle';
        }
    }

    recordError(): void {
        this.errorCount++;
        this.lastErrorAt = Date.now();
        this.backoffLevel++;
        this.lastBackoffAt = Date.now();
        this.slidingErrors.push(Date.now());
        this.pruneSlidingErrors();
        this.concurrent = Math.max(0, this.concurrent - 1);

        if (this.backoffLevel >= this._config.maxRetries) {
            this.status = 'dead';
        } else {
            this.status = 'backoff';
        }
    }

    private pruneSlidingErrors(): void {
        const cutoff = Date.now() - ProviderInstance.ERROR_WINDOW_MS;
        while (this.slidingErrors.length > 0 && this.slidingErrors[0]! < cutoff) {
            this.slidingErrors.shift();
        }
    }

    private pruneSlidingSuccesses(): void {
        const cutoff = Date.now() - ProviderInstance.ERROR_WINDOW_MS;
        while (this.slidingSuccesses.length > 0 && this.slidingSuccesses[0]! < cutoff) {
            this.slidingSuccesses.shift();
        }
    }

    getBackoffMs(): number {
        const delay = Math.min(
            this._config.backoffBaseMs * Math.pow(2, this.backoffLevel),
            this._config.backoffMaxMs,
        );
        return delay;
    }

    getHealth(): { healthy: boolean; reason?: string } {
        if (this.status === 'dead') return { healthy: false, reason: 'Instance is dead' };
        if (this.status === 'backoff')
            return { healthy: false, reason: `Backoff for ${this.getBackoffMs()}ms` };
        if (this.concurrent >= this._config.maxConcurrent)
            return { healthy: false, reason: 'Max concurrency reached' };

        this.pruneSlidingErrors();
        this.pruneSlidingSuccesses();
        const windowErrors = this.slidingErrors.length;
        const windowSuccesses = this.slidingSuccesses.length;
        if (windowErrors > 3 && windowSuccesses === 0)
            return {
                healthy: false,
                reason: `${windowErrors} errors in last 5 min, no recent successes`,
            };
        if (windowErrors > 3 && windowErrors > windowSuccesses * 2 && windowSuccesses > 0)
            return { healthy: false, reason: `High error rate: ${windowErrors} in 5 min` };

        return { healthy: true };
    }

    getLoadFactor(): number {
        return this.concurrent / this._config.maxConcurrent;
    }

    getConfig(): ProviderInstanceConfig {
        return { ...this._config };
    }

    updateConfig(partial: Partial<ProviderInstanceConfig>): void {
        this._config = { ...this._config, ...partial };
    }

    reset(): void {
        this.status = 'idle';
        this.concurrent = 0;
        this.backoffLevel = 0;
        this.lastBackoffAt = 0;
        this.lastErrorAt = null;
        this.slidingSuccesses = [];
        this.slidingErrors = [];
    }
}
