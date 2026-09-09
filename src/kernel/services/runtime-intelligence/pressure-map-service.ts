import type { ILifecycle } from '../../contracts/lifecycle';
import type {
    IPressureMapService,
    ProviderPressureEntry,
    SessionPressureEntry,
    PressureMapSnapshot,
    PressureTrendPoint,
    PressureAlert,
} from '../../contracts/pressure-map-service';
import type { PressureLevel } from '../../contracts/debate-runtime';
import { CONFIG } from '../config-registry';
import { ProviderEvents } from '../../events/provider-events';
import { EVENTS } from '../../events/event-names';

const MAX_TREND_HISTORY = CONFIG?.services?.pressureMap?.maxTrendHistory ?? 500;
const ALERT_COOLDOWN_MS = CONFIG?.services?.pressureMap?.alertCooldownMs ?? 60000;

export interface PressureMapDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        onSafe: <T>(event: string, cb: (data: T) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
        emitOnce: (event: string, key: string, data?: unknown) => boolean;
    };
    cognitiveIntelligenceService: {
        getPressure: () => { level: PressureLevel; score: number };
    };
}

export class PressureMapService implements ILifecycle, IPressureMapService {
    private deps: PressureMapDeps;
    private providerPressures = new Map<string, ProviderPressureEntry>();
    private sessionPressures = new Map<string, SessionPressureEntry>();
    private trendHistory: PressureTrendPoint[] = [];
    private alerts: PressureAlert[] = [];
    private unsubs: Array<() => void> = [];
    private listeners: Array<(snapshot: PressureMapSnapshot) => void> = [];
    private refreshInterval: ReturnType<typeof setInterval> | null = null;
    private _initialized = false;

    constructor(deps: PressureMapDeps) {
        this.deps = deps;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        this.unsubs.push(
            this.deps.eventBus.onSafe<{ sessionId: string; level: string; action: unknown }>(
                EVENTS.DEBATE_BUDGET_PRESSURE_CHANGED,
                (d) => {
                    const existing = this.sessionPressures.get(d.sessionId);
                    if (existing) {
                        this.sessionPressures.set(d.sessionId, {
                            ...existing,
                            level: d.level as PressureLevel,
                            score: this.levelToScore(d.level as PressureLevel),
                            updatedAt: Date.now(),
                        });
                    } else {
                        // B10-58: Create session entry if not found (PRESSURE_CHANGED may fire before BUDGET_UPDATED)
                        const sessionEntry: SessionPressureEntry = {
                            sessionId: d.sessionId,
                            topic: '',
                            level: d.level as PressureLevel,
                            score: this.levelToScore(d.level as PressureLevel),
                            breakdown: { tokenPct: 0, costPct: 0, roundPct: 0, durationPct: 0 },
                            updatedAt: Date.now(),
                        };
                        this.sessionPressures.set(d.sessionId, sessionEntry);
                    }
                    this.checkAlerts();
                    this.emit();
                },
            ),
            this.deps.eventBus.onSafe<{
                sessionId: string;
                pressure: string;
                used: number;
                limit: number;
            }>(EVENTS.DEBATE_BUDGET_UPDATED, (d) => {
                const pressureLevel = d.pressure as PressureLevel;
                this.sessionPressures.set(d.sessionId, {
                    sessionId: d.sessionId,
                    topic: '',
                    level: pressureLevel,
                    score: this.levelToScore(pressureLevel),
                    breakdown: {
                        tokenPct: d.limit > 0 ? d.used / d.limit : 0,
                        costPct: 0,
                        roundPct: 0,
                        durationPct: 0,
                    },
                    updatedAt: Date.now(),
                });
                this.recordTrend(pressureLevel, this.levelToScore(pressureLevel));
                this.emit();
            }),
            this.deps.eventBus.onSafe<{ provider?: string; status?: string }>(
                ProviderEvents.KEY_HEALTH_CHECK_COMPLETED,
                (d) => {
                    if (!d.provider) return;
                    const p = d.provider.toLowerCase();
                    const status = d.status || 'unknown';
                    const score = status === 'ready' ? 0.15 : status === 'limited' ? 0.55 : 0.85;
                    const level: PressureLevel =
                        status === 'ready' ? 'normal' : status === 'limited' ? 'high' : 'critical';
                    this.providerPressures.set(p, {
                        provider: p,
                        level,
                        score,
                        breakdown: {
                            status: score,
                            reliability: 1 - score,
                            quotaPct: status === 'limited' ? 0.85 : 0,
                            budgetPct: 0,
                            errorRate: status === 'ready' ? 0 : 0.3,
                            latency: status === 'ready' ? 0.2 : 0.7,
                        },
                        updatedAt: Date.now(),
                    });
                    this.emit();
                },
            ),
            this.deps.eventBus.onSafe<{ provider: string; latency: number }>(
                ProviderEvents.KEY_LATENCY_BURST,
                (d) => {
                    const p = d.provider.toLowerCase();
                    const existing = this.providerPressures.get(p);
                    if (existing) {
                        this.providerPressures.set(p, {
                            ...existing,
                            level: 'high',
                            score: Math.min(1, existing.score + 0.2),
                            breakdown: {
                                ...existing.breakdown,
                                latency: Math.min(1, d.latency / 5000),
                            },
                            updatedAt: Date.now(),
                        });
                        this.emit();
                    }
                },
            ),
            this.deps.eventBus.onSafe<{ sessionId: string }>(
                EVENTS.DEBATE_SESSION_COMPLETED,
                (d) => {
                    this.sessionPressures.delete(d.sessionId);
                },
            ),
            this.deps.eventBus.onSafe<{ sessionId: string }>(
                EVENTS.DEBATE_SESSION_CANCELLED,
                (d) => {
                    this.sessionPressures.delete(d.sessionId);
                },
            ),
            this.deps.eventBus.onSafe<{ sessionId: string }>(EVENTS.DEBATE_SESSION_FAILED, (d) => {
                this.sessionPressures.delete(d.sessionId);
            }),
        );

        this.refreshInterval = setInterval(
            () => this.refresh(),
            CONFIG.pressure.autoRefreshIntervalMs,
        );
    }

