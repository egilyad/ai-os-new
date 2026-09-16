/**
 * Phase 11 — Causal Debugger.
 *
 * Non-critical diagnostic services.  Wrapped in try-catch so a failure
 * in one doesn't block others.
 *
 * A-04: All services now use registerFactory (lazy instantiation).
 * Memory tracking stays in factory so it captures correct heap delta.
 */
import type { Phase } from './helpers';
import { CausalScopeManager } from '../services/causal-scope-manager';
import { CausalTimelineService } from '../services/causal-timeline-service';
import { CounterfactualEngine } from '../services/counterfactual-engine';
import { CounterfactualExplanationService } from '../services/counterfactual-explanation-service';
import { CounterfactualNarrativeService } from '../services/counterfactual-narrative-service';
import { TemporalReplayService } from '../services/temporal-replay-service';
import { TruthConsistencyMonitor } from '../services/truth-consistency-monitor';
import { rootLogger } from '../services/logger-service';
import type { KeyStateStore } from '../services/key-state-store';
import type { RouterProjection } from '../services/projections/router-projection';
import type { RouterService } from '../services/provider-router';
import type { EventRecorder } from '../services/event-sourcing/event-recorder';
import type { ICausalScopeManager } from '../contracts/causal-debugger';

const LOGGER = rootLogger.child('Phase11CausalDebugger');

function getHeapMB(): number {
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    return mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : 0;
}

export const registerPhase11: Phase = ({ register }) => {
    const SVC = 'Phase11CausalDebugger';

    // ── CausalScopeManager + CausalTimelineService ──
    register('causalScopeManager', (_c) => {
        const memBefore = getHeapMB();
        LOGGER.info(SVC, 'CausalScopeManager starting');
        try {
            const causalScopeManager = new CausalScopeManager();
            const memAfter = getHeapMB();
            LOGGER.info(SVC, `CausalScopeManager done`, { deltaMB: memAfter - memBefore });
            return causalScopeManager;
        } catch (e) {
            LOGGER.warn(SVC, 'CausalScopeManager failed (non-critical)', { error: e });
            return null;
        }
    });

    register('causalTimelineService', (c) => {
        const memBefore = getHeapMB();
        LOGGER.info(SVC, 'CausalTimelineService starting');
        try {
            const causalScopeManager = c.get<CausalScopeManager>('causalScopeManager');
            if (!causalScopeManager) {
                LOGGER.warn(SVC, 'causalScopeManager unavailable — skipping CausalTimelineService');
                return null;
            }
            const kss = c.get<KeyStateStore>('keyStateStore');
            const routerProjection = c.get<RouterProjection>('routerProjection');
            const eventBus = c.get<import('../types/interfaces').IEventBus>('eventBus');
            const svc = new CausalTimelineService(
                causalScopeManager,
                kss,
                routerProjection,
                eventBus,
                LOGGER,
            );
            svc.start();
            const memAfter = getHeapMB();
            LOGGER.info(SVC, `CausalTimelineService done`, { deltaMB: memAfter - memBefore });
            return svc;
        } catch (e) {
            LOGGER.warn(SVC, 'CausalTimelineService failed (non-critical)', { error: e });
            return null;
        }
    });

    // ── Counterfactual Engine ──
    register('counterfactualEngine', (c) => {
        const memBefore = getHeapMB();
        LOGGER.info(SVC, 'CounterfactualEngine starting');
        try {
            const routerService = c.get<RouterService>('routerService');
            const engine = new CounterfactualEngine(routerService);
            const memAfter = getHeapMB();
            LOGGER.info(SVC, 'CounterfactualEngine done', { deltaMB: memAfter - memBefore });
            return engine;
        } catch (e) {
            LOGGER.warn(SVC, 'CounterfactualEngine failed (non-critical)', { error: e });
            return null;
        }
    });

    register('counterfactualExplanationService', (_c) => {
        const memBefore = getHeapMB();
        LOGGER.info(SVC, 'CounterfactualExplanationService starting');
        try {
            const svc = new CounterfactualExplanationService();
            const memAfter = getHeapMB();
            LOGGER.info(SVC, 'CounterfactualExplanationService done', {
                deltaMB: memAfter - memBefore,
            });
            return svc;
        } catch (e) {
            LOGGER.warn(SVC, 'CounterfactualExplanationService failed (non-critical)', {
                error: e,
            });
            return null;
        }
    });

    register('counterfactualNarrativeService', (_c) => {
        const memBefore = getHeapMB();
        LOGGER.info(SVC, 'CounterfactualNarrativeService starting');
        try {
            const svc = new CounterfactualNarrativeService();
            const memAfter = getHeapMB();
            LOGGER.info(SVC, 'CounterfactualNarrativeService done', {
                deltaMB: memAfter - memBefore,
            });
            return svc;
        } catch (e) {
            LOGGER.warn(SVC, 'CounterfactualNarrativeService failed (non-critical)', { error: e });
            return null;
        }
    });

    // ── Temporal Replay Service ──
    register('temporalReplayService', (c) => {
        const memBefore = getHeapMB();
        LOGGER.info(SVC, 'TemporalReplayService starting');
        try {
            const routerService = c.get<RouterService>('routerService');
            const eventSourcing = c.get<EventRecorder>('eventSourcingService');
            const scopeManager = c.get<ICausalScopeManager>('causalScopeManager');
            if (!scopeManager) {
                LOGGER.warn(SVC, 'causalScopeManager unavailable — skipping TemporalReplayService');
                return null;
            }
            const svc = new TemporalReplayService(eventSourcing, routerService, scopeManager);
            const memAfter = getHeapMB();
            LOGGER.info(SVC, 'TemporalReplayService done', { deltaMB: memAfter - memBefore });
            return svc;
        } catch (e) {
            LOGGER.warn(SVC, 'TemporalReplayService failed (non-critical)', { error: e });
            return null;
        }
    });

    // ── Truth Consistency Monitor ──
    register('truthConsistencyMonitor', (_c) => {
        const memBefore = getHeapMB();
        LOGGER.info(SVC, 'TruthConsistencyMonitor starting');
        try {
            const svc = new TruthConsistencyMonitor();
            const memAfter = getHeapMB();
            LOGGER.info(SVC, 'TruthConsistencyMonitor done', { deltaMB: memAfter - memBefore });
            return svc;
        } catch (e) {
            LOGGER.warn(SVC, 'TruthConsistencyMonitor failed (non-critical)', { error: e });
            return null;
        }
    });
};
