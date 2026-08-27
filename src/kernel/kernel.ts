import type {
    SystemState,
    DecisionTrace,
    SLAMode,
    RuntimeAggregate,
    BudgetAggregate,
} from './types/metrics-types';
import type { IKernel, KernelDeps, IProviderTracker } from './types/interfaces';
import type { ITransaction } from './contracts/transaction';
import type { EventMap } from './types/event-map';
import { TransactionContext } from './services/transaction';
import {
    updateAdaptiveWeights as updateWeights,
    setSLAMode as setSLAWeights,
} from './weight-optimizer';
import { rootLogger } from './services/logger-service';
import { EVENTS } from './events/event-names';
import { estimateTokens } from './utils/tokenEstimate';
import { safeJsonParse } from '../kernel/utils/safe-json';

const ALPHA = 0.15;

function getLogger() {
    return rootLogger?.child('Kernel');
}

const STORAGE_KEY = 'super_agents_kernel_state';
const DB_TIMEOUT = 5_000;
const VALID_SLA_MODES: SLAMode[] = [
    'LOW_LATENCY',
    'HIGH_QUALITY',
    'BALANCED',
    'ECONOMY',
    'FREE_FIRST',
];

export class SystemKernel implements IKernel {
    private readonly deps: KernelDeps;
    private state: SystemState = this.getInitialState();
    private isDirty = false;
    // KC-H02: Cache frozen state to avoid O(n) structuredClone + deepFreeze on every getState() call.
    // Only recompute when isDirty becomes true (state was mutated).
    private cachedFrozenState: Readonly<SystemState> | null = null;
    private unsubs: Array<() => void> = [];
    private saveTimeout: ReturnType<typeof setTimeout> | null = null;
    #beforeUnloadHandler: (() => void) | null = null;

    constructor(deps: KernelDeps) {
        this.deps = deps;
    }

    destroy() {
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
        if (typeof window !== 'undefined' && this.#beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this.#beforeUnloadHandler);
            this.#beforeUnloadHandler = null;
        }
    }

    async transaction<T>(fn: (tx: ITransaction) => Promise<T>): Promise<T> {
        const tx = new TransactionContext('kernel');
        try {
            const result = await fn(tx);
            await tx.commit({
                emit: (event: string, data?: unknown) =>
                    this.deps.eventBus.emit(event as keyof EventMap, data),
            });
            return result;
        } catch (e) {
            await tx.rollback({
                emit: (event: string, data?: unknown) =>
                    this.deps.eventBus.emit(event as keyof EventMap, data),
            });
            throw e;
        }
    }

