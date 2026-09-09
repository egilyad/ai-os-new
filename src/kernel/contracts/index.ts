export type { Result, AsyncResult } from './results';
export { ok, fail, isOk, isFail } from './results';

export type {
    ProviderError,
    QuotaError,
    MemoryError,
    ToolError,
    RoutingError,
    KernelError,
    ConfigError,
    KernelErrorUnion,
} from './errors';
export {
    isProviderError,
    isQuotaError,
    isMemoryError,
    isToolError,
    isRoutingError,
} from './errors';

export type {
    ICostCalculator,
    IUsageTracker,
    CostEstimate,
    ProviderBudget,
    BudgetInfo,
    PricingCapability,
    CostCalculationError,
} from './pricing';
export type { RequestClassification, RouterDecision } from './provider';
export type { IMemoryEngine, MemoryCapability, MemoryQuery } from './memory';
export type {
    IMemoryStore,
    MemoryStoreQuery,
    MemoryStoreSnapshot,
    ConsolidationReport,
} from './memory-store';
export { MemoryStoreType, computeRetention, computeHalfLife } from './memory-store';

export type {
    TimelineEvent,
    TimelineFilter,
    TimelineEventType,
    TimelineCategory,
    ITimelineContract,
} from './observability';

export type {
    AdapterMessage,
    AdapterFinishReason,
    AdapterResponse,
    IProviderAdapter,
    IAdapterRegistry,
    ILLMClientConfig,
    ILLMClientService,
} from './provider-adapter';

export type { CacheEntry, ICacheService } from './cache';

export type {
    ThemeConfig,
    NotificationPreferences,
    DataManagementSettings,
    SystemSettings,
    SettingsProfile,
    ISettingsService,
} from './settings';

export type { AgentBudget, SpendSummary, BudgetAlert, IBudgetService } from './budget';

export { checkToHealth, normalizeHealthStatus } from './health';
export type { CanonicalHealthStatus } from './health';

export type { VirtualKey, IVirtualKeyService, VirtualKeyServiceEvents } from './virtual-key';

export type { SecretRef, SecretStoreConfig, SecretStore } from './secret-store';

export type { WebhookConfig, WebhookProvider, WebhookEventType } from './webhook';

export type { ILifecycle } from './lifecycle';
export type { ITransaction } from './transaction';
export type { ILogger, ITraceContext, LogEntry, LogLevel } from './logger';
export type {
    ICausalScopeManager,
    ICausalTraceStore,
    CausalScope,
    CausalTraceEntry,
    CausalTrace,
    EventRef,
    ProjectionSnapshot,
    CausalScopeConfig,
} from './causal-debugger';
export type {
    ICounterfactualEngine,
    CounterfactualInput,
    CounterfactualResult,
    CounterfactualScoreDiff,
    CounterfactualOverride,
} from './counterfactual';

export type { CompromiseSignal, WebhookSource, GitHubSecretAlert, SentryAlert } from './compromise';

export type {
    IKeyIntelligencePipeline,
    KeyIntelligenceInput,
    KeyImportReport,
    ParsedKeyResult,
    KeyRiskAssessment,
    RiskFactor,
    AccountGroup,
} from './key-intelligence';

export type {
    ConfigRegistry,
    RouterConfigSection,
    MonitoringConfigSection,
    MetricsConfigSection,
    TracesConfigSection,
    WebhooksConfigSection,
    KeysConfigSection,
    LlmConfigSection,
    PressureConfigSection,
    PricingConfigSection,
} from './config-registry';

// ── Debate Runtime ─────────────────────────────────────────────────────
export type {
    TopologyNode,
    TopologyEdge,
    DebateTopology,
    ITopologyService,
    AgentStateEntry,
    IDebateSession,
    DebateSessionSnapshot,
    DebateBudgetLimits,
    PressureLevel,
    PressureAction,
    IDebateBudget,
    BudgetSnapshot,
    Claim,
    Conflict,
    ConsensusResult,
    IConsensusEngine,
    ReasoningStep,
    ReasoningChain,
    IDebateMemory,
    MemorySnapshot,
    AgentScore,
    IDebateEvaluator,
    OrchestratorEvent,
    IDebateOrchestrator,
    IDebateTimeline,
    ParticipantConfig,
    IDebateEngine,
} from './debate-runtime';

