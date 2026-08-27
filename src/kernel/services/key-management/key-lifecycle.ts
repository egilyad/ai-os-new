import type { ApiKey } from '../../types/metrics-types';
import type { IRotationService } from '../../contracts/key-rotation';
import type { IKeyStateStore } from '../../contracts/key-state';
import { CONFIG } from '../config-registry';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('KeyLifecycle');

const COUNTERS_STORAGE_KEY = 'key_lifecycle_counters';

export type LifecycleState = 'active' | 'probation' | 'degraded' | 'quarantined' | 'recovering';

const LIFECYCLE_TRANSITIONS: Record<LifecycleState, LifecycleState[]> = {
    active: ['probation', 'degraded', 'quarantined'],
    probation: ['active', 'degraded', 'quarantined'],
    degraded: ['probation', 'quarantined', 'recovering'],
    quarantined: ['recovering'],
    recovering: ['active', 'probation', 'degraded', 'quarantined'],
};

export interface LifecycleTransition {
    keyId: string;
    from: LifecycleState;
    to: LifecycleState;
    reason: string;
    timestamp: number;
}

export interface LifecycleConfig {
    probationErrorThreshold: number;
    degradedErrorThreshold: number;
    quarantineErrorThreshold: number;
    recoverySuccessCount: number;
    recoveryCheckIntervalMs: number;
    autoRecoveryEnabled: boolean;
}

const DEFAULT_LIFECYCLE_CONFIG: LifecycleConfig = {
    probationErrorThreshold: 2,
    degradedErrorThreshold: 5,
    quarantineErrorThreshold: 10,
    recoverySuccessCount: 3,
    recoveryCheckIntervalMs: 60000,
    autoRecoveryEnabled: true,
};

export interface KeyLifecycleDeps {
    getKey: (id: string) => ApiKey | undefined;
    saveKeys: () => Promise<void>;
    notify: () => void;
    rotationService?: IRotationService;
    keyStateStore?: IKeyStateStore;
    keyHealth?: { cleanupKey(id: string): void };
    eventBus?: {
        emit: (event: string, data?: unknown) => void;
        emitOnce: (event: string, key: string, data?: unknown) => boolean;
    };
    database?: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
}

export class KeyLifecycle {
    private rotationTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
    private transitions: LifecycleTransition[] = [];
    private errorCounters = new Map<string, number>();
    private successCounters = new Map<string, number>();
    private config: LifecycleConfig;
    private recoveryTimer: ReturnType<typeof setInterval> | null = null;
    private _initialized = false;

    constructor(
        private deps: KeyLifecycleDeps,
        config?: Partial<LifecycleConfig>,
    ) {
        this.config = { ...DEFAULT_LIFECYCLE_CONFIG, ...config };
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        await this._load();
    }

    private async _load(): Promise<void> {
        if (!this.deps.database) return;
        try {
            const saved = await this.deps.database.getKv<{
                errorCounters: [string, number][];
                successCounters: [string, number][];
            }>(COUNTERS_STORAGE_KEY);
            if (saved) {
                this.errorCounters = new Map(saved.errorCounters);
                this.successCounters = new Map(saved.successCounters);
                LOGGER.info('KeyLifecycle', 'Counters restored from DB', {
                    errorCount: this.errorCounters.size,
                    successCount: this.successCounters.size,
                });
            }
        } catch (e) {
            LOGGER.warn('KeyLifecycle', 'Failed to load persisted counters', { error: e });
        }
    }

    private async _save(): Promise<void> {
        if (!this.deps.database) return;
        try {
            await this.deps.database.setKv(COUNTERS_STORAGE_KEY, {
                errorCounters: Array.from(this.errorCounters.entries()),
                successCounters: Array.from(this.successCounters.entries()),
            });
        } catch (e) {
            LOGGER.warn('KeyLifecycle', 'Failed to persist counters', { error: e });
        }
    }

    setKeyStateStore(store: IKeyStateStore): void {
        this.deps.keyStateStore = store;
    }

    setKeyTTL(id: string, ttlHours: number, autoRotate = false): void {
        if (this.deps.rotationService) {
            this.deps.rotationService.setKeyTTL(id, ttlHours, autoRotate);
        }
    }

    clearKeyTTL(id: string): void {
        if (this.deps.rotationService) {
            this.deps.rotationService.setKeyTTL(id, 0);
        }
    }

    async requestKeyRotation(id: string): Promise<boolean> {
        return this.deps.rotationService?.rotateNow(id) ?? false;
    }

    applySLA(key: ApiKey, mode: string): void {
        if (!key.stats?.extended) return;
        const ext = key.stats.extended;
        ext.activeSLA = mode as NonNullable<ApiKey['stats']['extended']>['activeSLA'];

        const profile = CONFIG.keys.slaProfiles[mode] ?? CONFIG.keys.slaProfiles.DEFAULT;
        ext.rules!.timeoutMs = profile!.timeoutMs;
        ext.rules!.slaThresholds.latencyP95 = profile!.latencyP95;
    }

    async setGlobalSLA(
        keys: ApiKey[],
        mode: string,
        saveKeys: () => Promise<void>,
        notify: () => void,
    ): Promise<void> {
        keys.forEach((k) => this.applySLA(k, mode));
        await saveKeys();
        notify();
    }

    startAutoRecovery(): void {
        if (!this.config.autoRecoveryEnabled || this.recoveryTimer) return;
        this.recoveryTimer = setInterval(
            () => this.checkRecovery(),
            this.config.recoveryCheckIntervalMs,
        );
    }

    stopAutoRecovery(): void {
        if (this.recoveryTimer) {
            clearInterval(this.recoveryTimer);
            this.recoveryTimer = null;
        }
    }

