/**
 * Phase 56 — ExecutionViz (GAP G3, STATIC GAP CLOSURE).
 *
 * Registers (additive, no migration):
 *   - executionVizService (overlay over TimelineService + TraceService)
 *
 * Canvas drag-drop BLOCKED — after runtime.
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { TimelineService } from '../services/timeline-service';
import type { TraceService } from '../services/trace-service';
import { ExecutionVizService } from '../services/timeline/execution-viz-service';

export const registerPhase56: Phase = ({ register }) => {
    register('executionVizService', (c: IContainer) => {
        const timeline = c.has('timelineService') ? c.get<TimelineService>('timelineService') : undefined;
        const traceService = c.has('traceService') ? c.get<TraceService>('traceService') : undefined;
        return new ExecutionVizService({
            events: c.get<IEventBus>('eventBus'),
            timeline,
            traceService,
        });
    });
};
