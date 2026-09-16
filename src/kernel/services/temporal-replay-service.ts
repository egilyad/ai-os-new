import type { EventRecorder } from './event-sourcing/event-recorder';
import type { CausalTraceEntry, EventRef, ICausalScopeManager } from '../contracts/causal-debugger';
import type {
    ITemporalReplayService,
    TemporalTrace,
    TemporalFrame,
    ScoreSnapshot,
} from '../contracts/temporal-replay';
import type { RouterService, RoutingStrategy } from './provider-router';
import type { SystemState } from '../types/metrics-types';
import { rootLogger } from './logger-service';

function getLogger() {
    return rootLogger.child('TemporalReplayService');
}

type EventName = string;

/** Per-provider scoring-relevant metrics */
interface ProviderMetrics {
    reliability: number;
    avgTTFT: number;
    status: string;
    stabilityIndex: number;
    reputationScore: number;
    avgTPS: number;
}

/** Copied from SystemState for the minimal provider block we need */
interface ProviderBlock {
    reliability: number;
    avgTTFT: number;
    status: string;
    stabilityIndex?: number;
    reputationScore?: number;
    avgTPS?: number;
    [key: string]: unknown;
}

const SCORING_EVENTS: ReadonlySet<string> = new Set([
    'key:health:check:failed',
    'key:health:check:completed',
    'key:quota:exceeded',
    'key:quota:restored',
    'key:state:changed',
    'key:probe:result',
    'chat:stream:end',
    'key:added',
    'key:updated',
    'key:removed',
]);

/** Aggregate per-key projection data into per-provider metrics */
function keyStateToProviderMetrics(
    keyStateData: Record<string, unknown>,
): Record<string, ProviderMetrics> {
    const keys = Object.values(keyStateData) as Array<Record<string, unknown>>;
    const byProvider: Record<string, Array<Record<string, unknown>>> = {};
    for (const k of keys) {
        const p = String(k.provider ?? '');
        if (!p) continue;
        (byProvider[p] ??= []).push(k);
    }

    const result: Record<string, ProviderMetrics> = {};
    for (const [provider, entries] of Object.entries(byProvider)) {
        const anyBroken = entries.some((e) => e.status === 'broken' || e.status === 'offline');
        const anyLimited = entries.some((e) => e.rateLimited === true);
        const latencies = entries.map((e) => Number(e.latency) || 0);
        const avgLat = latencies.length
            ? latencies.reduce((s, v) => s + v, 0) / latencies.length
            : 500;
        const errors = entries.reduce((s, e) => s + (Number(e.healthErrors) || 0), 0);
        const reliability = anyBroken ? 0 : anyLimited ? 0.3 : Math.max(0.4, 1 - errors * 0.1);
        const avgRep = entries.length > 0 ? Math.round((1 - errors / entries.length) * 100) : 100;
        result[provider] = {
            reliability,
            avgTTFT: avgLat,
            status: anyBroken ? 'offline' : anyLimited ? 'degraded' : 'active',
            stabilityIndex: Math.max(0.1, 1 - errors * 0.05),
            reputationScore: Math.max(10, avgRep),
            avgTPS: avgLat > 0 ? Math.max(1, Math.round(1000 / avgLat)) : 10,
        };
    }
    return result;
}

/** Build a minimal SystemState-compatible provider block for scoring */
function providerMetricsToStateBlock(
    metrics: Record<string, ProviderMetrics>,
): Record<string, ProviderBlock> {
    const block: Record<string, ProviderBlock> = {};
    for (const [provider, m] of Object.entries(metrics)) {
        block[provider] = {
            reliability: m.reliability,
            avgTTFT: m.avgTTFT,
            status: m.status,
            stabilityIndex: m.stabilityIndex,
            reputationScore: m.reputationScore,
            avgTPS: m.avgTPS,
        };
    }
    return block;
}

/** Check if an event changes provider metrics */
function isScoringEvent(type: string): boolean {
    return SCORING_EVENTS.has(type);
}

