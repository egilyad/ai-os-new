import { defaultContainer, type IContainer } from './container';
import { SystemBootstrap } from './bootstrap';
import { eventBus as coreEventBus, EVENTS } from './events/event-bus';
import { rootLogger } from './services/logger-service';

function getLogger() {
    return rootLogger?.child('Runtime');
}
import { db as coreDatabase } from './services/database-service';
import { SecurityService } from './security';
import { createDexieStorage } from './services/storage/dexie-storage';
import { initSchedulerService } from './services/scheduler-service';
import { crossTabStateSync } from './services/cross-tab-state';
import { DataAccessLayerImpl } from './dal/data-access-layer';
import { LocalStorageAdapter } from './services/storage/local-storage-adapter';
import { clearResolvedServices } from './service-helper';

export type RuntimePhase = 'loading' | 'initializing' | 'ready' | 'degraded' | 'shutdown' | 'error';

export interface RuntimeStatus {
    phase: RuntimePhase;
    uptime: number;
    startTime: number;
    servicesReady: number;
    servicesTotal: number;
    lastError: string | null;
    memoryUsage: number;
}

export class RuntimeManager {
    private phase: RuntimePhase = 'loading';
    private startTime = 0;
    private servicesReady = 0;
    private servicesTotal = 0;
    private lastError: string | null = null;
    private initialized = false;
    private shutdownInitiated = false;
    private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
    private bootstrapper: SystemBootstrap;
    private container: IContainer;
    private _unhandledRejectionHandler?: (event: PromiseRejectionEvent) => void;