export type {
    TopologyType,
    DebatePhase,
    AgentPhase,
    TimelineEntry,
    IDebateQueryEngine,
    DebateRole,
    DebateSession,
    DebateSessionStrategy,
    DebateParticipant,
    DebateArgument,
    DebateConfig,
    DebateConstraint,
    ArgumentStrategy,
    DebateVerdict,
    VerdictKeyArgument,
    ConclusionType,
    StanceResult,
    DisagreementPoint,
    TrajectoryChanger,
    ConstraintCorrelation,
    DebateGraphMetrics,
    ActivityMetrics,
    QualityMetrics,
    DebateInterpretation,
    ParentResolution,
    HumanVote,
} from './debate-types';

export type { DebateServiceDeps } from './debate-service-deps';

export type {
    CognitiveMetricsSnapshot,
    CognitiveZone,
    CognitivePressure,
    CognitiveSessionSummary,
    ICognitivePressureEngine,
    SessionDiagnostic,
    CognitiveIssue,
    ICognitiveDiagnosticsEngine,
    TopologyWhatIf,
    ICognitiveWhatIfEngine,
    ICognitiveIntelligenceService,
} from './cognitive-intelligence';

export type {
    IRoutingPolicy,
    FallbackLink,
    FallbackRecord,
    PenaltyRecord,
    HealthPenaltyInput,
    HealthPenaltyResult,
    RoutingPolicyPreview,
    RoutingPolicyPreviewInput,
    RoutingPolicySnapshot,
} from './routing-policy';

export type {
    IWhatIfService,
    BudgetWhatIf,
    ProviderWhatIf,
    StrategyWhatIf,
    SimulationRecord,
} from './whatif-service';

export type {
    IPressureMapService,
    ProviderPressureEntry,
    SessionPressureEntry,
    PressureMapSnapshot,
    PressureTrendPoint,
    PressureAlert,
} from './pressure-map-service';

export type {
    IDiagnosticService,
    DiagnosticScope,
    ProviderDiagnostic,
    SystemDiagnostic,
    DiagnosticRunRecord,
} from './diagnostic-service';

export type { IKeyVaultService } from './key-vault';
export type { IHealthCheckService } from './health-check';
export type { IKeyAnalyticsService } from './key-analytics';
export type { IPoolSelectorService, PoolStrategy } from './pool-selector';

// ── Storage Layer ─────────────────────────────────────────────────
export type {
    StorageLayer,
    KeyStore,
    DexieMemoryStore,
    TraceStore,
    SessionStore,
    ConfigStore,
    RolesStore,
    SkillsStore,
} from './storage/storage-layer';
export type { ChatSession, ChatEntry } from './storage/session-store';
export type { CognitiveTrace } from '../types/domain-types';

// ── Auto-Debate ───────────────────────────────────────────────────
export type {
    IAutoDebateService,
    AutoDebateOptions,
    AutoDebateResult,
    ProviderWinRate,
    BatchTestResult,
    TournamentResult,
    TournamentMatch,
} from './auto-debate';

// ── Debate Strategy DSL ────────────────────────────────────────────
export type {
    StrategyPrimitiveType,
    StrategyPrimitiveBase,
    SequenceStep,
    SequencePrimitive,
    GraphEdgeType,
    GraphEdge,
    GraphAgentConfig,
    DebateGraphPrimitive,
    CriticLoopPrimitive,
    VotingMechanism,
    VotingPrimitive,
    ReviewCriteria,
    PeerReviewPrimitive,
    StrategyPrimitive,
    StrategyParameter,
    StrategyDefinition,
    IncompatibilitySeverity,
    Incompatibility,
    StrategyCompatibility,
    ValidationResult,
    ValidationError,
    StrategyRegistryEntry,
    IStrategyRegistry,
} from './debate-strategy-dsl';

// ── Debate Mode System ─────────────────────────────────────────────
export type {
    DebateModeId,
    PolicyType,
    ModePolicy,
    DebateMode,
    DebateModePreset,
} from './debate-mode-system';

// ── Missing re-exports ────────────────────────────────────────────
export type {
    ProviderPressure,
    GlobalPressure,
    IPressureEngine,
    DiagnosticCategory,
    DiagnosticSeverity,
    DiagnosticFinding,
    IDiagnosticsEngine,
    WhatIfScenario,
    RuntimeScenario,
    IWhatIfEngine,
    LLMAnalysisResult,
    IInsightEngine,
    AdvisorPressureLevel,
    AdvisorMetrics,
    AdvisorConfig,
    SuggestionType,
    SuggestionImpact,
    ProposedChange,
    OptimizationSuggestion,
    SREAlert,
    IOptimizationEngine,
} from './advisor';
export type { IKeyRotationManager, IRotationService } from './key-rotation';
export type { NodeType, ISNode, ISEdge, ISTopology, ISPolicy } from './topology';

