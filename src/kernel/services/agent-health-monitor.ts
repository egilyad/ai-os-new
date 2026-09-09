import type { ILifecycle } from '../contracts/lifecycle';
import type { IEventBus } from '../types/interfaces';
import { EVENTS } from '../events/event-names';
import type { AgentHealth, AgentHealthSnapshot } from '../contracts/agent-health';
import { rootLogger } from './logger-service';
const LOGGER = rootLogger.child('AgentHealthMonitor');

export type { AgentHealth, AgentHealthSnapshot } from '../contracts/agent-health';

const WINDOW_MS = 3600000;
const MAX_ENTRIES = 1000;
const MAX_ENTRIES_PER_AGENT = 500;

interface StepRecord {
    agentId: string;
    duration: number;
    success: boolean;
    timestamp: number;
}

export interface AgentHealthMonitorDeps {
    eventBus: IEventBus;
    database?: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    agentService?: {
        restartAgent: (id: string) => Promise<void>;
    };
}

const HEALTH_PERSIST_KEY = 'agent_health_monitor_state';
const HEARTBEAT_INTERVAL_MS = 60000;
const STEP_TIMEOUT_MS = 300000; // 5 minutes without completion = hung
const AUTO_RECOVERY_UNHEALTHY_THRESHOLD = 3;

export class AgentHealthMonitor implements ILifecycle {
    private deps: AgentHealthMonitorDeps;
    private records: StepRecord[] = [];
    private healthCache = new Map<string, AgentHealthSnapshot>();
    private activeSteps = new Map<string, number>();
    private unsubs: Array<() => void> = [];
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private unhealthyCounters = new Map<string, number>();

    constructor(deps: AgentHealthMonitorDeps) {
        this.deps = deps;
    }

    async init() {}
    private _started = false;

    async start() {
        if (this._started) return;
        this._started = true;

        await this.loadPersisted();

        // Mark restored agents as 'unknown' until fresh health data arrives
        for (const [id, snap] of this.healthCache) {
            this.healthCache.set(id, { ...snap, health: 'unknown' as AgentHealth });
        }

        this.unsubs.push(
            this.deps.eventBus.onSafe<{ nodeId: string; duration: number; status: string }>(
                EVENTS.COGNITIVE_STEP_COMPLETED,
                (data) => {
                    this.activeSteps.delete(data.nodeId);
                    this.ingest(data.nodeId, data.duration, data.status !== 'error');
                },
            ),
        );
        this.unsubs.push(
            this.deps.eventBus.onSafe<{ nodeId: string; startedAt?: number }>(
                EVENTS.COGNITIVE_STEP_ACTIVE,
                (data) => {
                    this.activeSteps.set(data.nodeId, data.startedAt ?? Date.now());
                },
            ),
        );
        this.unsubs.push(
            this.deps.eventBus.on(EVENTS.SYSTEM_NODE_REMOVED, (raw: unknown) => {
                const data = raw as { id: string } | undefined;
                if (data?.id) {
                    this.healthCache.delete(data.id);
                    this.records = this.records.filter((r) => r.agentId !== data.id);
                    this.unhealthyCounters.delete(data.id);
                }
            }),
        );

        this.heartbeatTimer = setInterval(() => this.heartbeat(), HEARTBEAT_INTERVAL_MS);
    }

    destroy() {
        for (const u of this.unsubs) u();
        this.unsubs = [];
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        this.persist().catch((e: unknown) => {
            LOGGER.warn('AgentHealthMonitor', 'Persist during destroy failed', { error: e });
        });
        this.records = [];
        this.healthCache.clear();
        this.unhealthyCounters.clear();
        this._started = false;
    }

    private async loadPersisted() {
        if (!this.deps.database) return;
        try {
            const saved = await this.deps.database.getKv<{
                records: StepRecord[];
                cache: Record<string, AgentHealthSnapshot>;
            }>(HEALTH_PERSIST_KEY);
            if (saved) {
                if (Array.isArray(saved.records)) this.records = saved.records;
                if (saved.cache && typeof saved.cache === 'object') {
                    for (const [id, snap] of Object.entries(saved.cache)) {
                        this.healthCache.set(id, snap);
                    }
                }
            }
        } catch (e) {
            LOGGER.error('AgentHealthMonitor', 'Failed to load persisted state', { error: e });
        }
    }

    private async persist() {
        if (!this.deps.database) return;
        try {
            await this.deps.database.setKv(HEALTH_PERSIST_KEY, {
                records: this.records.slice(-MAX_ENTRIES),
                cache: Object.fromEntries(this.healthCache),
            });
        } catch (e) {
            LOGGER.error('AgentHealthMonitor', 'Failed to persist state', { error: e });
        }
    }

