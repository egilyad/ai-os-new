/**
 * Phase 5 — Routing, LLM Client & Storage Plumbing.
 *
 * Race executor, router, LLM client, cache, config, snapshot,
 * advisor, admin, monitoring.  All depend on services registered
 * in earlier phases.
 *
 * A-04: All services now use registerFactory (lazy instantiation).
 */
import type { Phase } from './helpers';
import type { IEventBus, IDatabaseService, IRuntimeManager } from '../types/interfaces';
import type { KeyService } from '../services/key-management/key-service';
import type { ProviderAdapterRegistry } from '../services/provider-adapter-registry';
import type { KeyStateStore } from '../services/key-state-store';
import type { SessionAffinityStore } from '../services/session-affinity-store';
import type { SettingsService } from '../services/settings-service';
import type { PricingService } from '../services/pricing-service';
import type { PolicyService } from '../services/policy-service';
import type { BudgetService } from '../services/budget-service';
import type { RoutingPolicyService } from '../services/routing-policy/routing-policy-service';
import type { OrchestrationService } from '../services/orchestration-service';
import type { SystemKernel } from '../kernel';
import type { AgentService } from '../services/agent-service';
import type { RoleService } from '../services/role-service';
import type { ToolService } from '../services/tool-executor';
import type { SnapshotService } from '../services/snapshot-service';
import type { TraceService } from '../services/trace-service';
import type { MetricsService } from '../services/metrics-service';
import type { RouterService } from '../services/provider-router';
import { RaceExecutor } from '../services/race-executor';
import { AdvisorService, AdvisorServiceDeps } from '../services/advisor-service';
import { SreAgentDefinition } from '../agents/SreAgent';
import { CapabilityManager } from '../services/capability-manager';
import type { ICapabilityManager } from '../contracts/capability-manager';
import type { SkillService } from '../services/skill-service';

import { RouterService as RouterServiceClass } from '../services/provider-router';
import { UsageTracker } from '../services/usage-tracker';
import { CacheService } from '../services/cache-service';
import { ConfigService } from '../services/config-service';
import { SnapshotService as SnapshotServiceClass } from '../services/snapshot-service';
import { AdminService } from '../services/admin-service';
import { TimelineService } from '../services/timeline-service';
import { MonitoringService } from '../services/monitoring-service';
import { LLMClientService } from '../services/llm-client-service';
import { FREE_TIER_LIMITS } from '../services/key-management/key-service';
import { VirtualKeyService } from '../services/virtual-key-service';
import { ProviderRuntimeService } from '../services/provider-runtime/provider-service';