export type { IWorkspaceService, FileNode, SearchMatch, FileReadRecord } from './workspace';
export { WORKSPACE_EVENTS } from './workspace';
export type { WorkspaceAttachPayload, WorkspaceFileReadPayload } from './workspace';

export type { IProbeService, ProbeResult, ProbeStatus } from './probe';

export type {
    IKeyStateStore,
    KeyState,
    KeyStatus,
    KeyProbeSnapshot,
    KeyHealthSnapshot,
    KeyQuotaSnapshot,
    KeyRoutingState,
} from './key-state';
export type { KeyStateEvent } from './key-state';

export { FEATURE_FLAGS } from './feature-flags';
export type { FeatureFlag } from './feature-flags';

export type { ILocalStorageAdapter } from './storage-adapter';

// ── Session Manager ──────────────────────────────────────────────
export type {
    ISessionManager,
    SessionMeta,
    DebateCreateData,
    SessionType,
    SessionStatus,
    SessionFilters,
    SessionLink,
    DebateTimelineEntry,
    DebateOverride,
} from './session-manager';

// ── Event Bridge ──────────────────────────────────────────────────
export type { KernelEvent } from './event-log';
export type { Projection } from './projection';

export type { IGroupManager, KeyGroup, KeyPassport } from './group-manager';

export type {
    IExecutionGovernor,
    OperationSpec,
    ManagedOperation,
    OperationState,
    OperationType,
    OperationFilter,
} from './execution-governor';

// ── Counterfactual Explanation ────────────────────────────────────
export type {
    ICounterfactualExplanationService,
    DecisionExplanation,
    ProviderExplanation,
    ScoreComponentDelta,
    DecisiveComponent,
} from './counterfactual-explanation';

// ── Counterfactual Narrative ─────────────────────────────────────
export type {
    ICounterfactualNarrativeService,
    NarrativeExplanation,
} from './counterfactual-narrative';

// ── Temporal Replay ─────────────────────────────────────────────
export type {
    ITemporalReplayService,
    TemporalTrace,
    TemporalFrame,
    ScoreSnapshot,
} from './temporal-replay';

// ── Truth Consistency ──────────────────────────────────────────
export type {
    ITruthConsistencyMonitor,
    ConsistencyReport,
    DriftEntry,
    DriftSeverity,
} from './truth-consistency';

// ── System Status ──────────────────────────────────────────────
export type { ISystemStatusService, SystemStatusReport, SystemStatusValue } from './system-status';

// ── Routing Experiments ───────────────────────────────────────
export type {
    IRoutingExperimentsService,
    RoutingExperimentConfig,
    RoutingExperimentResult,
    RoutingExperimentRun,
    StrategyComparison,
} from './routing-experiments';

// ── Obs Gaps ──────────────────────────────────────────────────
export type {
    IObsGapsService,
    ObsGapsReport,
    ObsCoverage,
    ServiceObsInfo,
    DocEventCoverage,
} from './obs-gaps';

// ── Agent Health ──────────────────────────────────────────────
export type { AgentHealth, AgentHealthSnapshot } from './agent-health';

// ── Tool Types ────────────────────────────────────────────────
export type { ToolDefinition, ToolCategory } from './tool-types';

// ── Debate Human ──────────────────────────────────────────────
export type { IDebateHumanService } from './debate-human';

// ── Audience ──────────────────────────────────────────────────
export type {
    AudienceArchetype,
    AudienceMember,
    AudienceReaction,
    AudienceReactionEvent,
    AudiencePoll,
    AudienceSideChatMessage,
    AudienceState,
    IAudienceService,
} from './audience';

export type { TutorialStep, Tutorial, TutorialProgress, ITutorialService } from './tutorial';

export type {
    CollaborationPermission,
    TeamMember,
    Team,
    InviteLink,
    SharedSession,
    ITeamCollaborationService,
} from './team-collaboration';

export type {
    FineTuningMethod,
    FineTuningStatus,
    FineTuningHyperparams,
    FineTuningDataset,
    FineTuningJob,
    IFineTuningService,
} from './fine-tuning';

export type {
    DistillationMethod,
    DistillationStatus,
    DistillationConfig,
    DistillationJob,
    IDistillationService,
} from './model-distillation';

export type {
    DeployTarget,
    DeployEnvironment,
    DeployStatus,
    DeployConfig,
    DeployLog,
    Deployment,
    IDeployService,
} from './deploy';