/** Apply a single event to in-memory provider metrics */
function applyEvent(metrics: Record<string, ProviderMetrics>, event: EventRef): void {
    const p = event.payload;
    const provider = String((p as Record<string, unknown>).provider ?? '');
    if (!provider) return;
    const m = metrics[provider];
    if (!m) return;

    switch (event.eventName) {
        case 'key:health:check:failed': {
            m.reliability = 0;
            m.status = 'offline';
            break;
        }
        case 'key:health:check:completed': {
            const lat = Number((p as Record<string, unknown>).latency);
            if (lat > 0) m.avgTTFT = lat;
            const status = String((p as Record<string, unknown>).status ?? '');
            if (status === 'error' || status === 'broken') {
                m.reliability = 0;
                m.status = 'offline';
            }
            break;
        }
        case 'key:quota:exceeded': {
            m.reliability = Math.min(m.reliability, 0.5);
            if (m.status === 'active') m.status = 'degraded';
            break;
        }
        case 'key:quota:restored': {
            m.reliability = Math.max(m.reliability, 0.7);
            break;
        }
        case 'key:state:changed': {
            const state = String((p as Record<string, unknown>).state ?? '');
            if (state === 'broken' || state === 'offline') {
                m.reliability = 0;
                m.status = 'offline';
            } else if (state === 'limited' || state === 'degraded') {
                m.reliability = Math.min(m.reliability, 0.5);
                m.status = 'degraded';
            }
            break;
        }
        case 'key:probe:result': {
            const lat = Number((p as Record<string, unknown>).latency);
            if (lat > 0) m.avgTTFT = lat;
            const status = String((p as Record<string, unknown>).status ?? '');
            if (status === 'broken' || status === 'error') {
                m.reliability = 0;
                m.status = 'offline';
            } else if (status === 'limited') {
                m.reliability = Math.min(m.reliability, 0.5);
                m.status = 'degraded';
            } else if (status === 'ready') {
                m.reliability = Math.max(m.reliability, 0.7);
                m.status = 'active';
            }
            break;
        }
        case 'chat:stream:end': {
            // Only probe-related stream ends carry provider metrics
            const lat = Number((p as Record<string, unknown>).latency);
            if (lat > 0) m.avgTTFT = lat;
            break;
        }
        case 'key:added':
        case 'key:updated':
        case 'key:removed': {
            // Aggregates shift — degrade reliability slightly to signal change
            m.reliability = Math.max(0.2, m.reliability - 0.05);
            break;
        }
    }
}

/** Re-score using RouterService with overrideState */
function rescore(
    router: RouterService,
    metrics: Record<string, ProviderMetrics>,
    original: CausalTraceEntry,
): ScoreSnapshot | null {
    const stateBlock = providerMetricsToStateBlock(metrics);
    const simState: SystemState = {
        providers: stateBlock as unknown as SystemState['providers'],
        weights: {
            base: { ttft: 1, tps: 1, reliability: 1 },
            adaptiveDelta: { ttft: 0, tps: 0, reliability: 0 },
            effective: { ttft: 1, tps: 1, reliability: 1 },
        },
        decisions: [],
        totalRequests: 0,
        totalTokens: 0,
        estimatedCost: 0,
        explorationFactor: 0,
        violations: [],
        activeSLA: 'BALANCED',
        history: [],
    };

    router.getRankedProviders(
        String(original.decision.strategy ?? 'auto') as RoutingStrategy,
        '',
        'normal',
        undefined,
        undefined,
        simState,
        true,
        'replay',
    );

    const last = router.getSimulationDecision();
    if (!last || !last.scores) return null;

    const scores: Record<string, number> = {};
    const components: Record<string, Record<string, number>> = {};
    const ranking: string[] = [];

    for (const s of last.scores) {
        scores[s.provider] = s.score;
        ranking.push(s.provider);
        if (s.components) {
            components[s.provider] = s.components as unknown as Record<string, number>;
        }
    }

    return { scores, components, ranking };
}

export class TemporalReplayService implements ITemporalReplayService {
    constructor(
        private recorder: EventRecorder,
        private routerService: RouterService,
        private scopeManager: ICausalScopeManager,
    ) {}

