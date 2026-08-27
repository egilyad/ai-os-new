/**
 * Phase 0 — Event Bridge.
 *
 * Lightweight services that initialize the event projection system.
 * These run before any other phase so other services can subscribe
 * to projections during their own registration.
 *
 * A-04: All services now use registerFactory (lazy instantiation).
 */
import type { Phase } from './helpers';
import { ProjectionRegistry } from '../services/event-bridge/projection-registry';
import { EventBridge } from '../services/event-bridge/event-bridge';
import { RouterProjection } from '../services/projections/router-projection';
import { rootLogger } from '../services/logger-service';

const LOGGER = rootLogger.child('Phase0EventBridge');

export const registerPhase0: Phase = (helpers, ctx) => {
    const { register } = helpers;
    const eventBus = ctx.eventBus;

    try {
        const registry = new ProjectionRegistry();
        const routerProjection = new RouterProjection();
        registry.register(routerProjection);
        const bridge = new EventBridge(eventBus, registry);
        bridge.start();
        register('eventBridge', (_c) => bridge);
        register('projectionRegistry', (_c) => registry);
        register('routerProjection', (_c) => routerProjection);
        LOGGER.info('Phase0EventBridge', 'EventBridge initialized');
    } catch (e) {
        LOGGER.warn('Phase0EventBridge', 'EventBridge init failed — registering stubs', {
            error: e,
        });
        register('projectionRegistry', (_c) => ({}));
        register('routerProjection', (_c) => ({}));
    }
};
