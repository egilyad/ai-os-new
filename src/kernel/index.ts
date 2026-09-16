// WARNING: This barrel is for EXTERNAL consumers (UI, bootstrap, tests) only.
// Kernel-internal files must import directly from their dependency's source file,
// NOT from this barrel. Violations create circular dependencies through the barrel.

// Infrastructure
export { Container } from './container';
export type { IContainer } from './container';
export type { ServiceIdentifier } from './container';

export { EventBus } from './events/event-bus';
export { DatabaseService } from './services/database-service';
export { DataAccessLayerImpl } from './dal';
export type { DataAccessLayer } from './dal';
export { SecurityService } from './security';

// Kernel
export { SystemKernel } from './kernel';
export { RuntimeManager } from './runtime';
export type { RuntimePhase, RuntimeStatus } from './runtime';
export type { RuntimePhase as RuntimePhaseEnum, RuntimeStatus as RuntimeStatusInfo } from './state';
export { SystemBootstrap } from './bootstrap';
export type { InitPhase, BootstrapReport } from './bootstrap';

// Services
export { KeyService, FREE_TIER_LIMITS } from './services/key-management/key-service';
export type { KeyServiceDeps } from './services/key-management/key-service';
export type { FreeTierLimit } from './services/key-management/key-types';
export type { PoolStrategy } from './contracts/pool-selector';

export { RouterService } from './services/provider-router';
export type { RouterServiceDeps } from './services/provider-router';

export { MCPService } from './services/mcp-service';
export type { MCPServiceDeps, MCPServerConfig, MCPResource, MCPTool } from './services/mcp-service';

export { ToolService } from './services/tool-executor';
export type { ToolServiceDeps, ToolDefinition, ToolExecution } from './services/tool-executor';

export { MemoryService } from './services/memory-engine';
export type { MemoryServiceDeps, SearchMode } from './services/memory-engine';

export { PricingService } from './services/pricing-service';
export type { PricingServiceDeps, ModelPricing } from './services/pricing-service';

export { UsageTracker } from './services/usage-tracker';
export type { UsageTrackerDeps, UsageStats, UsageRecord } from './services/usage-tracker';

export { BudgetService } from './services/budget-service';
export type { BudgetServiceDeps } from './services/budget-service';

export { PolicyService } from './services/policy-service';
export type {
    PolicyServiceDeps,
    PolicyType,
    PolicyAction,
    PolicySeverity,
    PolicyViolation,
    PolicyStats,
    AgentPolicy,
    AgentPolicyCheck,
    SecurityPattern,
    ISPolicy,
    PrivacyEnforcementResult,
    ContentSafetyResult,
} from './services/policy-service';

export { ChatExecutor } from './services/chat-executor';
export type { ChatServiceDeps } from './contracts/chat';

export { AgentService } from './services/agent-service';
export type { AgentServiceDeps, AgentStats, AgentGroup } from './services/agent-service';

export { SettingsService } from './services/settings-service';
export type { SettingsServiceDeps, SettingsListener } from './services/settings-service';

export { SandboxService } from './services/sandbox-service';
export type { SandboxServiceDeps } from './services/sandbox-service';

export { CognitiveService } from './services/cognitive-service';
export type {
    CognitiveServiceDeps,
    CognitiveStats,
    DecisionAlternative,
} from './services/cognitive-service';

export { RoleService } from './services/role-service';
export type { RoleServiceDeps, RoleUsageStats } from './services/role-service';

export { SkillService } from './services/skill-service';
export type { SkillServiceDeps } from './services/skill-service';

export { ProviderTracker } from './services/provider-tracker';
export type {
    ProviderTrackerDeps,
    ProviderMetricData,
    HealthEvent,
    HealthEventType,
} from './services/provider-tracker';

export { SnapshotService } from './services/snapshot-service';
export type {
    SnapshotServiceDeps,
    SystemSnapshot,
    SnapshotDiff,
    RuntimeState,
} from './services/snapshot-service';

export { AdminService } from './services/admin-service';
export type {
    AdminServiceDeps,
    AdminAuditEntry,
    SystemHealthReport,
} from './services/admin-service';

export { TimelineService } from './services/timeline-service';
export type { TimelineServiceDeps } from './services/timeline-service';

export { MonitoringService } from './services/monitoring-service';
export type { MonitoringServiceDeps } from './services/monitoring-service';

export { AdvisorService } from './services/advisor-service';
export type { AdvisorServiceDeps } from './types/advisor-deps';

export { ProviderAdapterRegistry } from './services/provider-adapter-registry';

export { LLMClientService } from './services/llm-client-service';
export type { ILLMClientConfig } from './contracts/provider-adapter';