export type {
    BudgetAlertRule,
    BudgetAlertEvent,
    BudgetAlertCondition,
    BudgetAlertAction,
    IBudgetAlertService,
} from './budget-alert';
export type {
    TopologyTemplate,
    TopologyTemplateNode,
    TopologyTemplateEdge,
    ITopologyTemplateService,
} from './topology-templates';
export type {
    KeyUsageSummary,
    ProviderUsageBreakdown,
    UsageTrend,
    IKeyUsageAnalyticsService,
} from './key-usage-analytics';
export type { PromptVersion, PromptMeta, IPromptVersionService } from './prompt-version-history';
export type { MigrationPlan, MigrationStep, IProviderMigrationService } from './provider-migration';
export type { SlaRule, SlaProfile, IHealthSlaService } from './health-sla';
export type {
    ResearchReport,
    ReportSection,
    ReportFormat,
    ReportStatus,
    IResearchReportService,
} from './research-report';
export type {
    VoiceInputSession,
    VoiceInputSource,
    InputStatus,
    MultimodalType,
    MultimodalAttachment,
    IVoiceInputService,
} from './voice-input';
export type {
    ProtocolMessageType,
    ProtocolCapability,
    AgentProtocolMessage,
    AgentCapability,
    AgentRegistration,
    IAgentProtocolService,
} from './agent-protocol';

export type {
    IFederatedMemoryService,
    FederatedNode,
    FederationConfig,
    SyncSession,
    FederationRole,
} from './federated-memory';
export type {
    IPluginSdkService,
    PluginManifest,
    PluginInstance,
    PluginHook,
    PluginType,
    PluginStatus,
    PluginPermission,
} from './plugin-sdk';
export type {
    IPersonaMarketplaceService,
    PersonaListing,
    PersonaCategory,
} from './persona-marketplace';
export type { ITemplateSharingService, SharedTemplate, TemplateCategory } from './template-sharing';
export type {
    IMemoryTransferService,
    MemoryExport,
    MemoryImport,
    ExportFormat,
} from './memory-transfer';
export type { IAquariumTradingService, TradeOffer, TradeStatus } from './aquarium-trading';
export type { ITimeMachineService, TimeSnapshot, SnapshotScope } from './time-machine';
export type {
    IContributionService,
    ContributionGraph,
    ContributionDay,
    ContributionWeek,
} from './contribution';
export type {
    IGeminiLiveService,
    GeminiLiveSession,
    GeminiLiveMessage,
    LiveStatus,
} from './gemini-live';
export type {
    IMetaLearningService,
    MetaLearningState,
    LearningSignal,
    LearnedPattern,
} from './meta-learning';
export type {
    IQuantumInspirationService,
    QuantumOptimizationProblem,
    QuantumSolution,
    QuantumSolverType,
} from './quantum-inspiration';

// ── Gemini Research ─────────────────────────────────────────────
export type {
    IGeminiResearchService,
    GeminiEnhancedSearchResult,
    GeminiResearchSource,
    GeminiClaimAnalysis,
    GeminiEnhancedSummary,
    GeminiPeerReviewOutput,
    GeminiAnomalyResult,
} from './gemini-research';

export type {
    SmartRoutingConfig,
    RoutingRule,
    RoutingCondition,
    FallbackStep,
    RoutingDecision,
    ISmartRoutingService,
} from './smart-routing';

export type {
    NvidiaEnterpriseConfig,
    ComplianceStatus,
    SLARecord,
    RegionStatus,
    EnterpriseFeature,
    INvidiaEnterpriseService,
} from './nvidia-enterprise';

export type { CachedContent, FreeTierUsage, IGeminiCacheService } from './gemini-cache';

export type {
    ProviderAchievement,
    AchievementProgress,
    IProviderAchievementService,
} from './provider-achievements';

export type {
    RoleTeam,
    TeamTemplate,
    TeamStrategy,
    TeamDomain,
    TeamExecutionConfig,
    TeamExecution,
    RoleOutput,
    TeamMetrics,
    TeamCompatibilityEntry,
    TeamAnalytics,
    TeamFallback,
    IRoleTeamService,
} from './role-team';

export type { ChatServiceDeps } from './chat';

// ── Debate Entanglement ──────────────────────────────────────────────
export type {
    EntanglementConstraint,
    EntanglementResponseType,
    ResponseValidationResult,
    IEntanglementEngine,
    AnchorClaim,
    IAnchoringService,
} from './debate-entanglement';

// ── Unified Argument Graph (Phase A) ──────────────────────────────────
export type {
    ArgumentEdgeType,
    EdgeDetectionMethod,
    ArgumentNode,
    ArgumentEdge,
    ArgumentGraphStats,
    UnattackedClaim,
    ConstraintCandidate,
    GraphBuildInput,
    IArgumentGraphService,
} from './debate-argument-graph';

