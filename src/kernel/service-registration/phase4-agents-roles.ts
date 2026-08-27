/**
 * Phase 4 — Agents, Roles & Orchestration.
 *
 * Agent lifecycle, role/skills services, orchestrator, and the
 * services that depend on them (budget, sandbox, MCP, governance,
 * health checks, traces).
 *
 * A-04: All services now use registerFactory (lazy instantiation).
 * Init/start() calls moved inside factories so they run on first get().
 */
import type { Phase } from './helpers';
import type { IEventBus, IDatabaseService } from '../types/interfaces';
import type { ILocalStorageAdapter } from '../contracts/storage-adapter';
import type { StorageLayer, RolesStore, SkillsStore } from '../contracts/storage/storage-layer';
import type { IDiagnosticService } from '../contracts/diagnostic-service';
import type { PricingService } from '../services/pricing-service';
import type { ToolService } from '../services/tool-executor';
import type { PolicyService } from '../services/policy-service';
import type { CognitiveService } from '../services/cognitive-service';
import type { OrchestrationService } from '../services/orchestration-service';
import { AgentService } from '../services/agent-service';
import { TemplateService } from '../services/template-service';
import { AgentVersionService } from '../services/agent-version-service';
import { RoleVersionService } from '../services/role-version-service';
import { AgentHealthMonitor } from '../services/agent-health-monitor';
import { TaskHandoffService } from '../services/task-handoff';
import { TraceService } from '../services/trace-service';
import { OrchestrationService as OrchestratorClass } from '../services/orchestration-service';
import { RoleService } from '../services/role-service';
import { SkillService } from '../services/skill-service';
import { SandboxService } from '../services/sandbox-service';
import { MCPService } from '../services/mcp-service';
import { BudgetService } from '../services/budget-service';
import { RoutingPolicyService } from '../services/routing-policy/routing-policy-service';
import { GovStressTestService } from '../services/gov-stress-test-service';
import { ObsGapsService } from '../services/obs-gaps-service';

const EMPTY_ROLES_STORE: RolesStore = {
    loadAll: async () => [],
    saveAll: async () => {
        /* no-op */
    },
    toArray: async () => [],
    bulkAdd: async () => {
        /* no-op */
    },
    bulkPut: async () => {
        /* no-op */
    },
    count: async () => 0,
    clear: async () => {
        /* no-op */
    },
    exportAll: async () => '[]',
    importAll: async () => {
        /* no-op */
    },
};

const EMPTY_SKILLS_STORE: SkillsStore = {
    loadAll: async () => [],
    saveAll: async () => {
        /* no-op */
    },
    toArray: async () => [],
    bulkAdd: async () => {
        /* no-op */
    },
    bulkPut: async () => {
        /* no-op */
    },
    count: async () => 0,
    clear: async () => {
        /* no-op */
    },
    exportAll: async () => '[]',
    importAll: async () => {
        /* no-op */
    },
};

