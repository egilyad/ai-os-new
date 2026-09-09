import { rootLogger } from './services/logger-service';

let _containerLogger: ReturnType<typeof rootLogger.child>;
function getLogger() {
    if (!_containerLogger) _containerLogger = rootLogger.child('Container');
    return _containerLogger;
}

export type ServiceIdentifier = string | symbol;

export interface IContainer {
    register<T>(id: ServiceIdentifier, instance: T): void;
    registerFactory<T>(id: ServiceIdentifier, factory: (container: IContainer) => T): void;
    /** Register a factory that creates a NEW instance on every get() call. */
    registerTransient<T>(id: ServiceIdentifier, factory: (container: IContainer) => T): void;
    /**
     * Override an existing registration with a new factory.
     * For testing: allows swapping implementations without module-mocking.
     * Only works for factory-registered services (singleton or transient).
     */
    override<T>(id: ServiceIdentifier, factory: (container: IContainer) => T): void;
    get<T>(id: ServiceIdentifier): T;
    getOptional<T>(id: ServiceIdentifier): T | undefined;
    has(id: ServiceIdentifier): boolean;
    clear(): Promise<void>;
    getDependencies(): Record<string, string[]>;
    getServices(): string[];
    /** Record an explicit dependency edge (used by `lazyService` so the graph isn't blind to service-locator deps — B-06). */
    recordDependency(from: ServiceIdentifier, to: ServiceIdentifier): void;
    /** Record a dependency on `to` attributed to the currently-resolving factory, if any (B-06). */
    recordDependencyFromActive(to: ServiceIdentifier): void;
}

export class Container implements IContainer {
    private services = new Map<ServiceIdentifier, unknown>();
    private factories = new Map<ServiceIdentifier, (container: IContainer) => unknown>();
    private dependencies = new Map<ServiceIdentifier, Set<ServiceIdentifier>>();
    private activeFactoryId: ServiceIdentifier | null = null;
    private transientFactories = new Map<ServiceIdentifier, (container: IContainer) => unknown>();
    private failedFactories = new Map<ServiceIdentifier, { error: unknown; timestamp: number }>();
    private static readonly FACTORY_FAILURE_TTL = 60_000;
    private registrationOrder: ServiceIdentifier[] = [];
    private resolving = new Set<ServiceIdentifier>();

    register<T>(id: ServiceIdentifier, instance: T): void {
        this.services.set(id, instance);
        this.registrationOrder.push(id);
    }

    registerFactory<T>(id: ServiceIdentifier, factory: (container: IContainer) => T): void {
        const exists = this.factories.has(id) || this.services.has(id);
        this.factories.set(id, factory);
        if (!exists) {
            this.registrationOrder.push(id);
        }
        this.services.delete(id);
    }

    registerTransient<T>(id: ServiceIdentifier, factory: (container: IContainer) => T): void {
        this.transientFactories.set(id, factory);
    }

    override<T>(id: ServiceIdentifier, factory: (container: IContainer) => T): void {
        if (!this.factories.has(id) && !this.transientFactories.has(id)) {
            throw new Error(
                `override() failed: '${String(id)}' is not registered as a factory. ` +
                    `Only factory/override-registered services can be overridden.`,
            );
        }
        // Clear cached singleton so next get() re-runs the factory
        this.services.delete(id);
        // Clear failure cache so new factory can retry
        this.failedFactories.delete(id);
        if (this.transientFactories.has(id)) {
            this.transientFactories.set(id, factory);
        } else {
            this.factories.set(id, factory);
        }
    }