    replay(trace: CausalTraceEntry): TemporalTrace {
        // R-33: replay is read-only — save and restore simulation state
        // to prevent cross-contamination with counterfactual engine results
        const savedSim = this.routerService.getSimulationDecision();
        this.routerService.clearSimulation();

        const requestId = trace.requestIds[0] ?? '';
        const causalId = trace.causalId;
        const scope = this.scopeManager.getScope(causalId);
        const providerIds = new Set(scope?.providerIds ?? []);
        const decisionWinner = String(trace.decision.selected ?? '');

        // Step 1: get all events from EventRecorder within time window
        // 2b K3: bounded window — events capped at ~1000 by EventRecorder, windowEnd uses finite default
        const allEvents = this.recorder.getAll();
        const windowStart = trace.before?.keyState?.takenAt ?? 0;
        const windowEnd = trace.after?.keyState?.takenAt ?? Date.now();
        const windowEvents = allEvents.filter(
            (e) => e.timestamp >= windowStart && e.timestamp <= windowEnd,
        );

        // Step 2: filter to relevant events (match scope providerIds or global)
        const GLOBAL_EVENT_NAMES: ReadonlySet<string> = new Set([
            'system:state:changed',
            'key:state:changed',
            'kernel:updated',
        ]);
        const relevantEvents = windowEvents.filter((e) => {
            if (GLOBAL_EVENT_NAMES.has(e.event)) return true;
            const payload = e.data as Record<string, unknown> | undefined;
            const provId = String(payload?.provider ?? '');
            if (provId && providerIds.has(provId)) return true;
            return false;
        });

        // Step 3: build initial provider metrics from before.keyState
        const initialKeyState = structuredClone(
            (trace.before?.keyState?.data ?? {}) as Record<string, unknown>,
        );
        const providerMetrics = keyStateToProviderMetrics(initialKeyState);

        // Step 4: walk events chronologically, building frames
        const frames: TemporalFrame[] = [];
        let initialLeader = '';
        let decisionFrameIndex = -1;

        for (let i = 0; i < relevantEvents.length; i++) {
            const evt = relevantEvents[i]!;
            const eventRef: EventRef = {
                eventName: evt.event as EventName,
                timestamp: evt.timestamp,
                payload: (evt.data ?? {}) as Record<string, unknown>,
            };

            const isScoring = isScoringEvent(evt.event);
            if (isScoring) {
                applyEvent(providerMetrics, eventRef);
            }

            let scoreState: ScoreSnapshot | null = null;
            let rescored = false;

            if (isScoring) {
                try {
                    scoreState = rescore(this.routerService, providerMetrics, trace);
                    rescored = true;
                } catch (e) {
                    getLogger().warn('TemporalReplayService', 'Rescore failed at frame', {
                        frame: frames.length,
                        error: e,
                    });
                }
            }

            // If this is the decision event, mark it
            if (evt.event === 'system:decision') {
                decisionFrameIndex = frames.length;
            }

            // Capture initial leader from first rescored frame
            if (!initialLeader && scoreState && scoreState.ranking.length > 0) {
                initialLeader = scoreState.ranking[0]!;
            }

            frames.push({
                index: frames.length,
                logPos: evt.sequence,
                event: eventRef,
                keyState: { ...providerMetrics } as unknown as Record<string, unknown>,
                scoreState,
                rescored,
            });
        }

        // Step 5: detect flip point
        let flipFrame: number | null = null;
        if (decisionWinner && decisionFrameIndex >= 0) {
            // Walk backwards from decision frame, find first where decisionWinner leads
            for (let i = decisionFrameIndex; i >= 0; i--) {
                const f = frames[i]!;
                if (f.scoreState && f.scoreState.ranking[0] === decisionWinner) {
                    flipFrame = f.index;
                    break;
                }
            }
        }

        const result: TemporalTrace = {
            requestId,
            causalId,
            frames,
            flipFrame,
            winner: decisionWinner,
            initialLeader,
        };

        // R-33: restore simulation state — replay must not leave side effects
        this.routerService.clearSimulation();
        if (savedSim) {
            this.routerService.pushSimulationDecision(savedSim);
        }

        return result;
    }
}