    onError(id: string): LifecycleState {
        const current = this.deps.keyStateStore?.get(id)?.lifecycleState || 'active';
        const errors = (this.errorCounters.get(id) || 0) + 1;
        this.errorCounters.set(id, errors);
        this.successCounters.delete(id);
        this._save();

        let next: LifecycleState = current;
        if (errors >= this.config.quarantineErrorThreshold) next = 'quarantined';
        else if (errors >= this.config.degradedErrorThreshold) next = 'degraded';
        else if (errors >= this.config.probationErrorThreshold) next = 'probation';

        // Guard: never propose a transition the state machine forbids (e.g. a key
        // already quarantined can only go to 'recovering', not back down to
        // 'degraded'/'probation'). Otherwise we spam "Invalid transition" WARNs
        // every error event for quarantined keys.
        if (!LIFECYCLE_TRANSITIONS[current].includes(next)) next = current;

        if (next !== current) {
            this.transition(
                id,
                current,
                next,
                `Error count ${errors}/${this.config.quarantineErrorThreshold}`,
            );
        }
        return next;
    }

    onSuccess(id: string): LifecycleState {
        const current = this.deps.keyStateStore?.get(id)?.lifecycleState || 'active';
        const errors = this.errorCounters.get(id) || 0;
        if (errors > 0) {
            const halved = Math.floor(errors / 2);
            if (halved <= 0) this.errorCounters.delete(id);
            else this.errorCounters.set(id, halved);
        }
        if (current === 'active' || current === 'recovering') {
            const successes = (this.successCounters.get(id) || 0) + 1;
            this.successCounters.set(id, successes);
            if (current === 'recovering' && successes >= this.config.recoverySuccessCount) {
                this.transition(
                    id,
                    'recovering',
                    'active',
                    `Recovery: ${successes} consecutive successes`,
                );
                this.errorCounters.delete(id);
                this.successCounters.delete(id);
                this.deps.keyHealth?.cleanupKey(id);
            }
            this._save();
            return current;
        }

        if (current === 'probation') {
            const successes = (this.successCounters.get(id) || 0) + 1;
            this.successCounters.set(id, successes);
            if (successes >= this.config.recoverySuccessCount) {
                this.transition(
                    id,
                    'probation',
                    'active',
                    `Recovery: ${successes} consecutive successes`,
                );
                this.errorCounters.delete(id);
                this.successCounters.delete(id);
                return 'active';
            }
            this._save();
            return current;
        }

        this.successCounters.set(id, (this.successCounters.get(id) || 0) + 1);
        this._save();
        return current;
    }

    getState(id: string): LifecycleState {
        return this.deps.keyStateStore?.get(id)?.lifecycleState || 'active';
    }

    getTransitions(id?: string): LifecycleTransition[] {
        return id ? this.transitions.filter((t) => t.keyId === id) : [...this.transitions];
    }

    isRoutable(state: LifecycleState): boolean {
        return state !== 'quarantined';
    }

    getWeightMultiplier(state: LifecycleState): number {
        switch (state) {
            case 'active':
                return 1;
            case 'probation':
                return 0.7;
            case 'degraded':
                return 0.4;
            case 'recovering':
                return 0.5;
            case 'quarantined':
                return 0;
        }
    }

    cleanupKey(id: string): void {
        const timer = this.rotationTimers.get(id);
        if (timer) {
            clearTimeout(timer);
            this.rotationTimers.delete(id);
        }
        this.errorCounters.delete(id);
        this.successCounters.delete(id);
        this._save();
    }

    destroy(): void {
        this.stopAutoRecovery();
        this.rotationTimers.forEach((t) => clearTimeout(t));
        this.rotationTimers.clear();
        this.transitions = [];
        this.errorCounters.clear();
        this.successCounters.clear();
        this._save();
    }

    private transition(id: string, from: LifecycleState, to: LifecycleState, reason: string): void {
        if (from === to) return;
        const allowed = LIFECYCLE_TRANSITIONS[from];
        if (!allowed.includes(to)) {
            LOGGER.warn(
                'KeyLifecycle',
                `Invalid transition: ${from} -> ${to} for key ${id}. Skipping.`,
            );
            return;
        }

        const timestamp = Date.now();
        this.deps.keyStateStore?.update(id, { lifecycleState: to });
        this.transitions.push({ keyId: id, from, to, reason, timestamp });
        if (this.transitions.length > 100) this.transitions.shift();
        const key = this.deps.getKey(id);
        if (key) {
            this.deps.eventBus?.emitOnce(EVENTS.KEY_STATE_CHANGED, `${id}:${key.provider}:${to}`, {
                id,
                provider: key.provider,
                state: to,
                previousState: from,
            });
        }
    }

    private checkRecovery(): void {
        if (!this.deps.keyStateStore) return;
        try {
            for (const state of this.deps.keyStateStore.getAll()) {
                const id = state.id;
                const lifecycleState = state.lifecycleState;
                if (lifecycleState === 'quarantined' || lifecycleState === 'degraded') {
                    const errors = this.errorCounters.get(id) || 0;
                    if (
                        lifecycleState === 'quarantined' &&
                        errors < this.config.quarantineErrorThreshold * 0.5
                    ) {
                        this.transition(
                            id,
                            lifecycleState,
                            'recovering',
                            'Auto: error rate dropped',
                        );
                    } else if (
                        lifecycleState === 'degraded' &&
                        errors < this.config.degradedErrorThreshold * 0.5
                    ) {
                        this.transition(id, 'degraded', 'probation', 'Auto: error rate improving');
                    }
                }
            }
        } catch (e) {
            LOGGER.error('KeyLifecycle', 'checkRecovery failed', { error: e });
        }
    }
}