// ── Vulnerability Targeting (P0.4) ─────────────────────────────────────
export type {
    VulnerabilityType,
    VulnerabilityTarget,
    IVulnerabilityTargetingService,
} from './debate-vulnerability';
export type { IShadowOpponentService, ShadowCritique } from './debate-shadow-opponent';
export type {
    IAdversarialSourceService,
    SourceVerificationResult,
} from './debate-adversarial-source';
export type {
    IBeliefMiningService,
    MinedBelief,
    BeliefConflict,
    BeliefType,
    ConflictType,
} from './debate-belief-mining';
export { BELIEF_DETECTION_PATTERNS } from './debate-belief-mining';

// ── Graph Minimax (P0.7) ───────────────────────────────────────────────
export type { MinimaxActionType, MinimaxMove, IMinimaxPlanner } from './debate-minimax';

// ── Meta-Agent Controller (P0.8) ───────────────────────────────────────
export type { TacticalRole, TacticalDirective, IMetaAgentController } from './debate-meta-agent';

// ── Steelmanning Protocol (P0.9) ─────────────────────────────────────
export type { SteelmanTarget, ISteelmanService } from './debate-steelman';

// ── Cross-Examination (P0 batch 1) ─────────────────────────────────
export type { CrossExaminationTarget, ICrossExaminationService } from './debate-cross-examination';
export type { DeltaPoint, IDeltaFocusingService } from './debate-delta-focusing';
export type { SharedPremise, IAgreementAnchoringService } from './debate-agreement-anchoring';
export type { UnsupportedClaim, IBurdenOfProofService } from './debate-burden-of-proof';
export type { CriticIssue, IPrePublishCriticService } from './debate-pre-publish-critic';
export type { ExecutableClaim, IExecutableEvidenceService } from './debate-executable-evidence';
export type { TriangulationResult, IEvidenceTriangulationService } from './debate-evidence-triangulation';
export type { HumilityScore, IHumilityScoringService } from './debate-humility-scoring';
export type { CriticFeedback, ICriticService } from './debate-critic';
export type { PivotSignal, IPivotService } from './debate-pivot';
export type { ConcessionOpportunity, IConcessionService } from './debate-concession';
export type { CounterfactualScenario, ICounterfactualService } from './debate-counterfactual';
export type { SynthesisResult, ISynthesisService } from './debate-synthesis';
export type { TriangulationCheck, ITriangulationService } from './debate-triangulation';
export type { EmpathyMirror, IEmpathyService } from './debate-empathy';
export type { HeatLevel, IHeatDetectionService } from './debate-heat';
export type { AbandonedClaim, ISentinelService } from './debate-sentinel';
export type { RedundancyReport, IRedundancyService } from './debate-redundancy';
export type { MultiHopCheck, IMultiHopService } from './debate-multi-hop';
export type { EnthymemeGap, IEnthymemeService } from './debate-enthymeme';
export type { LadderStep, IAbstractionLadderService } from './debate-abstraction-ladder';
export type { ReversalPrompt, IRoleReversalService } from './debate-role-reversal';
export type { FogConfig, IFogOfWarService } from './debate-fog-of-war';
export type { RevealStage, IEvidenceRevelationService } from './debate-evidence-revelation';
export type { HumorInsert, IHumorService } from './debate-humor';
export type { StatusLevel, IStatusDynamicsService } from './debate-status-dynamics';
export type { StyleProfile, IStyleMatchingService } from './debate-style-matching';
export type { PersonaVariant, IDynamicPersonaService } from './debate-dynamic-persona';
export type { ObjectionSlot, IObjectionAnticipationService } from './debate-objection-anticipation';
export type { DialecticSynthesis, IHegelianService } from './debate-hegelian';
export type { UncertaintyNode, IUncertaintyPropagationService } from './debate-uncertainty-propagation';
export type { SafetyFlag, IRhetoricSafetyService } from './debate-rhetoric-safety';
export type { Bid, IBiddingTimeService } from './debate-bidding-time';
export type { Order, IAdaptiveOrderService } from './debate-adaptive-order';
export type { DeliberationResult, IJudgeDeliberationService } from './debate-judge-deliberation';
export type { BlendResult, ISemanticBlendingService } from './debate-semantic-blending';
export type { FactCheckResult, IFactCheckingService } from './debate-fact-checking';
export type { CalibrationScore, IEpistemicCalibrationService } from './debate-epistemic-calibration';
export type { PivotQuestion, ISocraticPivotService } from './debate-socratic-pivot';
export type { Whisper, IWhisperChannelsService } from './debate-whisper-channels';
export type { Alliance, IAllianceService } from './debate-alliance';
export type { MarketPrediction, IPredictionMarketService } from './debate-prediction-market';

