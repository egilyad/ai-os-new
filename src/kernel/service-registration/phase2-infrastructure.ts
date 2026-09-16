/**
 * Phase 2 — Infrastructure.
 *
 * Services that depend on Phase 1 (settings, pricing, keyService, kernel,
 * eventBus) but not on memory/cognitive or debate.
 *
 * A-04: All services now use registerFactory (lazy instantiation).
 */
import type { Phase } from './helpers';
import type { IEventBus, IDatabaseService } from '../types/interfaces';
import type { IExecutionGovernor } from '../contracts/execution-governor';
import type { TraceStore } from '../contracts/storage/storage-layer';
import type { LoggerService } from '../services/logger-service';
import type { KeyService } from '../services/key-management/key-service';
import type { ProviderAdapterRegistry } from '../services/provider-adapter-registry';
import type { GroupManagerService } from '../services/group-manager';
import type { KeyStateStore } from '../services/key-state-store';
import type { IDiagnosticService } from '../contracts/diagnostic-service';
import { SessionAffinityStore } from '../services/session-affinity-store';
import { ChatBookmarksService } from '../services/chat-bookmarks-service';
import { AgentJournalService } from '../services/agent-journal-service';
import { SystemStatusService } from '../services/system-status-service';
import { RotationService } from '../services/rotation-service';
import { PolicyService } from '../services/policy-service';
import { ToolService } from '../services/tool-executor';
import { MemoryService } from '../services/memory-engine';
import { ExternalSecretsService } from '../services/external-secrets-service';
import { BlackboardService } from '../services/blackboard-service';
import { CognitiveService, type CognitiveServiceDeps } from '../services/cognitive-service';
import type { StorageLayer } from '../contracts/storage/storage-layer';

export const registerPhase2: Phase = (helpers, ctx) => {
    const { register, asDeps } = helpers;

    register(
        'sessionAffinityStore',
        (c) =>
            new SessionAffinityStore(
                c.get<IEventBus>('eventBus'),
                c.get<KeyStateStore>('keyStateStore'),
            ),
    );

    register(
        'chatBookmarksService',
        (c) =>
            new ChatBookmarksService({
                eventBus: c.get<IEventBus>('eventBus'),
                database: c.get<IDatabaseService>('database'),
                logger: c.get<LoggerService>('logger'),
            }),
    );

    register(
        'agentJournalService',
        (c) =>
            new AgentJournalService({
                eventBus: c.get<IEventBus>('eventBus'),
                database: c.get<IDatabaseService>('database'),
                logger: c.get<LoggerService>('logger'),
            }),
    );

    register(
        'systemStatusService',
        (c) =>
            new SystemStatusService({
                groupManager: c.get<GroupManagerService>('groupManagerService'),
                keyService: c.get<KeyService>('keyService'),
                keyStateStore: c.get<KeyStateStore>('keyStateStore'),
            }),
    );

    register(
        'rotationService',
        (c) =>
            new RotationService(
                asDeps<ConstructorParameters<typeof RotationService>[0]>({
                    keyManager: c.get<KeyService>('keyService'),
                    eventBus: c.get<IEventBus>('eventBus'),
                    adapterRegistry: c.get<ProviderAdapterRegistry>('providerAdapterRegistry'),
                    logger: c.get<LoggerService>('logger'),
                    groupManager: c.get<GroupManagerService>('groupManagerService'),
                }),
            ),
    );

    register(
        'policyService',
        (c) =>
            new PolicyService({
                database: c.get<IDatabaseService>('database'),
                eventBus: c.get<IEventBus>('eventBus'),
            }),
    );

    register(
        'toolService',
        (c) =>
            new ToolService({
                database: c.get<IDatabaseService>('database'),
                eventBus: c.get<IEventBus>('eventBus'),
            }),
    );

    register(
        'memoryService',
        (c) =>
            new MemoryService(
                asDeps<ConstructorParameters<typeof MemoryService>[0]>({
                    database: c.get<IDatabaseService>('database'),
                    eventBus: c.get<IEventBus>('eventBus'),
                    executionGovernor: (() => {
                        try {
                            return ctx.container.get<IExecutionGovernor>('executionGovernor');
                        } catch {
                            return undefined;
                        }
                    })(),
                }),
            ),
    );

    register(
        'externalSecretsService',
        (c) =>
            new ExternalSecretsService({
                database: c.get<IDatabaseService>('database'),
                eventBus: c.get<IEventBus>('eventBus'),
            }),
    );

    // A-04: blackboardService created inside factory so it can be passed to cognitiveService
    register(
        'blackboardService',
        (c) => new BlackboardService({ eventBus: c.get<IEventBus>('eventBus') }),
    );

    register('cognitiveService', (_c) => {
        const storageLayer = ctx.container.get<StorageLayer>('storageLayer');
        return new CognitiveService({
            traceStore:
                storageLayer?.traces ??
                ({
                    saveTrace: async () => {},
                    getTrace: async () => null,
                    queryTraces: async () => [],
                    deleteTrace: async () => {},
                    count: async () => 0,
                    bulkPut: async () => {},
                    clear: async () => {},
                    exportAll: async () => '[]',
                    importAll: async () => {},
                } as TraceStore),
            eventBus: _c.get<IEventBus>('eventBus'),
            get blackboardService() {
                return _c.get<BlackboardService>('blackboardService');
            },
            get routerService() {
                return _c.get<CognitiveServiceDeps['routerService']>('routerService');
            },
            get keyService() {
                return _c.get<CognitiveServiceDeps['keyService']>('keyService');
            },
            get roleService() {
                return _c.get<CognitiveServiceDeps['roleService']>('roleService');
            },
            get adapterRegistry() {
                return _c.get<CognitiveServiceDeps['adapterRegistry']>('providerAdapterRegistry');
            },
            get diagnosticService() {
                return _c.get<IDiagnosticService>('diagnosticService');
            },
        });
    });
};
