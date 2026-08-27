/**
 * Shared helpers for service-registration phase files.
 *
 * Each phase receives a `PhaseContext` and uses these helpers to register
 * services in the DI container.  Phases must be called in order
 * (foundation → infrastructure → debate-runtime → agents-roles →
 * routing-llm → high-level) because later phases depend on services
 * registered by earlier ones.
 *
 * A-04 refactor: All services now use registerFactory (lazy instantiation)
 * instead of register (eager).  This makes services:
 *   1. Lazy — not created until first get()
 *   2. Overridable — container.override('name', mockImpl) in tests
 *   3. Mockable — no module-level singletons to mock
 *
 * registerWithLifecycle is called lazily on first get(), so the actual
 * instance is available for init()/start().
 */
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import { rootLogger } from '../services/logger-service';
import { invalidateLazyServiceNotFound } from '../service-helper';

const LOGGER = rootLogger.child('ServiceRegistration');

export interface PhaseContext {
    container: IContainer;
    eventBus: IEventBus;
    registerWithLifecycle: (name: string, instance: unknown) => void;
}

const _pendingLifecycle = new Map<string, unknown>();

/**
 * Phase-local register/get/asDeps closures.  Calling `makeHelpers`
 * inside a phase file keeps the closure variables out of module scope
 * while still letting each phase share the same idioms.
 *
 * A-04: register() now wraps in registerFactory — services are lazy,
 * not instantiated until first container.get().
 */
export function makeHelpers(ctx: PhaseContext) {
    /**
     * Register a service lazily via registerFactory.
     *
     * The factory function `(c) => new ConcreteClass(...)` is NOT
     * executed until the first `container.get(name)`.  This enables:
     *   - container.override(name, mockFactory) in tests
     *   - Circular-dependency-safe bootstrap (no eager instantiation chain)
     *   - Lazy init — actual instance passed to registerWithLifecycle
     *     only after first get(), so LifecycleManager can call init()/start()
     */
    const register = <T>(name: string, factory: (c: IContainer) => T | null): void => {
        // P1-11B: accept T | null — factories can return null for graceful
        // degradation of non-critical services without needing `null as unknown as T`.
        // All existing factories returning T remain compatible (T ⊆ T | null).

        if (ctx.container.has(name)) return;

        ctx.container.registerFactory(name, (c: IContainer): T | null => {
            // First get() — create and register with lifecycle
            const instance = factory(c);
            // P1-11A: null is valid for non-critical services — consumers must guard
            if (instance !== null) {
                _pendingLifecycle.set(name, instance);
                ctx.registerWithLifecycle(name, instance);
                invalidateLazyServiceNotFound(name);
            }
            return instance;
        });
    };

    const get = <T>(name: string): T => ctx.container.get<T>(name);

    const asDeps = <T>(value: unknown): T => {
        // SR-2: In dev mode, warn if value is missing expected properties
        if (typeof value !== 'object' || value === null) {
            LOGGER.warn('ServiceRegistration', 'asDeps() received non-object', { value });
        }
        return value as T;
    };

    return { register, get, asDeps };
}

export type PhaseHelpers = ReturnType<typeof makeHelpers>;
export type Phase = (helpers: PhaseHelpers, ctx: PhaseContext) => void;
