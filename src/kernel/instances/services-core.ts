import { lazyService } from '../service-helper';
import type { SettingsService } from '../services/settings-service';
import type { IMemoryEngine } from '../contracts/memory';
import type { MCPService } from '../services/mcp-service';
import type { RouterService } from '../services/provider-router';
export type { RouterDecision, PipelineStep } from '../services/provider-router';
import type { OrchestrationService } from '../services/orchestration-service';
import type { CognitiveService } from '../services/cognitive-service';
import type { AgentService } from '../services/agent-service';
import type { ToolService } from '../services/tool-executor';
import type { RoleService } from '../services/role-service';
import type { PolicyService } from '../services/policy-service';
import type { PricingService } from '../services/pricing-service';
import type { AdminService } from '../services/admin-service';
import type { MonitoringService } from '../services/monitoring-service';
import type { SnapshotService } from '../services/snapshot-service';
import type { AdvisorService } from '../services/advisor-service';
import type { DebateSyncManager } from '../services/debate-runtime/debate-sync-manager';
type DebateService = DebateSyncManager;
import type { DebateEngine } from '../services/debate-runtime/debate-engine';
import type { CognitiveIntelligenceService } from '../services/cognitive-intelligence/cognitive-intelligence-service';
import type { PressureMapService } from '../services/runtime-intelligence/pressure-map-service';
import type { DiagnosticService } from '../services/runtime-intelligence/diagnostic-service';
import type { WhatIfService } from '../services/runtime-intelligence/whatif-service';
import type { ConfigService } from '../services/config-service';
import type { NotificationWebhookService } from '../services/notification-webhook-service';
import type { ExternalSecretsService } from '../services/external-secrets-service';
import type { CompromiseWebhookService } from '../services/compromise-webhook-service';
import type { SkillService } from '../services/skill-service';
import type { WorkspaceService } from '../services/workspace-service';
import type { KeyStateStore } from '../services/key-state-store';
import type { ProbeService } from '../services/probe-service';
import type { SessionAffinityStore } from '../services/session-affinity-store';
import type { IExecutionGovernor } from '../contracts/execution-governor';
import type { MemoryOrchestrator } from '../services/memory-orchestrator';
import type { IEvalDatasetService } from '../contracts/eval-dataset';
import type { ICustomMetricsService } from '../contracts/custom-metrics';
import type { IUnifiedRoleRegistry } from '../contracts/unified-role';
import type { IEcosystemEngine } from '../contracts/ecosystem';
import type { IRoleTeamService } from '../contracts/role-team';
import type { ChatExecutor } from '../services/chat-executor';
import type { AutoDebateService as AutoDebateServiceType } from '../services/debate-runtime/auto-debate/auto-debate-service';

export { database, keyService, adapterRegistry } from './core-references';

export const settingsService = lazyService<SettingsService>('settingsService', {
    getSettings: () => ({
        theme: 'dark',
        language: 'en',
        notifications: true,
        themeConfig: { mode: 'dark', primaryColor: '#3b82f6' },
    }),
    subscribe: () => () => {},
});

export const memoryService = lazyService<IMemoryEngine>('memoryService');
export const mcpService = lazyService<MCPService>('mcpService');
export const routerService = lazyService<RouterService>('routerService');
export const orchestrator = lazyService<OrchestrationService>('orchestrator');
export const agentService = lazyService<AgentService>('agentService');
export const toolService = lazyService<ToolService>('toolService');
export const roleService = lazyService<RoleService>('roleService');
export const policyService = lazyService<PolicyService>('policyService');
export const pricingService = lazyService<PricingService>('pricingService');
export const adminService = lazyService<AdminService>('adminService');
export const snapshotService = lazyService<SnapshotService>('snapshotService');
export const cognitiveService = lazyService<CognitiveService>('cognitiveService');
export const advisorService = lazyService<AdvisorService>('advisorService');
export const pressureMapService = lazyService<PressureMapService>('pressureMapService');
export const debateService = lazyService<DebateService>('debateService');
export const chatService = lazyService<ChatExecutor>('chatService');
export const autoDebateService = lazyService<AutoDebateServiceType>('autoDebateService');
export const workspaceService = lazyService<WorkspaceService>('workspaceService');
export const keyStateStore = lazyService<KeyStateStore>('keyStateStore');
export const probeService = lazyService<ProbeService>('probeService');
export const executionGovernor = lazyService<IExecutionGovernor>('executionGovernor');
export const memoryOrchestrator = lazyService<MemoryOrchestrator>('memoryOrchestrator');
export const evalDatasetService = lazyService<IEvalDatasetService>('evalDatasetService');
export const customMetricsService = lazyService<ICustomMetricsService>('customMetricsService');
export const unifiedRoleRegistry = lazyService<IUnifiedRoleRegistry>('unifiedRoleRegistry');
export const roleTeamService = lazyService<IRoleTeamService>('roleTeamService');
export const ecosystemEngine = lazyService<IEcosystemEngine>('ecosystemEngine');

export const monitoringService = lazyService<MonitoringService>('monitoringService');
export const cognitiveIntelligenceService = lazyService<CognitiveIntelligenceService>(
    'cognitiveIntelligenceService',
);
export const diagnosticService = lazyService<DiagnosticService>('diagnosticService');
export const whatIfService = lazyService<WhatIfService>('whatIfService');
export const configService = lazyService<ConfigService>('configService');
export const notificationWebhookService = lazyService<NotificationWebhookService>(
    'notificationWebhookService',
);
export const externalSecretsService = lazyService<ExternalSecretsService>('externalSecretsService');
export const skillService = lazyService<SkillService>('skillService');
export const compromiseWebhookService = lazyService<CompromiseWebhookService>(
    'compromiseWebhookService',
);