    private initPromise: Promise<void> | null = null;
    async init() {
        if (this.initPromise) return this.initPromise;
        this.initPromise = (async () => {
            try {
                await this.loadFromStorage();
                this.setupListeners();
                if (typeof window !== 'undefined') {
                    this.#beforeUnloadHandler = () => this.saveToStorage();
                    window.addEventListener('beforeunload', this.#beforeUnloadHandler);
                }
            } catch (e) {
                this.initPromise = null;
                throw e;
            }
        })();
        return this.initPromise;
    }

    private async loadFromStorage() {
        try {
            let timer: ReturnType<typeof setTimeout> | undefined;
            const dbPromise = this.deps.database.getKv<string>(STORAGE_KEY);
            dbPromise.catch((e) => {
                if (import.meta.env.DEV)
                    getLogger()?.warn('Kernel', 'DB load failed', { error: e });
            });
            const saved = await Promise.race([
                dbPromise,
                new Promise<undefined>((_, reject) => {
                    timer = setTimeout(() => reject(new Error('Database timeout')), DB_TIMEOUT);
                }),
            ]);
            clearTimeout(timer);
            if (saved) {
                this.loadState(saved);
            }
        } catch (e) {
            this.deps.eventBus?.emit(EVENTS.KERNEL_LOAD_FAILED as keyof EventMap, {
                error: String(e),
            });
            this.deps.eventBus?.emit(EVENTS.KERNEL_STATE_RESET as keyof EventMap, {
                reason: `DB load failed: ${String(e)}`,
            });
            this.deps.eventBus?.emit(EVENTS.NOTIFICATION as keyof EventMap, {
                message:
                    'Kernel state load failed вЂ” reset to defaults. SLA, weights, and budget may have been reset.',
                type: 'warning',
            });
        }
    }

    private async saveToStorage() {
        try {
            await this.deps.database.setKv(STORAGE_KEY, this.dumpState());
            this.isDirty = false;
        } catch (e) {
            this.deps.eventBus?.emit(EVENTS.KERNEL_PERSIST_FAILED as keyof EventMap, {
                error: String(e),
            });
        }
    }

    private getInitialState(): SystemState {
        return {
            providers: {},
            weights: {
                base: { ttft: 0.4, tps: 0.2, reliability: 0.4 },
                adaptiveDelta: { ttft: 0, tps: 0, reliability: 0 },
                effective: { ttft: 0.4, tps: 0.2, reliability: 0.4 },
            },
            decisions: [],
            totalRequests: 0,
            totalTokens: 0,
            estimatedCost: 0,
            explorationFactor: 0.1,
            history: [],
            violations: [],
            activeSLA: 'BALANCED',
        };
    }

    private setupListeners() {
        this.unsubs.push(
            this.deps.eventBus.on(EVENTS.STREAM_END, (data) => this.reduce('METRIC_UPDATE', data)),
            this.deps.eventBus.on(EVENTS.STREAM_ERROR, (data) => this.reduce('METRIC_ERROR', data)),
            this.deps.eventBus.on(EVENTS.DECISION, (data) => this.reduce('DECISION_MADE', data)),
            this.deps.eventBus.on(EVENTS.ROUTER_SIGNAL, (data) =>
                this.reduce('LEARNING_SIGNAL', data),
            ),
            this.deps.eventBus.on(EVENTS.PROVIDER_RUNTIME_STATE, (data) =>
                this.reduce('PROVIDER_RUNTIME_STATE', data),
            ),
            this.deps.eventBus.on(EVENTS.PROVIDER_RUNTIME_BUDGET, (data) =>
                this.reduce('PROVIDER_RUNTIME_BUDGET', data),
            ),
        );
    }

    private get tracker(): IProviderTracker {
        return this.deps.providerTracker;
    }

    private reduce(type: string, payload: unknown) {
        this.applyMutation(type, payload);
        this.isDirty = true;
        this.cachedFrozenState = null; // KC-H02: Invalidate cache on any state mutation
        this.deps.eventBus.emit(EVENTS.KERNEL_UPDATED, this.state);
        this.scheduleSave();
    }

    private scheduleSave(): void {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveTimeout = null;
            this.saveToStorage();
        }, 2000);
    }

    private applyMutation(type: string, payload: unknown): void {
        switch (type) {
            case 'METRIC_UPDATE': {
                const data = payload as {
                    provider?: string;
                    tokens?: number;
                    fullContent?: string;
                    latency: number;
                    ttft?: number;
                    model?: string;
                };
                if (!data.provider) break;
                const provKey = data.provider.toLowerCase();
                const base = this.state.providers[provKey] || {
                    id: provKey,
                    avgTTFT: 0,
                    avgTPS: 0,
                    reliability: 0,
                    stabilityIndex: 0,
                    reputationScore: 0,
                    totalRequests: 0,
                    estimatedCost: 0,
                    selectionRate: 0,
                    status: 'unknown' as const,
                };
                const tokens = data.tokens || estimateTokens(data.fullContent || '');
                const genTime = (data.latency - (data.ttft || 0)) / 1000;
                let currentTPS = base.avgTPS;
                if (genTime > 0 && tokens > 0) {
                    const raw = tokens / genTime;
                    if (isFinite(raw) && raw >= 0) currentTPS = raw;
                }
                base.avgTTFT = data.ttft
                    ? ALPHA * data.ttft + (1 - ALPHA) * base.avgTTFT
                    : base.avgTTFT;
                base.avgTPS = ALPHA * currentTPS + (1 - ALPHA) * base.avgTPS;
                const quality =
                    data.ttft && data.latency
                        ? Math.max(0, Math.min(1, 1 - data.ttft / data.latency))
                        : 0.9;
                base.reliability = ALPHA * quality + (1 - ALPHA) * base.reliability;
                base.stabilityIndex = Math.min(
                    1.0,
                    ALPHA * quality + (1 - ALPHA) * base.stabilityIndex,
                );
                base.reputationScore = Math.min(
                    100,
                    ALPHA * 100 + (1 - ALPHA) * base.reputationScore,
                );
                base.status =
                    base.reliability > 0.8
                        ? 'healthy'
                        : base.reliability > 0.4
                          ? 'degraded'
                          : 'offline';
                base.totalRequests++;
                this.state.providers[provKey] = base;
                this.state.totalRequests++;
                this.state.totalTokens += tokens;
                break;
            }
            case 'METRIC_ERROR': {
                const errData = payload as { provider: string };
                const eProvKey = errData.provider.toLowerCase();
                const eBase = this.state.providers[eProvKey] || {
                    id: eProvKey,
                    avgTTFT: 0,
                    avgTPS: 0,
                    reliability: 0,
                    stabilityIndex: 0,
                    reputationScore: 0,
                    totalRequests: 0,
                    estimatedCost: 0,
                    selectionRate: 0,
                    status: 'unknown' as const,
                };
                eBase.reliability = ALPHA * 0 + (1 - ALPHA) * eBase.reliability;
                eBase.stabilityIndex = Math.max(0, ALPHA * 0 + (1 - ALPHA) * eBase.stabilityIndex);
                eBase.reputationScore = Math.max(
                    0,
                    ALPHA * 0 + (1 - ALPHA) * eBase.reputationScore,
                );
                eBase.totalRequests++;
                this.state.providers[eProvKey] = eBase;
                this.state.totalRequests++;
                break;
            }
            case 'DECISION_MADE':
                this.state.decisions = [payload as DecisionTrace, ...this.state.decisions].slice(
                    0,
                    50,
                );
                break;
            case 'LEARNING_SIGNAL':
                this.updateAdaptiveWeights(
                    payload as {
                        provider: string;
                        success: boolean;
                        wasRaceWinner: boolean;
                        wasFallback: boolean;
                        ttft?: number;
                    },
                );
                break;
            case 'PROVIDER_RUNTIME_STATE': {
                const snap = payload as {
                    instances: unknown[];
                    totalActive: number;
                    totalDead: number;
                    totalBackoff: number;
                    totalIdle: number;
                    globalErrorRate: number;
                    globalLoadFactor: number;
                    timestamp: number;
                };
                this.state.runtime = {
                    totalActive: snap.totalActive,
                    totalDead: snap.totalDead,
                    totalBackoff: snap.totalBackoff,
                    totalIdle: snap.totalIdle,
                    globalErrorRate: snap.globalErrorRate,
                    globalLoadFactor: snap.globalLoadFactor,
                    lastUpdated: snap.timestamp,
                };
                break;
            }
            case 'PROVIDER_RUNTIME_BUDGET': {
                const snap = payload as {
                    global: {
                        totalCost: number;
                        totalTokens: number;
                        totalSessions: number;
                        activeSessions: number;
                    };
                    byProvider: unknown[];
                    limits: unknown;
                    exhausted: boolean;
                    timestamp: number;
                };
                this.state.budget = {
                    totalCost: snap.global.totalCost,
                    totalTokens: snap.global.totalTokens,
                    totalSessions: snap.global.totalSessions,
                    activeSessions: snap.global.activeSessions,
                    exhausted: snap.exhausted,
                    lastUpdated: snap.timestamp,
                };
                break;
            }
            default:
                getLogger()?.warn('Kernel', 'Unknown mutation type', { type });
        }
    }

    private markDirtyAndEmit(tx?: ITransaction) {
        this.isDirty = true;
        // KC-H02: Invalidate cached frozen state so next getState() recomputes.
        this.cachedFrozenState = null;
        if (tx) {
            tx.deferPersist(async () => {
                this.saveToStorage();
            });
            tx.deferEmit(EVENTS.KERNEL_UPDATED, this.state);
        } else {
            this.deps.eventBus.emit(EVENTS.KERNEL_UPDATED, this.state);
        }
    }

    private updateAdaptiveWeights(signal: {
        provider: string;
        success: boolean;
        wasRaceWinner: boolean;
        wasFallback: boolean;
        ttft?: number;
    }) {
        updateWeights(this.state, signal);
    }

    getHealthEvents(provider?: string, limit?: number) {
        return this.tracker.getHealthEvents(provider, limit);
    }

    getProviderRankings(catalogProviders?: string[]) {
        return this.tracker.getProviderRankings(catalogProviders);
    }

    getCollaborativeSuggestions(installedProviders?: string[]) {
        return this.tracker.getCollaborativeSuggestions(installedProviders);
    }

    dumpState() {
        return JSON.stringify({
            state: this.state,
            version: '2.1.0-safety',
        });
    }

    loadState(json: string) {
        try {
            const data = safeJsonParse(json);

            if (!data || typeof data !== 'object') throw new Error('Invalid JSON structure');
            const obj = data as { version?: string; state?: Record<string, unknown> };
            if (obj.version !== '2.1.0-safety') {
                this.state = this.getInitialState();
                this.isDirty = true;
                this.deps.eventBus?.emit(EVENTS.KERNEL_STATE_RESET as keyof EventMap, {
                    reason: `State version mismatch (got ${obj.version ?? 'undefined'}, expected 2.1.0-safety)`,
                });
                this.deps.eventBus?.emit(EVENTS.NOTIFICATION as keyof EventMap, {
                    message: 'Kernel state version mismatch вЂ” reset to defaults.',
                    type: 'warning',
                });
                return;
            }
            if (!obj.state || typeof obj.state !== 'object')
                throw new Error('Invalid state structure');

            const parsed = this.validateState(obj.state);
            this.state = parsed;
            this.isDirty = false;
            this.cachedFrozenState = null; // KC-H02: Invalidate cache on state reload
            this.deps.eventBus.emit(EVENTS.KERNEL_UPDATED, this.state);
        } catch (e) {
            getLogger()?.warn('Kernel', 'loadState failed, resetting to defaults', { error: e });
            this.state = this.getInitialState();
            this.isDirty = true;
            this.deps.eventBus?.emit(EVENTS.KERNEL_STATE_RESET as keyof EventMap, {
                reason: `loadState parse error: ${e instanceof Error ? e.message : String(e)}`,
            });
            this.deps.eventBus?.emit(EVENTS.NOTIFICATION as keyof EventMap, {
                message: 'Kernel state corrupt вЂ” reset to defaults.',
                type: 'warning',
            });
        }
    }

    private validateState(raw: unknown): SystemState {
        if (!raw || typeof raw !== 'object') throw new Error('State must be an object');
        const s = raw as Record<string, unknown>;
        const init = this.getInitialState();
        return {
            providers:
                s.providers && typeof s.providers === 'object'
                    ? (s.providers as SystemState['providers'])
                    : init.providers,
            weights: this.validateWeights(s.weights),
            decisions: Array.isArray(s.decisions)
                ? (s.decisions as DecisionTrace[])
                : init.decisions,
            totalRequests:
                typeof s.totalRequests === 'number' ? s.totalRequests : init.totalRequests,
            totalTokens: typeof s.totalTokens === 'number' ? s.totalTokens : init.totalTokens,
            estimatedCost:
                typeof s.estimatedCost === 'number' ? s.estimatedCost : init.estimatedCost,
            explorationFactor:
                typeof s.explorationFactor === 'number'
                    ? s.explorationFactor
                    : init.explorationFactor,
            history: Array.isArray(s.history)
                ? (s.history as SystemState['history'])
                : init.history,
            violations: Array.isArray(s.violations) ? (s.violations as string[]) : init.violations,
            activeSLA: this.validateSLAMode(s.activeSLA),
            runtime: this.validateRuntimeAggregate(s.runtime),
            budget: this.validateBudgetAggregate(s.budget),
        };
    }

    private validateWeights(raw: unknown): SystemState['weights'] {
        const init = this.getInitialState().weights;
        if (!raw || typeof raw !== 'object') return init;
        const w = raw as Record<string, unknown>;
        const validate = (rw: unknown) => {
            if (!rw || typeof rw !== 'object') return init.base;
            const v = rw as Record<string, unknown>;
            return {
                ttft:
                    typeof v.ttft === 'number' ? Math.max(0, Math.min(1, v.ttft)) : init.base.ttft,
                tps: typeof v.tps === 'number' ? Math.max(0, Math.min(1, v.tps)) : init.base.tps,
                reliability:
                    typeof v.reliability === 'number'
                        ? Math.max(0, Math.min(1, v.reliability))
                        : init.base.reliability,
            };
        };
        return {
            base: validate(w.base),
            adaptiveDelta: validate(w.adaptiveDelta),
            effective: validate(w.effective),
        };
    }

    private validateSLAMode(raw: unknown): SLAMode {
        if (VALID_SLA_MODES.includes(raw as SLAMode)) return raw as SLAMode;
        return 'BALANCED';
    }

    private validateRuntimeAggregate(raw: unknown): RuntimeAggregate | undefined {
        if (!raw || typeof raw !== 'object') return undefined;
        const r = raw as Record<string, unknown>;
        if (typeof r.totalActive !== 'number' || typeof r.lastUpdated !== 'number')
            return undefined;
        return {
            totalActive: r.totalActive,
            totalDead: typeof r.totalDead === 'number' ? r.totalDead : 0,
            totalBackoff: typeof r.totalBackoff === 'number' ? r.totalBackoff : 0,
            totalIdle: typeof r.totalIdle === 'number' ? r.totalIdle : 0,
            globalErrorRate: typeof r.globalErrorRate === 'number' ? r.globalErrorRate : 0,
            globalLoadFactor: typeof r.globalLoadFactor === 'number' ? r.globalLoadFactor : 0,
            lastUpdated: r.lastUpdated,
        };
    }

    private validateBudgetAggregate(raw: unknown): BudgetAggregate | undefined {
        if (!raw || typeof raw !== 'object') return undefined;
        const b = raw as Record<string, unknown>;
        if (typeof b.totalCost !== 'number' || typeof b.lastUpdated !== 'number') return undefined;
        return {
            totalCost: b.totalCost,
            totalTokens: typeof b.totalTokens === 'number' ? b.totalTokens : 0,
            totalSessions: typeof b.totalSessions === 'number' ? b.totalSessions : 0,
            activeSessions: typeof b.activeSessions === 'number' ? b.activeSessions : 0,
            exhausted: typeof b.exhausted === 'boolean' ? b.exhausted : false,
            lastUpdated: b.lastUpdated,
        };
    }

    private deepFreeze<T>(obj: T, seen = new WeakSet<object>()): T {
        if (obj === null || typeof obj !== 'object') return obj;
        if (seen.has(obj)) return obj; // в†ђ prevent infinite loop on cyclic refs
        seen.add(obj);
        if (Object.isFrozen(obj)) return obj;
        const names = Object.getOwnPropertyNames(obj);
        for (const name of names) {
            const val = (obj as Record<string, unknown>)[name];
            (obj as Record<string, unknown>)[name] = this.deepFreeze(val, seen);
        }
        return Object.freeze(obj);
    }

    getState(): Readonly<SystemState> {
        // KC-H02: Return cached frozen state if state hasn't changed since last call.
        // Only recompute (structuredClone + deepFreeze) when isDirty is true.
        if (this.cachedFrozenState && !this.isDirty) {
            return this.cachedFrozenState;
        }
        let cloned: SystemState;
        try {
            cloned = structuredClone(this.state);
        } catch {
            try {
                cloned = JSON.parse(JSON.stringify(this.state)) as SystemState;
            } catch {
                cloned = { ...this.state } as SystemState;
            }
        }
        this.cachedFrozenState = this.deepFreeze(cloned);
        return this.cachedFrozenState;
    }

    /** Mutable clone for Counterfactual simulation вЂ” explicit snapshot ABI */
    getStateSnapshot(): SystemState {
        try {
            return structuredClone(this.state);
        } catch {
            return JSON.parse(JSON.stringify(this.state)) as SystemState;
        }
    }

    setExplorationFactor(val: number, tx?: ITransaction) {
        this.state.explorationFactor = val;
        this.markDirtyAndEmit(tx);
    }

    setSLAMode(mode: string, tx?: ITransaction) {
        setSLAWeights(this.state, mode);
        this.markDirtyAndEmit(tx);
    }

    setBaseWeights(weights: { ttft: number; tps: number; reliability: number }, tx?: ITransaction) {
        const clamp = (v: number, name: string) => {
            if (typeof v !== 'number' || isNaN(v)) throw new Error(`${name} must be a number`);
            return Math.max(0, Math.min(1, v));
        };
        const validated = {
            ttft: clamp(weights.ttft, 'ttft'),
            tps: clamp(weights.tps, 'tps'),
            reliability: clamp(weights.reliability, 'reliability'),
        };
        const sum = validated.ttft + validated.tps + validated.reliability;
        if (sum === 0) throw new Error('At least one weight must be > 0');

        this.state.weights.base = validated;
        this.state.weights.effective = {
            ttft: Math.max(0, validated.ttft + this.state.weights.adaptiveDelta.ttft),
            tps: Math.max(0, validated.tps + this.state.weights.adaptiveDelta.tps),
            reliability: Math.max(
                0,
                validated.reliability + this.state.weights.adaptiveDelta.reliability,
            ),
        };
        this.markDirtyAndEmit(tx);
    }

    markProviderOffline(provider: string, reason: string, tx?: ITransaction) {
        const id = provider.toLowerCase();
        const existing = this.state.providers[id];
        if (existing) {
            this.state.providers = {
                ...this.state.providers,
                [id]: { ...existing, status: 'offline', reliability: 0 },
            };
            this.state.violations = [
                ...this.state.violations,
                `Provider ${provider} marked offline: ${reason}`,
            ].slice(-50);
        }
        this.markDirtyAndEmit(tx);
    }

    resetRuntime(tx?: ITransaction) {
        const init = this.getInitialState();
        this.state.history = init.history;
        this.state.decisions = init.decisions;
        this.state.totalRequests = init.totalRequests;
        this.state.totalTokens = init.totalTokens;
        this.markDirtyAndEmit(tx);
    }

    resetMetrics(tx?: ITransaction) {
        const init = this.getInitialState();
        this.state.totalRequests = init.totalRequests;
        this.state.totalTokens = init.totalTokens;
        this.state.estimatedCost = init.estimatedCost;
        this.markDirtyAndEmit(tx);
    }
}

// Default instance for backward compat вЂ” bootstrap.ts creates the real one via initKernel().
// Using Proxy to throw on any uninitialized access instead of silently failing.
const THROW_UNINITIALIZED: KernelDeps = new Proxy({} as KernelDeps, {
    get(_, prop) {
        throw new Error(
            `SystemKernel accessed before bootstrap: ${String(prop)} is not initialized. ` +
                'Ensure bootstrap.initKernel() is called before using kernel.',
        );
    },
});
export const kernel = new SystemKernel(THROW_UNINITIALIZED);