// ── Burden of Proof Tracker (P0.10) ─────────────────────────────────
export type { BoPStatus, BurdenEntry, UnmetBurden, IBoPTrackerService } from './debate-bop';

// ── Consistency Enforcer (P0.11) ──────────────────────────────────
export type { Contradiction, ConsistencyWarning, IConsistencyService } from './debate-consistency';

// ── Source Credibility Rater (P0.12) ─────────────────────────────
export type { SourceCredibility, ICredibilityScorer } from './debate-credibility';

// ── Echo Chamber / Redundancy Monitor (P1.26) ──────────────────
export type { IReplaySelector, PivotalMoment } from './debate-replay';
export type { ISimilarityMonitor, RedundancyRecord } from './debate-similarity';

// ── Persona Drift Detector (P1.16) ────────────────────────────
export type { IPersonaDriftDetector, DriftRecord, PersonaProfile } from './debate-drift';

// ── InsightBus (P1.21) ───────────────────────────────────────
export type { IInsightBus, Insight, InsightType } from './debate-insight-bus';
export type {
    ILogicalFormExtractor,
    LogicalForm,
    LogicalFormType,
    EnthymemeTarget,
} from './debate-logic';
export type {
    IJustificationEnforcer,
    JustificationChain,
    JustificationHop,
} from './debate-justification';
export type { IBiasProfiler, BiasProfile, BiasType, BiasScore } from './debate-bias';
export type { IInterruptQueue, InterruptRequest } from './debate-interrupt';

// ── Blind Evaluation (P2.12) ──────────────────────────────────────
export type { IBlindEvaluationService } from './debate-blind-eval';

// ── Quality Impact Tracker (P0 MVP) ──────────────────────────────
export type {
    IQualityImpactCollector,
    QualityImpactEvent,
    QualityEventType,
    QualityEventPayload,
    TechniqueImpactMetrics,
    QualitySessionRecord,
    PromptBlockUsedPayload,
    ServiceExecutedPayload,
    SignalCreatedPayload,
    ScoreChangedPayload,
    ArgumentFeaturePayload,
} from './quality-impact';

// ── Hidden Incentives Mining (P0.17) ─────────────────────────────
export type { IncentiveProfile, IncentiveAnalysis, IIncentiveDetector } from './debate-incentives';

// ── Graph-of-Thoughts Deliberation (P1.28) ─────────────────────
export type { GoTBranchType, GoTBranch, GoTResult, IGoTDeliberation } from './debate-got';

// ── Semantic Concept Blending (P1.29) ──────────────────────────
export type {
    DeadlockSignal,
    BlendedConcept,
    BlendResult,
    IConceptBlender,
} from './debate-blending';

// ── Outcome Forecaster (P1.30) ──────────────────────────────────
export type { ArgumentVariant, ForecastResult, IOutcomeForecaster } from './debate-forecaster';

// ── Best-of-N Selection (P2.4) ──────────────────────────────────
export type { VariantScore, BestOfNResult, LlmCallFn, IBestOfNSelector } from './debate-best-of-n';

// ── Crew + Task + Process + Agent Forge (Roadmap Wave 1) ──
export type {
    AgentCard,
    AgentRole,
    CreateCrewInput,
    CreateRoleInput,
    CreateTaskInput,
    CrewRunResult,
    ForgeProposal,
    IAgentForgeService,
    ICrewService,
    ICrewTaskExecutor,
} from './crew';

// ── Council / advanced debate (Roadmap Wave 2) ──
export type {
    AudienceVote,
    CouncilChannel,
    CouncilConfig,
    CouncilMessage,
    CouncilParticipant,
    CouncilPhase,
    CouncilRoleKind,
    CouncilSession,
    FactPacket,
    JudgeScore,
    CreateCouncilInput,
    CouncilProposal,
    ICouncilLlmPort,
    ICouncilService,
} from './council';

// ── State Graph runtime (Roadmap Wave 3) ──
export type {
    DecisionEntry,
    GraphCheckpoint,
    GraphDefinition,
    GraphNodeDef,
    GraphEdge,
    GraphRun,
    GraphThread,
    HitlRequest,
    OrchestrationMode,
    DefineGraphInput,
    IGraphLlmPort,
    IGraphDelegates,
    IGraphService,
} from './graph';

// ── Persona & Context (Roadmap Wave 4) ──
export type {
    ContextEntry,
    ContextEntryKind,
    Goal,
    GoalStatus,
    LongTermMemory,
    MemoryLink,
    MemoryRelation,
    MemoryTier,
    PersonProfile,
    PersonaDepth,
    SharedContext,
    VoiceProfile,
    IPersonaLlmPort,
    ILtMemoryService,
    IPersonaService,
    ISharedContextService,
} from './persona';