    get<T>(id: ServiceIdentifier): T {
        if (this.resolving.has(id)) {
            throw new Error(
                `Circular dependency detected: ${String(id)} is already being resolved`,
            );
        }

        if (this.activeFactoryId && this.activeFactoryId !== id) {
            if (!this.dependencies.has(this.activeFactoryId)) {
                this.dependencies.set(this.activeFactoryId, new Set());
            }
            this.dependencies.get(this.activeFactoryId)!.add(id);
        }

        if (this.services.has(id)) {
            return this.services.get(id) as T;
        }

        // MED-K1: factory failure cache — skip retry within TTL
        const failed = this.failedFactories.get(id);
        if (failed && Date.now() - failed.timestamp < Container.FACTORY_FAILURE_TTL) {
            throw failed.error;
        }

        const factory = this.factories.get(id);
        if (factory) {
            const prev = this.activeFactoryId;
            this.activeFactoryId = id;
            this.resolving.add(id);
            try {
                const instance = factory(this);
                this.services.set(id, instance);
                this.failedFactories.delete(id);
                return instance as T;
            } catch (e) {
                this.failedFactories.set(id, { error: e, timestamp: Date.now() });
                throw e;
            } finally {
                this.resolving.delete(id);
                this.activeFactoryId = prev;
            }
        }

        // HIGH-K5: transient factories create a new instance on every get()
        const transientFactory = this.transientFactories.get(id);
        if (transientFactory) {
            return transientFactory(this) as T;
        }

        throw new Error(`Service not found: ${String(id)}`);
    }

    getOptional<T>(id: ServiceIdentifier): T | undefined {
        if (!this.has(id)) return undefined;
        return this.get<T>(id);
    }

    has(id: ServiceIdentifier): boolean {
        return this.services.has(id) || this.factories.has(id) || this.transientFactories.has(id);
    }

    async clear(): Promise<void> {
        const errors: Array<{ service: string; error: unknown }> = [];
        const DESTROY_TIMEOUT_MS = 5000;
        // LIFO: destroy in reverse registration order (matches LifecycleManager.shutdown())
        for (const id of this.registrationOrder.slice().reverse()) {
            const service = this.services.get(id);
            if (service && typeof (service as Record<string, unknown>).destroy === 'function') {
                try {
                    await Promise.race([
                        (service as { destroy: () => Promise<void> | void }).destroy(),
                        new Promise<never>((_, reject) =>
                            setTimeout(
                                () =>
                                    reject(
                                        new Error(
                                            `destroy timed out after ${DESTROY_TIMEOUT_MS}ms`,
                                        ),
                                    ),
                                DESTROY_TIMEOUT_MS,
                            ),
                        ),
                    ]);
                } catch (e) {
                    errors.push({ service: String(id), error: e });
                    getLogger().error('Container', 'destroy failed', {
                        service: String(id),
                        error: e,
                    });
                }
            }
        }
        this.services.clear();
        this.factories.clear();
        this.transientFactories.clear();
        this.failedFactories.clear();
        this.dependencies.clear();
        this.resolving.clear();
        this.activeFactoryId = null;
        this.registrationOrder = [];
    }

    getDependencies(): Record<string, string[]> {
        const result: Record<string, string[]> = {};
        for (const [svc, deps] of this.dependencies.entries()) {
            result[String(svc)] = Array.from(deps).map(String);
        }
        return result;
    }

    getServices(): string[] {
        const all = new Set([
            ...this.services.keys(),
            ...this.factories.keys(),
            ...this.transientFactories.keys(),
        ]);
        return Array.from(all).map(String);
    }

    recordDependency(from: ServiceIdentifier, to: ServiceIdentifier): void {
        if (!this.dependencies.has(from)) this.dependencies.set(from, new Set());
        this.dependencies.get(from)!.add(to);
    }

    // B-06: when a `lazyService` proxy is first resolved we cannot always attribute the
    // edge to a caller (runtime access has no active factory). But during a factory's
    // own resolution `activeFactoryId` is set — wiring `lazyService` through this closes
    // the gap for registration factories that still reach for the locator. Runtime
    // (non-factory) locator edges remain untracked pending the B-07 service-locator
    // removal (L-2).
    recordDependencyFromActive(to: ServiceIdentifier): void {
        if (this.activeFactoryId) this.recordDependency(this.activeFactoryId, to);
    }
}

export const defaultContainer = new Container();
