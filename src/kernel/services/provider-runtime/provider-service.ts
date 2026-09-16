import type { ApiKey } from '../../types/metrics-types';
import {
    ProviderInstance,
    type IProviderInstance,
    type ProviderInstanceConfig,
} from './provider-instance';
import { ProviderSession, type ProviderSessionSnapshot } from './provider-session';
import { ProviderRuntimeState, type RuntimeStateSnapshot } from './provider-state';
import { ProviderBudget, type BudgetStateSnapshot } from './provider-budget';

export type {
    IProviderInstance,
    ProviderInstanceConfig,
    InstanceStatus,
} from './provider-instance';
export type { ProviderSessionSnapshot, SessionStatus, SessionTokenUsage } from './provider-session';
export type { RuntimeStateSnapshot, RuntimeProviderMetric } from './provider-state';
export type { BudgetStateSnapshot, BudgetLimit, BudgetStateEntry } from './provider-budget';

export interface ProviderRuntimeDeps {
    onSessionComplete?: (session: ProviderSession) => void;
}

export class ProviderRuntimeService {
    readonly state: ProviderRuntimeState;
    readonly budget: ProviderBudget;

    private instances = new Map<string, IProviderInstance>();
    private sessions = new Map<string, ProviderSession>();
    private deps: ProviderRuntimeDeps;
    private static readonly SESSION_RETENTION_MS = 60_000;
    private pendingDeletions: Map<string, ReturnType<typeof setTimeout>> = new Map();

    constructor(deps?: ProviderRuntimeDeps) {
        this.deps = deps ?? {};
        this.state = new ProviderRuntimeState();
        this.budget = new ProviderBudget();
    }

    // ── Instance Management ────────────────────────────────────────────

    createInstance(key: ApiKey, config?: Partial<ProviderInstanceConfig>): IProviderInstance {
        const existing = this.instances.get(key.id);
        if (existing) return existing;

        const instance = new ProviderInstance(key, config);
        this.instances.set(instance.id, instance);
        this.state.register(instance);
        return instance;
    }

    getInstance(instanceId: string): IProviderInstance | undefined {
        return this.instances.get(instanceId);
    }

    getOrCreateInstance(key: ApiKey, config?: Partial<ProviderInstanceConfig>): IProviderInstance {
        return this.getInstance(key.id) ?? this.createInstance(key, config);
    }

    removeInstance(instanceId: string): void {
        this.instances.delete(instanceId);
        this.state.unregister(instanceId);
    }

    getAllInstances(): IProviderInstance[] {
        return Array.from(this.instances.values());
    }

    getInstancesByProvider(provider: string): IProviderInstance[] {
        return this.state.getInstancesByProvider(provider);
    }

    acquireInstance(instanceId: string): boolean {
        const instance = this.instances.get(instanceId);
        return instance?.acquire() ?? false;
    }

    releaseInstance(instanceId: string): void {
        this.instances.get(instanceId)?.release();
    }

    // ── Session Management ─────────────────────────────────────────────

    createSession(instanceId: string, provider: string, model: string): ProviderSession {
        const session = new ProviderSession(instanceId, provider, model);
        session.onComplete((s) => {
            this.deps.onSessionComplete?.(s);
            this.budget.endSession(s.provider);
        });
        this.sessions.set(session.id, session);
        return session;
    }

    activateSession(sessionId: string): ProviderSession | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;

        const instance = this.instances.get(session.instanceId);
        if (!instance?.acquire()) return undefined;

        session.activate();
        this.budget.startSession(session.provider);

        return session;
    }

    completeSession(sessionId: string, latency: number): ProviderSessionSnapshot | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;

        // C-24: only release instance if session was active/pending (not already terminal)
        const wasActive = session.status === 'active' || session.status === 'pending';
        session.complete(latency);

        const instance = this.instances.get(session.instanceId);
        if (instance && wasActive) {
            instance.recordSuccess(latency);
            instance.release();
        }

        // C5: Schedule deletion after retention period to allow post-completion reads
        this.scheduleSessionDeletion(sessionId);

        return session.snapshot();
    }

    failSession(sessionId: string, error: string): ProviderSessionSnapshot | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;

        // C-24: only release instance if session was active/pending (not already terminal)
        const wasActive = session.status === 'active' || session.status === 'pending';
        session.fail(error);

        const instance = this.instances.get(session.instanceId);
        if (instance && wasActive) {
            instance.recordError();
        }

        // C5: Schedule deletion after retention period
        this.scheduleSessionDeletion(sessionId);

        return session.snapshot();
    }

    cancelSession(sessionId: string): ProviderSessionSnapshot | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;

        // C-24: only release instance if session was active/pending (not already completed/failed/cancelled)
        const wasActive = session.status === 'active' || session.status === 'pending';
        session.cancel();

        const instance = this.instances.get(session.instanceId);
        if (instance && wasActive) {
            instance.release();
        }

        // C5: Schedule deletion after retention period
        this.scheduleSessionDeletion(sessionId);

        return session.snapshot();
    }

    private scheduleSessionDeletion(sessionId: string): void {
        // Cancel any pending deletion for this session (re-schedule)
        const existing = this.pendingDeletions.get(sessionId);
        if (existing) clearTimeout(existing);

        const timer = setTimeout(() => {
            this.sessions.delete(sessionId);
            this.pendingDeletions.delete(sessionId);
        }, ProviderRuntimeService.SESSION_RETENTION_MS);

        this.pendingDeletions.set(sessionId, timer);
    }

    getSession(sessionId: string): ProviderSession | undefined {
        return this.sessions.get(sessionId);
    }

    getActiveSessions(): ProviderSession[] {
        return Array.from(this.sessions.values()).filter(
            (s) => s.status === 'active' || s.status === 'pending',
        );
    }

    getSessionsByInstance(instanceId: string): ProviderSession[] {
        return Array.from(this.sessions.values()).filter((s) => s.instanceId === instanceId);
    }

    recordSessionUsage(
        sessionId: string,
        inputTokens: number,
        outputTokens: number,
        cost: number,
    ): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.recordTokens(inputTokens, outputTokens);
        session.recordCost(cost);
        this.budget.recordUsage(session.provider, inputTokens + outputTokens, cost);
    }

    // ── Snapshot ──────────────────────────────────────────────────────

    getRuntimeSnapshot(): RuntimeStateSnapshot {
        return this.state.snapshot();
    }

    getBudgetSnapshot(): BudgetStateSnapshot {
        return this.budget.snapshot();
    }

    startAutoRefresh(intervalMs?: number): void {
        this.state.startAutoRefresh(intervalMs);
    }

    stopAutoRefresh(): void {
        this.state.stopAutoRefresh();
    }

    // ── Cleanup ────────────────────────────────────────────────────────

    destroy(): void {
        this.state.destroy();
        this.budget.destroy();
        for (const [, timer] of this.pendingDeletions) clearTimeout(timer);
        this.pendingDeletions.clear();
        this.sessions.clear();
        this.instances.clear();
    }
}