    constructor(container: IContainer, bootstrapper: SystemBootstrap) {
        this.container = container;
        this.bootstrapper = bootstrapper;
        if (typeof window !== 'undefined') {
            this._unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
                event.preventDefault();
                getLogger()?.error('Runtime', 'Unhandled promise rejection', {
                    reason: event.reason,
                });
            };
            window.addEventListener('unhandledrejection', this._unhandledRejectionHandler);
        }
    }

    private startPromise: Promise<boolean> | null = null;

    async start(): Promise<boolean> {
        if (this.initialized) return true;
        if (this.shutdownInitiated) return false;
        if (this.startPromise) return this.startPromise;
        this.startPromise = (async () => {
            this.startTime = Date.now();
            this.phase = 'initializing';

            try {
                this.registerCoreServices();
                const storage = createDexieStorage();
                getLogger()?.info('Runtime', 'Storage initialized', {
                    hasStorageLayer: !!storage,
                    hasKeys: !!storage?.keys,
                    keysType: typeof storage?.keys,
                    hasListKeys: typeof storage?.keys?.listKeys === 'function',
                    storageBackend: 'dexie',
                });
                this.container.register('storageLayer', storage);
                await this.bootstrapper.init();
                // BR-05: Start cross-tab sync AFTER bootstrap is ready, not at module import
                crossTabStateSync.start();
                const report = this.bootstrapper.getReport();
                this.servicesTotal = report.services.length;
                this.servicesReady = report.services.filter((s) => s.status === 'ok').length;
                this.phase = report.phase === 'ready' ? 'ready' : 'degraded';
                this.initialized = true;
                this.lastError = report.error;
                // B-033: Subscribe EVENTBUS_BACKPRESSURE — degrade runtime on event bus overload
                coreEventBus.on(EVENTS.EVENTBUS_BACKPRESSURE, () => {
                    if (this.phase === 'ready') this.phase = 'degraded';
                });
                this.startHealthChecks();
                return this.phase === 'ready';
            } catch (e) {
                this.phase = 'error';
                this.lastError = e instanceof Error ? e.message : String(e);
                getLogger()?.error('Runtime', 'Failed to start', { error: e });
                console.error('[RUNTIME] Failed to start — full error:', e);
                // BR-03: Do NOT call shutdown() here — it would set shutdownInitiated=true
                // and prevent any retry. Instead, just clean state so restart() can retry.
                this.initialized = false;
                this.startPromise = null;
                return false;
            }
        })();
        return this.startPromise;
    }

    private startHealthChecks() {
        const intervalMs = 30_000;
        this.healthCheckInterval = setInterval(() => {
            if (this.phase === 'shutdown') return;

            // Check heap
            const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
            if (mem && mem.usedJSHeapSize > 500 * 1024 * 1024) {
                this.phase = 'degraded';
            }

            // OBS-99: Check scheduler liveness (get from container, may not be ready)
            const svc = ((): { lastCheckTime?: number } | null => {
                try {
                    return this.container.get<{ lastCheckTime?: number }>('schedulerService');
                } catch {
                    return null;
                }
            })();
            const schedulerTime = svc?.lastCheckTime ?? 0;
            if (schedulerTime > 0 && Date.now() - schedulerTime > 120_000) {
                this.phase = 'degraded';
                this.lastError = 'Scheduler has not checked in for 2+ minutes';
            }

            // Emit heartbeat event (lightweight, doesn't carry full state)
            coreEventBus.emit(EVENTS.KERNEL_HEARTBEAT, {
                phase: this.phase,
                uptime: Date.now() - this.startTime,
            });
        }, intervalMs);
    }

    async shutdown(): Promise<void> {
        // BR-02: Wait for in-flight start() before shutting down — prevents
        // container.clear() mid-init and bootstrapper race with destroy.
        if (this.startPromise) {
            await this.startPromise.catch(() => {});
        }
        if (this.shutdownInitiated) return;
        this.shutdownInitiated = true;
        this.phase = 'shutdown';
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        // H-35: Remove unhandledrejection handler to prevent duplicate listeners on HMR
        if (this._unhandledRejectionHandler && typeof window !== 'undefined') {
            window.removeEventListener('unhandledrejection', this._unhandledRejectionHandler);
            this._unhandledRejectionHandler = undefined;
        }
        await this.bootstrapper.shutdown();
        coreDatabase.destroy();
        crossTabStateSync.destroy();
        await this.container.clear();
        clearResolvedServices();
        coreEventBus.clearAllSubscriptions();
        this.registerCoreServices();
        this.initialized = false;
        this.startPromise = null;
        this.phase = 'loading';
        // H-07: Do NOT reset shutdownInitiated here — only restart() clears it
        // This prevents a race where start() is called before shutdown() finishes
    }

    async restart(): Promise<boolean> {
        await this.shutdown();
        this.shutdownInitiated = false;
        return this.start();
    }

    getStatus(): RuntimeStatus {
        return {
            phase: this.phase,
            uptime: this.startTime ? Date.now() - this.startTime : 0,
            startTime: this.startTime,
            servicesReady: this.servicesReady,
            servicesTotal: this.servicesTotal,
            lastError: this.lastError,
            memoryUsage:
                (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
                    ?.usedJSHeapSize || 0,
        };
    }

    getService<T>(name: string): T {
        return this.bootstrapper.resolve<T>(name);
    }

    getContainer(): IContainer {
        return this.container;
    }

    getPhase(): RuntimePhase {
        return this.phase;
    }

    isReady(): boolean {
        return this.phase === 'ready' && this.initialized;
    }

    markServiceReady() {
        this.servicesReady = Math.min(this.servicesReady + 1, this.servicesTotal);
    }

    getDependencies(): Record<string, string[]> {
        return (
            (
                this.bootstrapper.resolve('container') as {
                    getDependencies(): Record<string, string[]>;
                } | null
            )?.getDependencies() || {}
        );
    }

    getServices(): string[] {
        return (
            (
                this.bootstrapper.resolve('container') as { getServices(): string[] } | null
            )?.getServices() || []
        );
    }

    private registerCoreServices(): void {
        // BR-17: Idempotent — skip if already registered (called from both start() and shutdown())
        if (this.container.has('runtime')) return;
        this.container.register('runtime', this);
        this.container.register('database', coreDatabase);
        coreDatabase.init();
        this.container.register('dal', new DataAccessLayerImpl(coreDatabase));
        this.container.register('eventBus', coreEventBus);
        coreEventBus.setLogger(rootLogger);
        this.container.register('securityService', new SecurityService());
        this.container.register('BucketStorageAdapter', localStorageAdapter);
        const schedulerService = initSchedulerService(coreDatabase, coreEventBus);
        this.container.register('schedulerService', schedulerService);
    }
}

const localStorageAdapter = new LocalStorageAdapter();
// storageLayer registered in RuntimeManager.start() — works in all browsers
export const runtime = new RuntimeManager(
    defaultContainer,
    new SystemBootstrap(defaultContainer, coreEventBus),
);