export const registerPhase5: Phase = (helpers) => {
    const { register, asDeps } = helpers;

    register(
        'raceExecutor',
        (c) => new RaceExecutor(c.get<ProviderAdapterRegistry>('providerAdapterRegistry')),
    );

    register(
        'routerService',
        (c) =>
            new RouterServiceClass(
                asDeps<ConstructorParameters<typeof RouterServiceClass>[0]>({
                    kernel: c.get<SystemKernel>('kernel'),
                    keyService: c.get<KeyService>('keyService'),
                    pricingService: c.get<PricingService>('pricingService'),
                    eventBus: c.get<IEventBus>('eventBus'),
                    budgetService: c.get<BudgetService>('budgetService'),
                    policyService: c.get<PolicyService>('policyService'),
                    database: c.get<IDatabaseService>('database'),
                    routingPolicyService: c.get<RoutingPolicyService>('routingPolicyService'),
                    keyStateStore: c.get<KeyStateStore>('keyStateStore'),
                    sessionAffinityStore: c.get<SessionAffinityStore>('sessionAffinityStore'),
                }),
            ),
    );

    register(
        'usageTracker',
        (c) => new UsageTracker({ database: c.get<IDatabaseService>('database') }),
    );

    register(
        'cacheService',
        (c) => new CacheService({ database: c.get<IDatabaseService>('database') }),
    );

    register(
        'configService',
        (c) => new ConfigService({ database: c.get<IDatabaseService>('database') }),
    );

    register('snapshotService', (c) => {
        const storageLayer = c.get<{ memory: { count: () => Promise<number> } }>('storageLayer');
        return new SnapshotServiceClass({
            eventBus: c.get<IEventBus>('eventBus'),
            database: c.get<IDatabaseService>('database'),
            memoryStore: storageLayer?.memory,
            kernel: c.get<SystemKernel>('kernel'),
            orchestrator: c.get<OrchestrationService>('orchestrator'),
        });
    });

    register('capabilityManager', (c) => new CapabilityManager({
        toolService: c.get<ToolService>('toolService'),
        skillService: c.get<SkillService>('skillService')
    }));

    register(
        'advisorService',
        (c) =>
            SreAgentDefinition.factory(
                asDeps<AdvisorServiceDeps>({
                    capabilityManager: c.get<ICapabilityManager>('capabilityManager'),
                    eventBus: c.get<IEventBus>('eventBus'),
                    database: c.get<IDatabaseService>('database'),
                    kernel: c.get<SystemKernel>('kernel'),
                    keyService: c.get<KeyService>('keyService'),
                    routerService: c.get<RouterService>('routerService'),
                    adapterRegistry: c.get<ProviderAdapterRegistry>('providerAdapterRegistry'),
                    orchestrator: c.get<OrchestrationService>('orchestrator'),
                    pricingService: c.get<PricingService>('pricingService'),
                    budgetService: c.get<BudgetService>('budgetService'),
                    metricsService: c.get<MetricsService>('metricsService'),
                    keyStateStore: c.get<KeyStateStore>('keyStateStore'),
                }),
            ),
    );

    register(
        'adminService',
        (c) =>
            new AdminService(
                asDeps<ConstructorParameters<typeof AdminService>[0]>({
                    eventBus: c.get<IEventBus>('eventBus'),
                    keyService: c.get<KeyService>('keyService'),
                    kernel: c.get<SystemKernel>('kernel'),
                    orchestrator: c.get<OrchestrationService>('orchestrator'),
                    settingsService: c.get<SettingsService>('settingsService'),
                    agentService: c.get<AgentService>('agentService'),
                    metricsService: c.get<MetricsService>('metricsService'),
                    toolService: c.get<ToolService>('toolService'),
                    roleService: c.get<RoleService>('roleService'),
                    snapshotService: c.get<SnapshotService>('snapshotService'),
                    runtime: c.get<IRuntimeManager>('runtime'),
                }),
            ),
    );

    register(
        'timelineService',
        (c) => new TimelineService({ eventBus: c.get<IEventBus>('eventBus') }),
    );

    register(
        'monitoringService',
        (c) =>
            new MonitoringService({
                eventBus: c.get<IEventBus>('eventBus'),
                traceService: c.get<TraceService>('traceService'),
                metricsService: c.get<MetricsService>('metricsService'),
                timelineService: c.get<TimelineService>('timelineService'),
                routingPolicyService: c.get<RoutingPolicyService>('routingPolicyService'),
            }),
    );

    register('llmClientService', (c) => {
        const keySvc = c.get<KeyService>('keyService');
        return new LLMClientService(
            {
                resolveApiKey: (provider: string) => {
                    const key = keySvc.selectWithBurst(provider) ?? keySvc.selectFromPool(provider);
                    return key?.key;
                },
            },
            c.get<ProviderAdapterRegistry>('providerAdapterRegistry'),
        );
    });

    register('freeTierLimits', (_c) => FREE_TIER_LIMITS);

    register(
        'virtualKeyService',
        (c) =>
            new VirtualKeyService({
                database: c.get<IDatabaseService>('database'),
                eventBus: c.get<IEventBus>('eventBus'),
                keyService: c.get<KeyService>('keyService'),
            }),
    );

    register('providerRuntimeService', (_c) => new ProviderRuntimeService());
};
