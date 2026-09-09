/**
 * ExecutionViz contracts — GAP G3 (STATIC GAP CLOSURE).
 *
 * Additive overlay over TimelineService + TraceService + GraphService.
 * No canvas drag-drop (BLOCKED — after runtime). Provides raw traces +
 * declarative timeline overlay (11 → 260 via TIMELINE_MAP).
 */

import type { ILifecycle } from './lifecycle';
import type { TimelineEvent } from './observability';
import type { ExecutionTrace } from './observability';

export interface ExecutionSpan extends TimelineEvent {
    entityId?: string;
    runId?: string;
}

export interface ExecutionOverlay {
    runId: string;
    graphId?: string;
    spans: ExecutionSpan[];
    trace?: ExecutionTrace;
    stats: { total: number; byCategory: Record<string, number>; bySeverity: Record<string, number> };
}

export interface IExecutionVizService extends ILifecycle {
    /** Raw trace by traceId (from TraceService if present, else Timeline). */
    getRawTrace(traceId: string): ExecutionTrace | undefined;
    /** Overlay for a graph/crew/council runId — timeline spans + optional trace. */
    getOverlay(runId: string): Promise<ExecutionOverlay | null>;
    /** All overlays for a given graphId. */
    listOverlays(graphId: string): Promise<ExecutionOverlay[]>;
    /** Subscribe to overlay updates (new span). */
    subscribe(cb: (overlay: ExecutionOverlay) => void): () => void;
}