// ── Ops / governance / mobile (Roadmap Wave 5) ──
export type {
    AuditEntry,
    HierarchyNode,
    McpServer,
    MissionWatch,
    MobileSession,
    PushNotification,
    SandboxKind,
    SandboxTicket,
    SkillManifest,
    ToolGrant,
    IAuditService,
    IHierarchyService,
    IToolGovernanceService,
    ISandboxBrokerService,
    ISkillMarketService,
    IFleetMonitorService,
    IMobileAccessService,
} from './ops';

// ── Interop / federation / coordination (Phase A: Waves 6+7) ──
export type {
    A2AAgent,
    CapabilityManifest,
    CollaborationContract,
    FederationPeer,
    GatewayEnvelope,
    HandoffRecord,
    InteropProtocol,
    MarketBid,
    MarketListing,
    TrustLevel,
    IInteropTransport,
    IA2AService,
    IGatewayService,
    IFederationService,
    ICoordinationService,
} from './interop';

// ── Meta & unified memory (Phase B: Waves 8+9) ──
export type {
    CogMemory,
    CogMemoryKind,
    CounterfactualRecord,
    Decomposition,
    HealthKind,
    HealthSignal,
    ImprovementKind,
    ImprovementProposal,
    KnowledgePackage,
    MemoryPolicy,
    MemoryScope,
    StrategyRecord,
    IMetaAgentService,
    IStrategyService,
    ICogMemoryService,
} from './meta';

// ── Trust & ecosystem (Phase C: Waves 10+11) ──
export type {
    CapabilityGrant,
    ExtensionManifest,
    GovAssignment,
    HumanRole,
    InstallBundle,
    OsSnapshot,
    OsSurface,
    PolicyEffect,
    PolicyRule,
    ProvenanceEdge,
    ProvenanceNode,
    SandboxLevel,
    SurfaceRecord,
    TrustScore,
    IGovernanceService,
    IProvenanceService,
    IEcosystemService,
} from './trust';

// ── Frontier evals & exotic (Phase D: Waves 12+13) ──
export type {
    Benchmark,
    BenchmarkCase,
    CapabilityMatrixEntry,
    EvalRun,
    IntentPlan,
    ModalCapability,
    OrgCharter,
    RedFinding,
    SimAgent,
    Simulation,
    SocietyNorm,
    IFrontierExecutor,
    IEvalService,
    ISimulationService,
    IFrontierOpsService,
} from './frontier';

// ── Parity tools/knowledge/training (GAP E.2/E.3) ──
export type {
    KnowledgeSource,
    TrainGuide,
    ToolRunResult,
    IToolRunnerService,
    IKnowledgeService,
    ITrainingService,
} from './parity';

// ── Rival parity (Phase F: 10 projects) ──
export type {
    AgentLoop,
    ChatTurn,
    GroupChat,
    GuardrailRule,
    MemoryBlock,
    QueuedRun,
    SopDefinition,
    SpeakerSelection,
    Toolkit,
    IGroupChatService,
    IGuardrailService,
    IMemoryBlocksService,
    ISopService,
    IAutonomyService,
    IRunQueueService,
    PlannerStrategy,
    IPlannerService,
    IDyadService,
} from './rivals';

// ── Rival parity 2 (Phase G: 10 more projects) ──
export type {
    CharacterDoc,
    Connection,
    IntegrationApp,
    LoadedDoc,
    ModeDef,
    ReactRun,
    ScopedMem,
    ReactStep,
    IReactService,
    ILoaderService,
    IRagService,
    IRuntimeService,
    ISweService,
    IAiderService,
    IModesService,
    IScopedMemService,
    IIntegrationsService,
    ICharacterService,
} from './rivals2';

// ── Rival parity 3 (Phase H: third 10) ──
export type {
    Reasoning,
    IReasoningService,
    ISessionStateService,
    IDatasetService,
    IFlowApiService,
    IDocStoreService,
    ITypedAgentService,
    ICodePlanService,
    IDialogueService,
    IBotRouterService,
    IPrototypeService,
} from './rivals3';

// ── Rival parity 4 (Phase I: fourth 10) ──
export type {
    ICopilotService,
    IBedrockService,
    ICxfService,
    IAgentforceService,
    IEntityService,
    IKoreService,
    ICampaignService,
    IEmployeeService,
    ICodeAgentService,
    IAssistantService,
    IGumService,
} from './rivals4';