    async start() {}

    getSnapshot(): PressureMapSnapshot {
        const cognitive = this.deps.cognitiveIntelligenceService.getPressure();
        return {
            global: {
                level: cognitive.level,
                score: cognitive.score,
            },
            providers: Array.from(this.providerPressures.values()),
            sessions: Array.from(this.sessionPressures.values()),
            alertCount: this.alerts.filter((a) => !a.acknowledged).length,
            timestamp: Date.now(),
        };
    }

    getProviderPressure(provider: string): ProviderPressureEntry | undefined {
        return this.providerPressures.get(provider);
    }

    getSessionPressure(sessionId: string): SessionPressureEntry | undefined {
        return this.sessionPressures.get(sessionId);
    }

    getPressureHistory(
        _scope: 'global' | 'provider' | 'session',
        _id?: string,
        limit = 50,
    ): PressureTrendPoint[] {
        return this.trendHistory.slice(0, limit);
    }

    getAlerts(): PressureAlert[] {
        return [...this.alerts];
    }

    acknowledgeAlert(alertId: string): void {
        const alert = this.alerts.find((a) => a.id === alertId);
        if (alert) alert.acknowledged = true;
    }

    onPressureChange(cb: (snapshot: PressureMapSnapshot) => void): () => void {
        this.listeners.push(cb);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== cb);
        };
    }

    destroy() {
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        this.providerPressures.clear();
        this.sessionPressures.clear();
        this.trendHistory = [];
        this.alerts = [];
        this.listeners = [];
        this._initialized = false;
    }

    private refresh() {
        this.emit();
    }

    private checkAlerts() {
        for (const [, entry] of this.sessionPressures) {
            if (
                (entry.level === 'critical' || entry.level === 'high') &&
                !this.alerts.some(
                    (a) =>
                        a.id === `session_${entry.sessionId}` &&
                        Date.now() - a.timestamp < ALERT_COOLDOWN_MS,
                )
            ) {
                this.alerts.push({
                    scope: 'session',
                    id: `session_${entry.sessionId}`,
                    level: entry.level,
                    message: `Session ${entry.sessionId.slice(0, 8)} pressure ${entry.level}`,
                    timestamp: Date.now(),
                    acknowledged: false,
                });
            }
        }

        const bufferSize = CONFIG?.services?.pressureMap?.alertsBufferSize ?? 200;
        if (this.alerts.length > bufferSize) {
            this.alerts = this.alerts.slice(-bufferSize);
        }
    }

    private recordTrend(level: PressureLevel, score: number) {
        this.trendHistory.unshift({ timestamp: Date.now(), score, level });
        if (this.trendHistory.length > MAX_TREND_HISTORY) this.trendHistory.pop();
    }

    private levelToScore(level: string): number {
        switch (level) {
            case 'critical':
                return 0.9;
            case 'high':
                return 0.7;
            case 'normal':
                return 0.45;
            case 'low':
                return 0.15;
            default:
                return 0;
        }
    }

    private emit() {
        const snapshot = this.getSnapshot();
        // OBS-105: emit to eventBus too, not just local listeners
        this.deps.eventBus.emit(EVENTS.PRESSURE_MAP_UPDATED, snapshot);
        const activeAlerts = this.getAlerts().filter((a) => !a.acknowledged);
        for (const alert of activeAlerts) {
            this.deps.eventBus.emitOnce(
                EVENTS.PRESSURE_ALERT_RAISED,
                `${alert.scope}:${alert.id}:${alert.level}`,
                alert,
            );
        }
        for (const cb of this.listeners) cb(snapshot);
    }
}