export { VirtualKeyService } from './services/virtual-key-service';
export type { VirtualKeyServiceDeps } from './services/virtual-key-service';
export type {
    AdvisorMetrics,
    OptimizationSuggestion,
    ProposedChange,
    PressureMapSnapshot,
    ProviderPressure,
    GlobalPressure,
    AdvisorPressureLevel,
    DiagnosticFinding,
    ProviderDiagnostic,
    WhatIfScenario,
    RuntimeScenario,
    SREAlert,
    IPressureEngine,
    IDiagnosticsEngine,
    IWhatIfEngine,
    IInsightEngine,
    IOptimizationEngine,
} from './contracts/advisor';

// Contracts — Core
export type { Result, AsyncResult } from './contracts/results';
export { ok, fail, isOk, isFail } from './contracts/results';

export type {
    ProviderError,
    QuotaError,
    MemoryError,
    ToolError,
    RoutingError,
    KernelError,
    ConfigError,
    KernelErrorUnion,
} from './contracts/errors';

export type {
    ICostCalculator,
    IUsageTracker,
    CostEstimate,
    ProviderBudget,
    BudgetInfo,
    PricingCapability,
    CostCalculationError,
} from './contracts/pricing';
export type { RequestClassification, RouterDecision } from './contracts/provider';
export type { IMemoryEngine, MemoryCapability, MemoryQuery } from './contracts/memory';
export type { ITimelineContract } from './contracts/observability';

export type {
    AdapterMessage,
    AdapterFinishReason,
    AdapterResponse,
    AdapterHealthResult,
    IProviderAdapter,
    IAdapterRegistry,
    ToolCall,
} from './contracts/provider-adapter';

export type { CacheEntry, ICacheService } from './contracts/cache';

export type {
    ThemeConfig,
    NotificationPreferences,
    DataManagementSettings,
    SystemSettings,
    SettingsProfile,
    ISettingsService,
} from './contracts/settings';

export type { AgentBudget, SpendSummary, BudgetAlert, IBudgetService } from './contracts/budget';

export type {
    VirtualKey,
    IVirtualKeyService,
    VirtualKeyServiceEvents,
} from './contracts/virtual-key';

export { CounterfactualExplanationService } from './services/counterfactual-explanation-service';
export type {
    ICounterfactualExplanationService,
    DecisionExplanation,
    ProviderExplanation,
    ScoreComponentDelta,
    DecisiveComponent,
} from './contracts/counterfactual-explanation';

export { CounterfactualNarrativeService } from './services/counterfactual-narrative-service';
export type {
    ICounterfactualNarrativeService,
    NarrativeExplanation,
} from './contracts/counterfactual-narrative';

export { TemporalReplayService } from './services/temporal-replay-service';
export type {
    ITemporalReplayService,
    TemporalTrace,
    TemporalFrame,
    ScoreSnapshot,
} from './contracts/temporal-replay';

export { TruthConsistencyMonitor } from './services/truth-consistency-monitor';
export type {
    ITruthConsistencyMonitor,
    ConsistencyReport,
    DriftEntry,
    DriftSeverity,
} from './contracts/truth-consistency';

// Events
export { ProviderEvents, ChatEvents, SystemEvents, EVENTS, ObservabilityEvents } from './events';
export type {
    ProviderEventMap,
    ApiKeyPayload,
    QuotaExceededPayload,
    ChatEventMap,
    ChatSendPayload,
    StreamLifecyclePayload,
    StreamChunkPayload,
    StreamEndPayload,
    StreamErrorPayload,
    SystemEventMap,
    NotificationPayload,
    DecisionPayload,
    ObservabilityEventMap,
} from './events';

// State
export { isValidRuntimeTransition } from './state';
export type {
    RuntimeTransition,
    RuntimeStateChangeListener,
    HealthStatus,
    ProviderHealth,
    ProviderHealthSummary,
    HealthChangeEvent,
    HealthChangeListener,
    ProviderHealthTrend,
    ProviderStateStatus,
    ProviderRawMetrics,
    ProviderStateEntry,
    ProviderStateSnapshot,
    TokenBudget,
    RequestBudget,
    CostBudget,
    QuotaAlert,
    QuotaStateSnapshot,
    BudgetConfig,
    MemoryPlaneStats,
    CachePlaneStats,
    MemoryStateSnapshot,
    MemoryPressureIndicators,
    DebatePhase,
    DebateParticipantState,
    DebateSessionState,
    DebateStateSnapshot,
    ConsensusState,
    ObservabilityStateSnapshot,
    TimelineStateSnapshot,
    TraceStateSnapshot,
    MetricStateSnapshot,
    SystemHealthIndicators,
    CacheStateEntry,
    CacheStateSnapshot,
    SettingsStateSnapshot,
    BudgetStateEntry,
    BudgetAlertEntry,
    BudgetStateSnapshot,
    VirtualKeyStateSnapshot,
} from './state';

// Types
export type {
    IEventBus,
    IDatabaseService,
    ISecurityService,
    IRuntimeManager,
    IKernel,
    IBootstrap,
    IProviderTracker,
    KernelDeps,
} from './types/interfaces';