// ── Rival parity 5 (Phase J: fifth 10) ──
export type {
    IAppBuilderService,
    IIdeService,
    IPromptHubService,
    IOntologyService,
    IAclService,
    IWorkQueueService,
    IWriterService,
    IComputerService,
    ISearchService,
    ICodeExecService,
} from './rivals5';

// ── Rival parity 6 (Phase K: sixth 10) ──
export type {
    IN8nService,
    IMakeService,
    IZapierService,
    ITemporalService,
    IAssetService,
    ISensorService,
    IVoiceAgentService,
    ISupportService,
    IVerifyService,
    IDeckService,
} from './rivals6';

// ── Debate plus (Phase L: seventh 10, debate focus) ──
export type {
    DebateFormatId,
    FormatResult,
    IFormatService,
    IArgTechService,
} from './debateplus';

// ── Rival parity 8 (Phase M: forums/diagnostics/cognitive) ──
export type {
    IForumPlusService,
    IDecisionService,
    IPolisService,
    IReflexionService,
    ITotService,
    ISelfConsistencyService,
    ISoarService,
    IAtomService,
    IMeterService,
    IErrorInboxService,
} from './rivals7';

// ── Rival parity 9 (Phase N: hype) ──
export type {
    IOpenClawService,
    IDshService,
    IManusService,
    IGensparkService,
} from './rivals9';

// ── Rival parity 10 (Phase P: Google + Chat Studio) ──
export type {
    A2APart,
    A2ATaskState,
    IA2aSpecService,
    ICacheRegistryService,
    IDotpromptService,
    INotebookService,
    ILiveBridgeService,
    IAssistService,
    IVertexSearchService,
    IDeepResearchService,
    IQuotaGuardService,
    IStudioPackService,
} from './rivals10';

// ── Rival parity 11 (Phase Q: viz + light sims, last 9 to 100) ──
export type {
    INetLogoService,
    IMesaService,
    IBonsaiService,
    IChainlitService,
    IGradioService,
    IChartService,
    IGraphVizService,
    IMalmoService,
    IGymService,
} from './rivals11';
export type {
    IConstitutionalService,
    IVoyagerService,
    ISmallvilleService,
    IAlphaCodeService,
    IWorldModelService,
    INeuroSymbolicService,
    ISwarmService,
    IALifeService,
    ICuriosityService,
    IQuantumDeepService,
} from './rivals12';
export type {
    IMetabolicService,
    IMaestroService,
    ILocalTripleService,
    IChemistService,
    IAnalitikService,
    IRuslanService,
    IHeisenbergService,
    IAgencyRuService,
    IEvoLabService,
    IGigaStudioService,
} from './rivals15';
export type {
    ISciAgentsService,
    ISparksService,
    IAiScientistService,
    ILatentService,
    IEightStageService,
    ICognitaeService,
    ICogTeamService,
    ISynService,
    IHelixService,
    IIdeatorService,
} from './rivals16';
export type {
    IMetaKbService,
    IResearchOsService,
    IDeepResearch2Service,
    IDarwinService,
    IQyvariaService,
    IParliamentaryService,
    IPolicyDebateService,
    ISocraticService,
    IFishbowlService,
    IDelphiService,
} from './rivals18';
export type {
    IPiService,
    IZedService,
    IWarpService,
    IGptEngineerService,
    IGooseService,
    IContinueService,
    ITabbyService,
    IGptPilotService,
    IVoidService,
    ICrushService,
    ICodeWhaleService,
} from './rivals19';
export type {
    ICodexService,
    IGeminiCliService,
    IKiloService,
    IInterpreterService,
    IMiniSweService,
    IHeliconeService,
    IPortkeyService,
    ILiteLlmService,
    ILangfuseService,
} from './rivals20';
export type {
    IRckService,
    ICogneeService,
    IMetanService,
    IConceptsService,
    ISecondBrainService,
    IStormService,
    IBlackboardService,
    IMetaControllerService,
    IDoloresService,
    IEpistemeService,
} from './rivals17';
export type {
    IClaudeCodeService,
    IMcpDeepService,
    IFilesApiService,
    ICacheControlService,
    IProjectService,
    IDynamicWorkflowService,
    IRoutineService,
    IAgentViewService,
} from './rivals14';
export type {
    IOrgChartService,
    IBizTicketService,
    IMeetingService,
    IHITLLevelsService,
    IPlaybookService,
    IComposeService,
    IDataSourceService,
    IBulkService,
    IScraperService,
    IRelayService,
    ISeoPackService,
    IOutreachPackService,
    IFinancePackService,
    ISiteAuditService,
    ICalendarService,
} from './rivals13';