export const registerPhase4: Phase = (helpers, ctx) => {
    const { register, asDeps } = helpers;
    const storageLayer = ctx.container.get<StorageLayer>('storageLayer');
    const configStore = storageLayer?.config;

    register('agentService', (c) => {
        const svc = new AgentService({
            database: c.get<IDatabaseService>('database'),
            eventBus: c.get<IEventBus>('eventBus'),
            pricingService: c.get<PricingService>('pricingService'),
            get orchestrator() {
                return c.get<OrchestrationService>('orchestrator');
            },
        });
        void svc.init();
        return svc;
    });

    // A-04: templateService.init() called inside factory on first get()
    register('templateService', (c) => {
        const ts = new TemplateService({ database: c.get<IDatabaseService>('database') });
        void ts.init();
        return ts;
    });

    // A-04: avs.start() called inside factory
    register('agentVersionService', (c) => {
        const avs = new AgentVersionService({
            database: c.get<IDatabaseService>('database'),
            eventBus: c.get<IEventBus>('eventBus'),
        });
        avs.start();
        return avs;
    });

    // A-04: roleVersionService and agentHealthMonitor init inside factories
    register('roleVersionService', (c) => {
        const rvs = new RoleVersionService(c.get<ILocalStorageAdapter>('BucketStorageAdapter'));
        rvs.init();
        return rvs;
    });

    register('agentHealthMonitor', (c) => {
        const ahm = new AgentHealthMonitor({
            eventBus: c.get<IEventBus>('eventBus'),
            database: c.get<IDatabaseService>('database'),
            agentService: c.get<AgentService>('agentService'),
        });
        void ahm.start();
        ctx.registerWithLifecycle('agentHealthMonitor', ahm);
        return ahm;
    });

    register(
        'taskHandoffService',
        (c) =>
            new TaskHandoffService({
                eventBus: c.get<IEventBus>('eventBus'),
                database: c.get<IDatabaseService>('database'),
                getLifecycleState: (agentId) =>
                    c.get<AgentService>('agentService')?.getLifecycleState?.(agentId),
            }),
    );

    register(
        'traceService',
        (c) =>
            new TraceService(
                asDeps<ConstructorParameters<typeof TraceService>[0]>({
                    eventBus: c.get<IEventBus>('eventBus'),
                    database: c.get<IDatabaseService>('database'),
                    get diagnosticService() {
                        return c.get<IDiagnosticService>('diagnosticService');
                    },
                }),
            ),
    );

    register(
        'orchestrator',
        (c) =>
            new OrchestratorClass({
                eventBus: c.get<IEventBus>('eventBus'),
                toolService: c.get<ToolService>('toolService'),
                cognitiveService: c.get<CognitiveService>('cognitiveService'),
                policyService: c.get<PolicyService>('policyService'),
                deadLetterQueue:
                    c.get<import('../contracts/dead-letter-queue').IDeadLetterQueue>(
                        'deadLetterQueue',
                    ),
            }),
    );

    // A-04: roleService depends on roleVersionService — create inside same phase
    register('roleService', (c) => {
        const svc = new RoleService({
            rolesStore: storageLayer?.roles ?? EMPTY_ROLES_STORE,
            keyValue: {
                get: async (id: string) => {
                    const val = configStore ? await configStore.get<unknown>(id) : null;
                    return val != null ? { id, value: val } : undefined;
                },
                put: async (item: { id: string; value: unknown; createdAt?: number }) => {
                    if (configStore) await configStore.set(item.id, item.value);
                },
            },
            eventBus: c.get<IEventBus>('eventBus'),
            toolService: c.get<ToolService>('toolService'),
            orchestrator: c.get<OrchestrationService>('orchestrator'),
            roleVersionService: c.get<RoleVersionService>('roleVersionService'),
        });
        void svc.init();
        return svc;
    });

    register(
        'govStressTestService',
        (c) =>
            new GovStressTestService({
                getPolicies: () =>
                    c
                        .get<PolicyService>('policyService')
                        .getPolicies()
                        .map((p) => ({
                            type: String(p.type),
                            value: typeof p.value === 'number' ? p.value : Number(p.value),
                            enabled: true,
                        })),
                getViolations: (onlyActive, limit) =>
                    c.get<PolicyService>('policyService').getViolations(onlyActive, limit),
                getRoleCount: () => c.get<RoleService>('roleService').getAllRoles().length,
            }),
    );

    register('obsGapsService', (_c) => new ObsGapsService());

    register(
        'skillService',
        (c) =>
            new SkillService({
                skillsStore: storageLayer?.skills ?? EMPTY_SKILLS_STORE,
                eventBus: c.get<IEventBus>('eventBus'),
            }),
    );

    register(
        'mcpService',
        (c) =>
            new MCPService({
                database: c.get<IDatabaseService>('database'),
                eventBus: c.get<IEventBus>('eventBus'),
            }),
    );

    register(
        'sandboxService',
        (c) =>
            new SandboxService({
                toolService: c.get<ToolService>('toolService'),
            }),
    );

    register(
        'budgetService',
        (c) =>
            new BudgetService({
                eventBus: c.get<IEventBus>('eventBus'),
                database: c.get<IDatabaseService>('database'),
                costCalculator: c.get<PricingService>('pricingService'),
            }),
    );

    register(
        'routingPolicyService',
        (c) =>
            new RoutingPolicyService({
                settingsService:
                    c.get<import('../services/settings-service').SettingsService>(
                        'settingsService',
                    ),
                pricingService: c.get<PricingService>('pricingService'),
            }),
    );
};