// ── Debate Services ──
import type { DebateHumanService } from '../services/debate-runtime/debate-human-service';
import type { StrategyManager } from '../services/debate-runtime/debate-strategy-manager';
import type { DebateModeManagerPersistent } from '../services/debate-runtime/debate-mode-manager';
import type { DebateWorkspace } from '../services/debate-runtime/debate-workspace';
import type { DebatePolicyEngine } from '../services/debate-runtime/debate-policy-engine';
export const debateHumanService = lazyService<DebateHumanService>('debateHumanService');
export const strategyManager = lazyService<StrategyManager>('strategyManager');
export const strategyRegistry = strategyManager;
export const debateModeManager = lazyService<DebateModeManagerPersistent>('debateModeManager');
export const debateWorkspace = lazyService<DebateWorkspace>('debateWorkspace');
export const debatePolicyEngine = lazyService<DebatePolicyEngine>('debatePolicyEngine');
export const debateEngine = lazyService<DebateEngine>('debateEngine');

// ── Bookmarks & Journal ──
import type { ChatBookmarksService as ChatBookmarksServiceType } from '../services/chat-bookmarks-service';
import type { AgentJournalService as AgentJournalServiceType } from '../services/agent-journal-service';
export const chatBookmarksService = lazyService<ChatBookmarksServiceType>('chatBookmarksService');
export const agentJournalService = lazyService<AgentJournalServiceType>('agentJournalService');

// ── Intelligence ──
import type { KeyFingerprints as KeyFingerprintsType } from '../services/key-management/key-fingerprints';
import type { IKeyIntelligencePipeline } from '../contracts/key-intelligence';
import type { PersonaService as PersonaServiceType } from '../services/persona-service';
export const fingerprints = lazyService<KeyFingerprintsType>('fingerprints');
export const keyIntelligencePipeline =
    lazyService<IKeyIntelligencePipeline>('keyIntelligencePipeline');
export const sessionAffinityStore = lazyService<SessionAffinityStore>('sessionAffinityStore');
export const personaService = lazyService<PersonaServiceType>('personaService');
export const roleVersionService =
    lazyService<import('../services/role-version-service').RoleVersionService>(
        'roleVersionService',
    );
export const roleTestingSandboxService = lazyService<
    import('../services/role-testing-sandbox').RoleTestingSandboxService
>('roleTestingSandboxService');

// ── Cache & Bridge ──
import type { ICacheService } from '../contracts/cache';
import type { RouterProjection } from '../services/projections/router-projection';
import type { ISessionManager } from '../contracts/session-manager';
export const cacheService = lazyService<ICacheService>('cacheService');
export const routerProjection = lazyService<RouterProjection>('routerProjection');
export const sessionManager = lazyService<ISessionManager>('sessionManagerService');

// ── Causal Debugger ──
import type { ICausalScopeManager, ICausalTraceStore } from '../contracts/causal-debugger';
export const causalScopeManager = lazyService<ICausalScopeManager>('causalScopeManager');
export const causalTimelineService = lazyService<ICausalTraceStore>('causalTimelineService');

// ── Counterfactual ──
import type { ICounterfactualEngine } from '../contracts/counterfactual';
import type { ICounterfactualExplanationService } from '../contracts/counterfactual-explanation';
import type { ICounterfactualNarrativeService } from '../contracts/counterfactual-narrative';
import type { ITemporalReplayService } from '../contracts/temporal-replay';
import type { ITruthConsistencyMonitor } from '../contracts/truth-consistency';
export const counterfactualEngine = lazyService<ICounterfactualEngine>('counterfactualEngine');
export const counterfactualExplanationService = lazyService<ICounterfactualExplanationService>(
    'counterfactualExplanationService',
);
export const counterfactualNarrativeService = lazyService<ICounterfactualNarrativeService>(
    'counterfactualNarrativeService',
);
export const temporalReplayService = lazyService<ITemporalReplayService>('temporalReplayService');
export const truthConsistencyMonitor =
    lazyService<ITruthConsistencyMonitor>('truthConsistencyMonitor');

// ── Group & Status ──
import type { IGroupManager } from '../contracts/group-manager';
import type { ISystemStatusService } from '../contracts/system-status';
import type { SystemState } from '../types/metrics-types';
import type { HealthEvent, ProviderTracker } from '../services/provider-tracker';
export type { HealthEvent } from '../services/provider-tracker';
import type { ProviderRanking } from '../types/interfaces';
export const groupManager = lazyService<IGroupManager>('groupManagerService', {
    getAllKeys: () => [],
});
export const systemStatusService = lazyService<ISystemStatusService>('systemStatusService');
export const kernel = lazyService<{
    getStateSnapshot(): SystemState;
    getState(): SystemState;
    getHealthEvents(provider?: string, limit?: number): HealthEvent[];
    getProviderRankings(catalogProviders?: string[]): ProviderRanking[];
    getCollaborativeSuggestions(
        installedProviders?: string[],
    ): Array<{ provider: string; reason: string; matchScore: number }>;
}>('kernel');
export const providerTracker = lazyService<ProviderTracker>('providerTracker');
