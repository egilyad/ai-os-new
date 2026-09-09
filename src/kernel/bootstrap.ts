import type { IBootstrap, IEventBus } from './types/interfaces';
import { type IContainer } from './container';
import type { ILifecycle } from './contracts/lifecycle';
import { LifecycleManager } from './services/lifecycle-manager';
import { LoggerService } from './services/logger-service';
import { EVENTS } from './events/event-names';
import { getDexieDb } from './services/database-service';
import { AuditorTopology } from './state/topology-defaults';
import { ConfigService } from './services/config-service';
import { KeyService } from './services/key-management/key-service';
import { KeyStateStore } from './services/key-state-store';
import { ProviderRuntimeService } from './services/provider-runtime/provider-service';
import { RotationService } from './services/rotation-service';
import { EventRecorder } from './services/event-sourcing/event-recorder';
import { OrchestrationService as Orchestrator } from './services/orchestration-service';
import { registerServices } from './service-registration/index';
import { GroupManagerService } from './services/group-manager';
import type { ApiKey } from './types/metrics-types';
import { MemoryWatchdog } from './utils/memory-watchdog';
import { setConfigEventBus } from './services/config-mutations';
import { setBucketStorageEventBus } from './services/storage-adapter';
import { setDexieStorageEventBus } from './services/storage/dexie-storage';
import { setMessageIndexEventBus } from './services/message-index-service';
import { setAgentIdentityResolver } from './services/agent-identity';
import type { IAgentResolver } from './contracts/conversation/agent-resolver';
// eslint-disable-next-line no-restricted-imports
import { LLMHttpClient } from '../llm/http/llm-http-client';
import { clearBootstrapSnapshot } from './bootstrap-state';
import {
    CRITICAL_SERVICES,
    RUNNING_DEBATE_PHASES,
    INIT_TIERS,
    checkDependencies,
    type InitPhase,
    type BootstrapReport,
} from './bootstrap-phases';
import { runKeyMigration, loadBootstrapSnapshot, hydrateKeyStorage } from './bootstrap-key-init';

export type { InitPhase, BootstrapReport };

export class SystemBootstrap implements IBootstrap {
    private isStarted = false;
    private phase: InitPhase = 'pending';
    private startTime = 0;
    private error: string | null = null;
    private container: IContainer;
    private eventBus: IEventBus;
    private lifecycle = new LifecycleManager();
    private logger: LoggerService;
    private memoryWatchdog?: MemoryWatchdog;

    constructor(container: IContainer, eventBus: IEventBus) {
        this.container = container;
        this.eventBus = eventBus;
        this.logger = new LoggerService('Bootstrap');
        this.container.register('logger', this.logger);
        this.container.register('container', this.container);
    }

    resolve<T>(name: string): T {
        return this.container.get<T>(name);
    }

    private registerMigratedServices() {
        registerServices(this.container, this.eventBus, this.registerWithLifecycle.bind(this));
    }

    async init(): Promise<BootstrapReport> {
        if (this.isStarted) return this.getReport();
        this.startTime = Date.now();
        this.lifecycle.clearStatuses();
        this.error = null;

        this.logger.info('Bootstrap', 'Initializing Super-Agents OS Runtime...');

        this.phase = 'kernel';

        this.memoryWatchdog = new MemoryWatchdog(
            {
                intervalMs: 5000,
                thresholdMB: 100,
                absoluteThresholdMB: 1500,
            },
            this.eventBus,
        );
        this.memoryWatchdog.start();

        // B-04: inject the event bus into module-singleton kernel services so
        // they no longer reach for the global `eventBus` singleton.
        setConfigEventBus(this.eventBus);
        setBucketStorageEventBus(this.eventBus);
        setDexieStorageEventBus(this.eventBus);
        setMessageIndexEventBus(this.eventBus);

        try {
            this.registerMigratedServices();
            setAgentIdentityResolver(this.container.get<IAgentResolver>('agentService'));
        } catch (e) {
            this.logger.error('Bootstrap', 'Service registration failed', { error: e });
            this.phase = 'failed';
            this.error = 'Service registration failed';
            return this.getReport();
        }

        // Register schedulerService (created in RuntimeManager.registerCoreServices) with LifecycleManager
        try {
            const schedulerSvc = this.container.get<{
                init: () => Promise<void>;
                destroy: () => void;
            }>('schedulerService');
            if (schedulerSvc) {
                this.registerWithLifecycle('schedulerService', schedulerSvc);
            }
        } catch {
            this.logger.warn(
                'Bootstrap',
                'schedulerService not available for lifecycle registration',
            );
        }

        const configService = this.container.get<ConfigService>('configService');
        await this.lifecycle.tryInit('configService', () => configService.init());

        // ── Key Migration (one-shot) ───────────────────────────────────────
        await runKeyMigration(this.container, this.logger);

        // ════════════════════════════════════════════════════════════════════
        //   BOOTSTRAP SNAPSHOT — read from KeyStore
        // ════════════════════════════════════════════════════════════════════
        try {
            await loadBootstrapSnapshot(this.container, this.logger);
        } catch (e) {
            this.logger.warn('Bootstrap', 'Bootstrap snapshot load failed (non-critical)', {
                error: e,
            });
        }

        // ════════════════════════════════════════════════════════════════════
        //   HYDRATE KEY STORAGE — normalize keys in KeyStore
        // ════════════════════════════════════════════════════════════════════
        await hydrateKeyStorage(this.container, this.eventBus, this.logger);

        const servicesOk = await this.initServices();
        if (!servicesOk) {
            this.isStarted = true;
            return this.getReport();
        }

        const g = globalThis as unknown as {
            __BOOTSTRAP_PHASE__?: boolean;
            __BOOTSTRAP_KEY_COUNT__?: number;
        };
        g.__BOOTSTRAP_PHASE__ = false;
        g.__BOOTSTRAP_KEY_COUNT__ = 0;
        clearBootstrapSnapshot();

        this.isStarted = true;
        return this.getReport();
    }

