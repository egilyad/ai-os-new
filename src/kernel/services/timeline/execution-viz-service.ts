/**
 * ExecutionVizService — G3 (STATIC GAP CLOSURE).
 *
 * Overlay over TimelineService + TraceService (both optional, graceful).
 * No canvas drag-drop (BLOCKED — after runtime). Provides raw traces + declarative overlay.
 * Subscribes to TIMELINE_MAP keys and keeps per-runId spans cache for fast getOverlay.
 */

import type { IExecutionVizService, ExecutionOverlay } from '../../contracts/execution-viz';
import type { ExecutionTrace } from '../../contracts/observability';
import type { IEventBus } from '../../types/interfaces';
import type { TimelineService } from '../timeline-service';
import type { TraceService } from '../trace-service';
import { rootLogger } from '../logger-service';
import { TIMELINE_MAP } from './timeline-map';

const LOGGER = rootLogger.child('ExecutionViz');

export class ExecutionVizService implements IExecutionVizService {
    private unsubs: Array<() => void> = [];
    private overlaySubs = new Set<(o: ExecutionOverlay) => void>();
    // runId -> spans (via timeline events with traceId/runId/sessionId/crewId)
    private runSpans = new Map<string, ExecutionOverlay['spans']>();
    private _initialized = false;

    constructor(private deps: {
        events: IEventBus;
        timeline?: TimelineService;
        traceService?: TraceService;
    }) {}

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        // Subscribe to all mapped events and keep runSpans cache
        for (const evt of Object.keys(TIMELINE_MAP)) {
            try {
                const unsub = (this.deps.events as unknown as { onSafe: <T>(n: string, cb: (d: T) => void) => () => void }).onSafe<Record<string, unknown>>(evt, (d) => {
                    const runId = (d.runId ?? d.sessionId ?? d.crewId ?? d.traceId ?? d.graphId ?? d.id) as string | undefined;
                    if (!runId) return;
                    const map = TIMELINE_MAP[evt];
                    if (!map) return;
                    const span = {
                        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                        type: evt as unknown as import('../../contracts/observability').TimelineEventType,
                        category: map.category as unknown as import('../../contracts/observability').TimelineCategory,
                        timestamp: Date.now(),
                        title: map.title(d),
                        severity: map.severity,
                        source: 'execution-viz',
                        metadata: d,
                        traceId: (d.traceId as string | undefined) ?? runId,
                        runId,
                        entityId: d[map.entity ?? ''] as string | undefined,
                    } as unknown as ExecutionOverlay['spans'][number];
                    const list = this.runSpans.get(runId) ?? [];
                    list.push(span);
                    if (list.length > 500) list.splice(0, list.length - 500);
                    this.runSpans.set(runId, list);
                    // notify subscribers best-effort
                    if (this.overlaySubs.size > 0) {
                        this.getOverlay(runId).then((ov) => {
                            if (ov) for (const cb of this.overlaySubs) try { cb(ov); } catch { /* ignore */ }
                        });
                    }
                });
                this.unsubs.push(unsub);
            } catch (e) {
                LOGGER.warn('subscribe failed', { evt, error: e instanceof Error ? e.message : String(e) });
            }
        }
        LOGGER.info('init', { mapped: Object.keys(TIMELINE_MAP).length });
    }

    async destroy(): Promise<void> {
        this._initialized = false;
        for (const u of this.unsubs) try { u(); } catch { /* ignore */ }
        this.unsubs = [];
        this.overlaySubs.clear();
        this.runSpans.clear();
    }

    getRawTrace(traceId: string): ExecutionTrace | undefined {
        return this.deps.traceService?.getTrace(traceId);
    }

    async getOverlay(runId: string): Promise<ExecutionOverlay | null> {
        const spans = this.runSpans.get(runId) ?? [];
        // also pull timeline events that match traceId/runId for completeness
        let timelineSpans: ExecutionOverlay['spans'] = [];
        if (this.deps.timeline) {
            try {
                const all = this.deps.timeline.getEvents({ search: runId, limit: 200 } as unknown as import('../../contracts/observability').TimelineFilter);
                // filter to those where metadata or traceId contains runId
                timelineSpans = all
                    .filter((e) => e.traceId === runId || (e.metadata as Record<string, unknown> | undefined)?.runId === runId || e.title.includes(runId))
                    .map((e) => ({ ...e, runId } as ExecutionOverlay['spans'][number]));
            } catch {
                // ignore
            }
        }
        // merge and dedupe by id
        const merged = [...spans, ...timelineSpans];
        const seen = new Map<string, ExecutionOverlay['spans'][number]>();
        for (const s of merged) if (!seen.has(s.id)) seen.set(s.id, s);
        const sorted = [...seen.values()].sort((a, b) => a.timestamp - b.timestamp);
        if (sorted.length === 0) {
            // still return empty overlay if trace exists
            const trace = this.getRawTrace(runId);
            if (!trace) return null;
            return {
                runId,
                spans: [],
                trace,
                stats: { total: 0, byCategory: {}, bySeverity: {} },
            };
        }
        const byCategory: Record<string, number> = {};
        const bySeverity: Record<string, number> = {};
        for (const s of sorted) {
            byCategory[s.category] = (byCategory[s.category] ?? 0) + 1;
            bySeverity[s.severity ?? 'info'] = (bySeverity[s.severity ?? 'info'] ?? 0) + 1;
        }
        return {
            runId,
            graphId: (sorted[0]?.metadata as Record<string, unknown> | undefined)?.graphId as string | undefined,
            spans: sorted,
            trace: this.getRawTrace(runId),
            stats: { total: sorted.length, byCategory, bySeverity },
        };
    }

    async listOverlays(graphId: string): Promise<ExecutionOverlay[]> {
        const out: ExecutionOverlay[] = [];
        for (const runId of this.runSpans.keys()) {
            const ov = await this.getOverlay(runId);
            if (ov?.graphId === graphId) out.push(ov);
        }
        // also from timeline graphId search
        if (this.deps.timeline && out.length === 0) {
            try {
                const evts = this.deps.timeline.getEvents({ search: graphId, limit: 500 } as unknown as import('../../contracts/observability').TimelineFilter);
                const runIds = new Set(evts.map((e) => (e.metadata as Record<string, unknown> | undefined)?.runId as string | undefined).filter(Boolean) as string[]);
                for (const rid of runIds) {
                    const ov = await this.getOverlay(rid);
                    if (ov) out.push(ov);
                }
            } catch { /* ignore */ }
        }
        return out;
    }

    subscribe(cb: (overlay: ExecutionOverlay) => void): () => void {
        this.overlaySubs.add(cb);
        return () => this.overlaySubs.delete(cb);
    }
}