    private heartbeat() {
        const now = Date.now();
        for (const [nodeId, startedAt] of this.activeSteps) {
            if (now - startedAt > STEP_TIMEOUT_MS) {
                this.activeSteps.delete(nodeId);
                this.ingest(nodeId, STEP_TIMEOUT_MS, false);
                LOGGER.warn('AgentHealthMonitor', 'Step timed out', {
                    nodeId,
                    duration: STEP_TIMEOUT_MS,
                });
            }
        }
        const agentIds = new Set(this.records.map((r) => r.agentId));
        for (const agentId of agentIds) {
            this.recompute(agentId);
        }
        const allHealth = this.getAllHealth();
        const unhealthy = allHealth.filter((h) => h.health === 'unhealthy');
        const degraded = allHealth.filter((h) => h.health === 'degraded');
        if (unhealthy.length > 0 || degraded.length > 0) {
            LOGGER.info('AgentHealthMonitor', 'Heartbeat health summary', {
                total: allHealth.length,
                unhealthy: unhealthy.length,
                degraded: degraded.length,
                healthy: allHealth.length - unhealthy.length - degraded.length,
            });
        }
        this.persist().catch((e: unknown) => {
            LOGGER.warn('AgentHealthMonitor', 'Persist during heartbeat failed', { error: e });
        });

        for (const h of unhealthy) {
            const count = (this.unhealthyCounters.get(h.agentId) || 0) + 1;
            this.unhealthyCounters.set(h.agentId, count);
            if (count >= AUTO_RECOVERY_UNHEALTHY_THRESHOLD && this.deps.agentService) {
                LOGGER.warn('AgentHealthMonitor', 'Auto-recovering unhealthy agent', {
                    agentId: h.agentId,
                    consecutiveUnhealthy: count,
                });
                this.unhealthyCounters.set(h.agentId, 0);
                this.deps.agentService.restartAgent(h.agentId).catch((e) => {
                    LOGGER.error('AgentHealthMonitor', 'Auto-recovery failed', {
                        agentId: h.agentId,
                        error: e,
                    });
                });
            }
        }
        for (const h of allHealth) {
            if (h.health !== 'unhealthy') {
                this.unhealthyCounters.delete(h.agentId);
            }
        }
    }

    ingest(agentId: string, duration: number, success: boolean) {
        this.records.push({ agentId, duration, success, timestamp: Date.now() });
        if (this.records.length > MAX_ENTRIES) this.records.shift();
        const agentCount = this.records.filter((r) => r.agentId === agentId).length;
        if (agentCount > MAX_ENTRIES_PER_AGENT) {
            let removed = 0;
            this.records = this.records.filter((r) => {
                if (r.agentId !== agentId) return true;
                if (removed >= agentCount - MAX_ENTRIES_PER_AGENT) return true;
                removed++;
                return false;
            });
        }
        this.recompute(agentId);
    }

    getHealth(agentId: string): AgentHealthSnapshot {
        const cached = this.healthCache.get(agentId);
        if (cached) return cached;
        return {
            agentId,
            health: 'unknown' as AgentHealth,
            errorRate: 0,
            avgLatency: 0,
            p95Latency: 0,
            consecutiveErrors: 0,
            totalCalls: 0,
            lastUpdated: Date.now(),
        };
    }

    getAllHealth(): AgentHealthSnapshot[] {
        return Array.from(this.healthCache.values());
    }

    private recompute(agentId: string) {
        const cutoff = Date.now() - WINDOW_MS;
        const agentRecords = this.records.filter(
            (r) => r.agentId === agentId && r.timestamp >= cutoff,
        );

        if (agentRecords.length === 0) return;

        const totalCalls = agentRecords.length;
        const errors = agentRecords.filter((r) => !r.success).length;
        const errorRate = totalCalls > 0 ? errors / totalCalls : 0;
        const totalDuration = agentRecords.reduce((s, r) => s + r.duration, 0);
        const avgLatency = totalCalls > 0 ? totalDuration / totalCalls : 0;
        const sorted = agentRecords.map((r) => r.duration).sort((a, b) => a - b);
        const p95Idx = Math.ceil(sorted.length * 0.95) - 1;
        const p95Latency = p95Idx >= 0 ? sorted[p95Idx]! : 0;

        let consecutiveErrors = 0;
        for (let i = agentRecords.length - 1; i >= 0; i--) {
            if (!agentRecords[i]!.success) consecutiveErrors++;
            else break;
        }

        let health: AgentHealth = 'healthy';
        if (errorRate > 0.8 || consecutiveErrors >= 5) health = 'unhealthy';
        else if (errorRate > 0.5) health = 'degraded';

        const prev = this.healthCache.get(agentId);
        this.healthCache.set(agentId, {
            agentId,
            health,
            errorRate,
            avgLatency,
            p95Latency,
            consecutiveErrors,
            totalCalls,
            lastUpdated: Date.now(),
        });

        if (!prev || prev.health !== health) {
            LOGGER.info('AgentHealthMonitor', 'Health transition', {
                agentId,
                from: prev?.health ?? 'initial',
                to: health,
                errorRate,
                consecutiveErrors,
            });
            this.deps.eventBus.emit(EVENTS.AGENT_HEALTH_CHANGE, {
                id: agentId,
                from: prev?.health ?? 'healthy',
                to: health,
                errorRate,
                consecutiveErrors,
            });
        }
    }
}