    getReport(): BootstrapReport {
        return {
            phase: this.phase,
            started: this.startTime,
            completed: Date.now(),
            duration: this.startTime ? Date.now() - this.startTime : 0,
            error: this.error,
            services: [...this.lifecycle.getStatuses()],
        };
    }

    getPhase(): InitPhase {
        return this.phase;
    }

    isReady(): boolean {
        return this.phase === 'ready';
    }

    async shutdown() {
        if (!this.isStarted) return;
        this.logger.info('Bootstrap', 'Shutting down Super-Agents OS Runtime...');

        try {
            (this.container.get('causalScopeManager') as { destroy?: () => void })?.destroy?.();
        } catch {
            /* ignore */
        }
        try {
            (this.container.get('causalTimelineService') as { destroy?: () => void })?.destroy?.();
        } catch {
            /* ignore */
        }
        try {
            (this.container.get('eventBridge') as { stop?: () => void })?.stop?.();
        } catch {
            /* ignore */
        }

        this.memoryWatchdog?.stop();
        await this.lifecycle.shutdown();

        this.lifecycle.clearStatuses();
        this.error = null;
        this.isStarted = false;
        this.phase = 'pending';
        this.logger.info('Bootstrap', 'Shutdown complete.');
    }

    private async initServices(): Promise<boolean> {
        this.phase = 'services';

        // ── Tier 0: Config + logger (zero deps) ─────────────────────────
        await this.lifecycle.tryInit('configService', () =>
            this.container.get<ConfigService>('configService').init(),
        );

        // ── Tier 1: Core infrastructure ──────────────────────────────────
        checkDependencies(
            'eventSourcingService',
            ['configService'],
            (n) => this.container.has(n),
            (msg: string) => this.logger.warn('Bootstrap', msg),
        );
        await this.lifecycle.tryInit('eventSourcingService', () => {
            return this.container
                .get<EventRecorder>('eventSourcingService')
                .init((cb) => this.eventBus.subscribeAll(cb));
        });

        // ── Tier 2: Key + pricing ────────────────────────────────────────
        checkDependencies(
            'budgetService',
            ['keyService', 'pricingService'],
            (n) => this.container.has(n),
            (msg: string) => this.logger.warn('Bootstrap', msg),
        );

        // ── Tier 3: Provider runtime ─────────────────────────────────────
        checkDependencies(
            'providerRuntimeService',
            ['keyService', 'keyStateStore'],
            (n) => this.container.has(n),
            (msg: string) => this.logger.warn('Bootstrap', msg),
        );
        await this.lifecycle.tryInit('providerRuntimeService', () => {
            const prs = this.container.get<ProviderRuntimeService>('providerRuntimeService');
            const ks = this.container.get<KeyService>('keyService');
            const keys: ApiKey[] = ks.getKeys?.() ?? [];
            for (const key of keys) {
                try {
                    prs.createInstance(key);
                } catch (e) {
                    this.logger.warn('Bootstrap', 'createInstance failed', {
                        provider: key.provider,
                        error: e,
                    });
                }
            }
        });

        await this.lifecycle.tryInit('rotationService', async () => {
            const svc = this.container.get<RotationService>('rotationService');
            return svc.init();
        });

        // ── Check critical service failures after core tiers ─────────────
        for (const status of this.lifecycle.getStatuses()) {
            if (status.status === 'error') {
                if (CRITICAL_SERVICES.has(status.name)) {
                    this.logger.error(
                        'Bootstrap',
                        `Critical service ${status.name} failed — aborting`,
                        { error: status.error },
                    );
                    this.phase = 'failed';
                    this.error = `Critical service ${status.name} failed: ${status.error}`;
                    this.eventBus.emit(EVENTS.RUNTIME_FAILED, {
                        error: this.error,
                        phase: this.phase,
                    });
                    return false;
                }
                this.logger.warn(
                    'Bootstrap',
                    `Optional service ${status.name} failed — continuing`,
                    { error: status.error },
                );
                this.eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `Service ${status.name} failed to init`,
                    type: 'warning',
                    source: 'bootstrap',
                });
            }
        }

        // ── Tier 4-6: Remaining lifecycle services by tier ──────────────
        const serviceMap = new Map<string, ILifecycle>();
        for (const entry of this.lifecycle.getEntries()) {
            serviceMap.set(entry.name, entry.service);
        }

        for (const tier of INIT_TIERS) {
            const tierNames = tier[0] === '*' ? [...serviceMap.keys()] : tier;
            for (const name of tierNames) {
                let svc = serviceMap.get(name);
                if (!svc) {
                    // B-121: Services registered via registerFactory (lazy) are not in
                    // lifecycle entries until container.get() triggers their factory.
                    // Resolve now to trigger lazy registration + lifecycle init.
                    try {
                        const instance = this.container.get<ILifecycle>(name);
                        if (instance) {
                            svc = instance;
                        }
                    } catch {
                        continue;
                    }
                }
                if (!svc) continue;
                const hasStatus = this.lifecycle
                    .getStatuses()
                    .some((s) => s.name === name && s.status === 'ok');
                if (!hasStatus) {
                    await this.lifecycle.tryInitIfPresent(name, svc as ILifecycle);
                }
            }
        }

        // ── Check critical service failures after all tiers ──────────────
        for (const status of this.lifecycle.getStatuses()) {
            if (status.status === 'error') {
                if (CRITICAL_SERVICES.has(status.name)) {
                    this.logger.error(
                        'Bootstrap',
                        `Critical service ${status.name} failed in Tier 4-6 — aborting`,
                        { error: status.error },
                    );
                    this.phase = 'failed';
                    this.error = `Critical service ${status.name} failed: ${status.error}`;
                    this.eventBus.emit(EVENTS.RUNTIME_FAILED, {
                        error: this.error,
                        phase: this.phase,
                    });
                    return false;
                }
                this.logger.warn(
                    'Bootstrap',
                    `Optional service ${status.name} failed in Tier 4-6 — continuing`,
                    { error: status.error },
                );
                this.eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `Service ${status.name} failed to init`,
                    type: 'warning',
                    source: 'bootstrap',
                });
            }
        }

        // ── Topology ──────────────────────────────────────────────────────
        this.phase = 'topology';
        try {
            const orch = this.container.get<Orchestrator>('orchestrator');
            orch.mount(AuditorTopology);
            await orch.init();
        } catch (e) {
            console.error('[BOOTSTRAP] Failed to mount topology:', e);
            this.logger.error('Bootstrap', 'Failed to mount topology', { error: e });
        }

        // ── Second init pass: catch lazy-registered services ────────────
        // Services registered via registerFactory() (lazy DI) whose factories
        // were triggered by container.get() above (or during topology init)
        // missed the INIT_TIERS loop — init them now.
        // Only retry services that have NO status entry yet (truly lazy
        // services newly registered). Services that already failed in the
        // first pass (status 'error'/'skipped') won't be re-tried — their
        // failure is structural, not transient.
        for (const entry of this.lifecycle.getEntries()) {
            const hasAnyStatus = this.lifecycle.getStatuses().some((s) => s.name === entry.name);
            if (!hasAnyStatus) {
                await this.lifecycle.tryInitIfPresent(entry.name, entry.service);
            }
        }

        // ── Start all lifecycle services (tiered) ─────────────────────────
        try {
            await this.lifecycle.startAll();
        } catch (e) {
            this.logger.error('Bootstrap', 'startAll() failed — continuing in degraded mode', {
                error: e,
            });
            console.error('[BOOTSTRAP] startAll() failed — continuing:', e);
            this.phase = 'degraded';
        }

        // ── Post-start: GroupManager ──────────────────────────────────────
        try {
            const gm = this.container.get<GroupManagerService>('groupManagerService');
            await gm.syncExistingKeys();
            const keysAfterSync = gm.getAllKeys();
            if (import.meta.env.DEV)
                this.logger.debug('Bootstrap', 'GroupManager.syncExistingKeys — keys after sync', {
                    count: keysAfterSync.length,
                });
            this.container.get<KeyService>('keyService').attachGroupManager(gm);
            this.logger.info('Bootstrap', 'Group Manager synced existing keys');
        } catch (e) {
            this.logger.warn('Bootstrap', 'GroupManager syncExistingKeys failed (non-critical)', {
                error: e,
            });
        }

        // ── Post-start: KeyStateStore seed ────────────────────────────────
        try {
            const kss = this.container.get<KeyStateStore>('keyStateStore');
            const existingKeys: ApiKey[] =
                this.container.get<KeyService>('keyService').getKeys?.() ?? [];
            if (kss && existingKeys.length > 0) {
                kss.seedFromKeys(existingKeys);
                this.logger.info(
                    'Bootstrap',
                    `KeyStateStore seeded with ${existingKeys.length} key(s)`,
                );
            }
        } catch (e) {
            this.logger.warn('Bootstrap', 'KeyStateStore seed failed (non-critical)', { error: e });
        }

        // ── Post-start: DebateService.init() ──────────────────────────────
        try {
            const ds = this.container.get<{ init: () => Promise<void> }>('debateService');
            await ds.init();
            this.logger.info('Bootstrap', 'DebateService initialized');
        } catch (e) {
            this.logger.warn('Bootstrap', 'DebateService init failed (non-critical)', { error: e });
        }

        // ── MemoryWatchdog: proactive pressure callbacks ──────────────
        try {
            const debateEngine = this.container.get<{ clearWarmCache?: () => void }>(
                'debateEngine',
            );
            const debateService = this.container.get<{
                clearVerdictCache?: () => void;
                truncateArguments?: (keepRounds?: number) => number;
            }>('debateService');
            const providerRegistry = this.container.get<{ clearAllCaches?: () => void }>(
                'providerAdapterRegistry',
            );
            this.memoryWatchdog?.onPressure(() => {
                debateEngine.clearWarmCache?.();
                debateService.clearVerdictCache?.();
                debateService.truncateArguments?.(2);
                providerRegistry.clearAllCaches?.();
                // Cancel ALL in-flight HTTP requests — heap is at 200MB+
                // and growing at ~30MB/s. Waiting is not an option.
                const count = LLMHttpClient.cancelAll();
                if (count > 0) {
                    this.logger.info(
                        'Bootstrap',
                        `Cancelled ${count} in-flight HTTP requests under memory pressure`,
                    );
                }
                // Force GC: allocate+free 64MB buffer to encourage V8 mark-sweep
                try {
                    const buf = new ArrayBuffer(64 * 1024 * 1024);
                    buf.toString(); // touch
                } catch {
                    // best-effort GC hint
                }
            });
            this.logger.info('Bootstrap', 'MemoryWatchdog pressure callbacks registered');
        } catch (e) {
            this.logger.warn('Bootstrap', 'MemoryWatchdog pressure wiring failed (non-critical)', {
                error: e,
            });
        }

        // Auto-resume interrupted debates
        try {
            const allSessions = await getDexieDb().debateSessions.toArray();
            let interruptedCount = 0;
            for (const s of allSessions) {
                if (RUNNING_DEBATE_PHASES.has(s.phase)) {
                    if (!s.id || !s.topic) {
                        this.logger.warn(
                            'Bootstrap',
                            'Skipping invalid debate session during auto-resume',
                            { id: s.id },
                        );
                        continue;
                    }
                    await getDexieDb().debateSessions.put({
                        ...s,
                        phase: 'failed',
                        updatedAt: Date.now(),
                        version: (s.version ?? 0) + 1,
                    });
                    interruptedCount++;
                }
            }
            if (interruptedCount > 0) {
                this.logger.info(
                    'Bootstrap',
                    `Marked ${interruptedCount} debate(s) as interrupted`,
                );
            }
        } catch (e) {
            this.logger.warn('Bootstrap', 'Auto-resume debate check failed (non-critical)', {
                error: e,
            });
        }

        this.eventBus.emit(EVENTS.NOTIFICATION, {
            message: 'Super-Agents OS Runtime ready',
            type: 'success',
        });
        this.eventBus.emit(EVENTS.RUNTIME_READY, { timestamp: Date.now() });
        this.phase = 'ready';
        return true;
    }

    private registerWithLifecycle(name: string, instance: unknown) {
        // ILifecycle contract requires init() + destroy(); start is optional.
        // Check both — services that only have a no-op destroy() (e.g. stateless
        // helpers like AdversarialSourceService) must not be registered here,
        // otherwise LifecycleManager.tryInit() will throw "init is not a function".
        if (
            instance &&
            typeof (instance as ILifecycle).init === 'function' &&
            typeof (instance as ILifecycle).destroy === 'function'
        ) {
            this.lifecycle.register(name, instance as ILifecycle);
        }
    }
}
