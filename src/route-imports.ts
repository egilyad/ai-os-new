import React, { Suspense } from 'react';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { PanelSkeleton } from './components/Common/Skeleton';
import { TECHNIQUE_PANEL_COMPONENTS } from './components/TechniquePanels/technique-panels-bundle';

// ── Lazy panels ───────────────────────────────────────────────────────────────
const MissionControl = React.lazy(() => import('./components/LiveCognition/MissionControl'));
const LiveWorkspace = React.lazy(() => import('./components/LiveCognition/LiveWorkspace'));
const ChatPanel = React.lazy(() => import('./components/ChatPanel/ChatPanel'));
const CognitiveBuilder = React.lazy(() => import('./components/BuilderPanel/CognitiveBuilder'));
const TracesPanel = React.lazy(() => import('./components/TracesPanel/TracesPanel'));
const LogsPanel = React.lazy(() => import('./components/LogsPanel/LogsPanel'));
const MemoryPanel = React.lazy(() => import('./components/MemoryPanel/MemoryPanel'));
const HealthPanel = React.lazy(() => import('./components/HealthPanel/HealthPanel'));
const SystemHealthPanel = React.lazy(() => import('./components/SystemHealthPanel'));
const AquariumPanel = React.lazy(() => import('./components/AquariumPanel/AquariumPanel'));
const DebateArena = React.lazy(() => import('./components/DebateArena'));
const ArgumentGraphPanel = React.lazy(
    () => import('./components/ArgumentGraphPanel/ArgumentGraphPanel'),
);
const DebateReplayPanel = React.lazy(() => import('./components/DebateReplayPanel'));
const TournamentPanel = React.lazy(() => import('./components/TournamentPanel'));
const SREAgentPanel = React.lazy(() => import('./components/SREAgentPanel/SREAgentPanel'));
const WhatIfPanel = React.lazy(() => import('./components/WhatIfPanel/WhatIfPanel'));
const DocsHealthPanel = React.lazy(() => import('./components/DocsHealthPanel'));
const WebhooksPanel = React.lazy(() => import('./components/WebhooksPanel'));
const RotationsPanel = React.lazy(() => import('./components/RotationsPanel'));
const BudgetPanel = React.lazy(() => import('./components/BudgetPanel'));
const CostAnalyticsPanel = React.lazy(() => import('./components/CostAnalyticsPanel'));
const ProviderMarketplace = React.lazy(() => import('./components/ProviderMarketplace'));
const AgentMarketplacePanel = React.lazy(() => import('./components/AgentMarketplacePanel'));
const PressureMapPanelLazy = React.lazy(
    () => import('./components/PressureMapPanel/PressureMapPanel'),
);
const DiagnosticPanel = React.lazy(() => import('./components/DiagnosticPanel'));
const ShadowPanel = React.lazy(() => import('./components/ShadowPanel/ShadowPanel'));
const CausalDebugger = React.lazy(() => import('./components/CausalDebugger/CausalDebugger'));
const CounterfactualPanel = React.lazy(
    () => import('./components/CounterfactualPanel/CounterfactualPanel'),
);
const SessionBindingsPanel = React.lazy(() => import('./components/SessionBindingsPanel'));
const CachePanel = React.lazy(() => import('./components/CachePanel'));
const BookmarksPanel = React.lazy(() => import('./components/BookmarksPanel/BookmarksPanel'));
const DebateAnalysisPanel = React.lazy(() => import('./components/DebateAnalysisPanel'));
const TopicSuggesterPanel = React.lazy(() => import('./components/TopicSuggesterPanel'));
const DebatesManagerPanel = React.lazy(() => import('./components/DebatesManagerPanel'));
const ChatSessionsManagerPanel = React.lazy(() => import('./components/ChatSessionsManagerPanel'));
const SessionHubPanel = React.lazy(() => import('./components/SessionHubPanel'));
const KeyNotesPanel = React.lazy(() => import('./components/KeyNotesPanel'));
const AgentJournalPanel = React.lazy(() => import('./components/AgentJournalPanel'));
const DecisionLogPanel = React.lazy(() => import('./components/DecisionLogPanel'));
const StateInspectorPanel = React.lazy(
    () => import('./components/StateInspectorPanel/StateInspectorPanel'),
);
const PerformanceProfilerPanel = React.lazy(() => import('./components/PerformanceProfilerPanel'));
const ProviderDashboard = React.lazy(() => import('./components/ProviderDashboard'));
const GroqSpeedDashboard = React.lazy(
    () => import('./components/ProviderManager/GroqSpeedDashboard'),
);
const OpenRouterPanelLazy = React.lazy(() => import('./components/OpenRouterPanel'));
const DebateSystemResearch = React.lazy(
    () => import('./components/DebateResearch/DebateSystemResearch'),
);
const ProjectOsExplorer = React.lazy(() => import('./components/DebateResearch/ProjectOsExplorer'));
const HypothesisGenerator = React.lazy(
    () => import('./components/DebateResearch/HypothesisGenerator'),
);
const ArchitectureReview = React.lazy(
    () => import('./components/DebateResearch/ArchitectureReview'),
);
const PromptAudit = React.lazy(() => import('./components/DebateResearch/PromptAudit'));
const RoutingExperiments = React.lazy(
    () => import('./components/DebateResearch/RoutingExperiments'),
);
const GovStressTest = React.lazy(() => import('./components/DebateResearch/GovStressTest'));
const ObsGaps = React.lazy(() => import('./components/DebateResearch/ObsGaps'));
const RoutingIntelligence = React.lazy(
    () => import('./components/RoutingIntelligence/RoutingIntelligence'),
);
const RouterTraceView = React.lazy(() => import('./components/RouterTraceView/RouterTraceView'));
const DependencyMapPanel = React.lazy(() => import('./components/DependencyMapPanel'));
const ServiceRegistryPanel = React.lazy(
    () => import('./components/ServiceRegistryPanel/ServiceRegistryPanel'),
);
const GuardiansPanel = React.lazy(() => import('./components/GuardiansPanel'));
const ModelComparePanel = React.lazy(() => import('./components/ModelComparePanel'));
const PromptLibraryPanel = React.lazy(() => import('./components/PromptLibraryPanel'));
const BatchProcessingPanel = React.lazy(() => import('./components/BatchProcessingPanel'));
const WorkflowPanel = React.lazy(() => import('./components/WorkflowPanel'));
const PromptSecurityPanel = React.lazy(() => import('./components/PromptSecurityPanel'));
const MemoryPalacePanel = React.lazy(() => import('./components/MemoryPanel/MemoryPalacePanel'));
const EvalDatasetPanel = React.lazy(() => import('./components/EvalDatasetPanel'));
const CustomMetricsPanel = React.lazy(() => import('./components/CustomMetricsPanel'));
const CostOptimizationPanel = React.lazy(() => import('./components/CostOptimizationPanel'));
const ABTestPanel = React.lazy(() => import('./components/ABTestPanel'));
const PricingPanel = React.lazy(() => import('./components/AnalyticsPanel/PricingPanel'));
const PressureMap = React.lazy(() => import('./components/PressureMap'));
const GroupsPanel = React.lazy(() => import('./components/GroupsPanel/GroupsPanel'));
const WorkspacePanel = React.lazy(() => import('./components/WorkspacePanel/WorkspacePanel'));
const DebateWorkspacePanel = React.lazy(
    () => import('./components/DebatePanel/DebateWorkspacePanel'),
);
const DebateStrategyBuilderPanel = React.lazy(
    () => import('./components/DebatePanel/DebateStrategyBuilder'),
);
const DebateHistoryPage = React.lazy(() => import('./components/DebatePanel/DebateHistoryPage'));
const DebateLivePanel = React.lazy(() => import('./components/DebateLive/DebateLivePanel'));
const PolicyEditorPanelLazy = React.lazy(() => import('./components/PolicyEditorPanel'));
const RolesConsortiaPanel = React.lazy(() => import('./components/RolesPanel/RolesConsortiaPanel'));
const ResearchEnginePanelLazy = React.lazy(
    () => import('./components/ResearchPanel/ResearchEnginePanel'),
);
const ResearchEngineAdvancedPanelLazy = React.lazy(
    () => import('./components/ResearchPanel/ResearchEngineAdvancedPanel'),
);
const EcosystemDashboardLazy = React.lazy(
    () => import('./components/AquariumPanel/EcosystemDashboard'),
);
const GoogleStudioPanelLazy = React.lazy(
    () => import('./components/GoogleStudio/GoogleStudioPanel'),
);
const GeminiLivePanelLazy = React.lazy(() => import('./components/GeminiLivePanel'));
const GoogleCachePanelLazy = React.lazy(() => import('./components/GoogleCachePanel'));
const MetaLearningPanelLazy = React.lazy(() => import('./components/MetaLearningPanel'));
const GeminiResearchLazy = React.lazy(
    () => import('./components/GeminiResearch/GeminiResearchPanel'),
);
const QuantumInspirationPanelLazy = React.lazy(
    () => import('./components/QuantumInspirationPanel'),
);
const AudiencePanelLazy = React.lazy(() => import('./components/AudiencePanel'));
const EditorsPanelLazy = React.lazy(() => import('./components/Editors/EditorsPanel'));
const TutorialPanelLazy = React.lazy(() => import('./components/TutorialPanel'));
const CommunityHubPanelLazy = React.lazy(() => import('./components/CommunityHubPanel'));
const ExportImportPanelLazy = React.lazy(() => import('./components/ExportImportPanel'));
const CollaborationPanelLazy = React.lazy(() => import('./components/CollaborationPanel'));
const FineTuningPanelLazy = React.lazy(() => import('./components/FineTuningPanel'));
const AgentComparisonPanelLazy = React.lazy(() => import('./components/AgentComparisonPanel'));
const DebateTemplatesPanelLazy = React.lazy(() => import('./components/DebateTemplatesPanel'));
const SmartRoutingPanelLazy = React.lazy(() => import('./components/SmartRoutingPanel'));
const NvidiaEnterprisePanelLazy = React.lazy(
    () => import('./components/NvidiaEnterprise/NvidiaEnterprisePanel'),
);
const HealthSlaPanelLazy = React.lazy(() => import('./components/HealthSlaPanel'));
const SocialLeaderboardPanelLazy = React.lazy(() => import('./components/SocialLeaderboardPanel'));
const ResearchReportPanelLazy = React.lazy(() => import('./components/ResearchReportPanel'));
const VoiceInputPanelLazy = React.lazy(() => import('./components/VoiceInputPanel'));
const AgentProtocolPanelLazy = React.lazy(() => import('./components/AgentProtocolPanel'));
const DistillationPanelLazy = React.lazy(() => import('./components/DistillationPanel'));
const DeployPanelLazy = React.lazy(() => import('./components/DeployPanel'));
const BudgetAlertsPanelLazy = React.lazy(() => import('./components/BudgetAlertsPanel'));
const TopologyGalleryPanelLazy = React.lazy(() => import('./components/TopologyGalleryPanel'));
const KeyUsageAnalyticsPanelLazy = React.lazy(() => import('./components/KeyUsageAnalyticsPanel'));
const PromptVersionPanelLazy = React.lazy(() => import('./components/PromptVersionPanel'));
const DebateQualityPanelLazy = React.lazy(() => import('./components/DebateQualityPanel'));
const QualityImpactDashboardLazy = React.lazy(
    () => import('./components/QualityImpactDashboard/QualityImpactDashboardPanel'),
);
const LensesPanelLazy = React.lazy(() => import('./components/LensesPanel/LensesPanel'));
const CrystalVaultPanelLazy = React.lazy(
    () => import('./components/CrystalVaultPanel/CrystalVaultPanel'),
);
const JunctionPanelLazy = React.lazy(() => import('./components/JunctionPanel/JunctionPanel'));
const SynthesisPanelLazy = React.lazy(() => import('./components/SynthesisPanel/SynthesisPanel'));
const KnowledgeGenPanelLazy = React.lazy(
    () => import('./components/KnowledgeGenPanel/KnowledgeGenPanel'),
);
const ForumPanelLazy = React.lazy(() => import('./components/ForumPanel/ForumPanel'));
const DirectorPanelLazy = React.lazy(() => import('./components/DirectorPanel/DirectorPanel'));
const RoomPanelLazy = React.lazy(() => import('./components/RoomPanel/RoomPanel'));

// ── Section 11 P2+P3 Lazy Imports ─────────────────────────────────────────────
const FederatedMemoryPanelLazy = React.lazy(() => import('./components/FederatedMemoryPanel'));
const PluginSdkPanelLazy = React.lazy(() => import('./components/PluginSdkPanel'));
const PersonaMarketplacePanelLazy = React.lazy(
    () => import('./components/PersonaMarketplacePanel'),
);
const PersonaPickerPanelLazy = React.lazy(() => import('./components/PersonaPickerPanel'));
const TemplateSharingPanelLazy = React.lazy(() => import('./components/TemplateSharingPanel'));
const MemoryTransferPanelLazy = React.lazy(() => import('./components/MemoryTransferPanel'));
const AquariumTradingPanelLazy = React.lazy(() => import('./components/AquariumTradingPanel'));
const TimeMachinePanelLazy = React.lazy(() => import('./components/TimeMachinePanel'));
const ContributionGraphPanelLazy = React.lazy(() => import('./components/ContributionGraphPanel'));

// ── Lazy panels (converted from eager imports to reduce initial bundle) ─────────
const ProviderManagerLazy = React.lazy(
    () => import('./components/ProviderManager/ProviderManager'),
);
const AgentsPanelLazy = React.lazy(() => import('./components/AgentsPanel/AgentsPanel'));
const ToolsPanelLazy = React.lazy(() => import('./components/ToolsPanel/ToolsPanel'));
const ConnectorsPanelLazy = React.lazy(
    () => import('./components/ConnectorsPanel/ConnectorsPanel'),
);
const KnowledgePanelLazy = React.lazy(() => import('./components/KnowledgePanel/KnowledgePanel'));
const SettingsPanelLazy = React.lazy(() => import('./components/SettingsPanel/SettingsPanel'));
const DocumentationPanelLazy = React.lazy(
    () => import('./components/DocumentationPanel/DocumentationPanel'),
);
const AnalyticsPanelLazy = React.lazy(() => import('./components/AnalyticsPanel/AnalyticsPanel'));
const SkillsPanelLazy = React.lazy(() => import('./components/SkillsPanel/SkillsPanel'));
const TasksPanelLazy = React.lazy(() => import('./components/TasksPanel/TasksPanel'));
const RolesPanelLazy = React.lazy(() => import('./components/RolesPanel/RolesPanel'));
const AuditLogViewLazy = React.lazy(() => import('./components/AuditLogView'));
const ConfigHistoryViewLazy = React.lazy(() => import('./components/ConfigHistoryView'));
const PoolStatusPanelLazy = React.lazy(
    () => import('./components/PoolStatusPanel/PoolStatusPanel'),
);
const PolicyPanelLazy = React.lazy(() => import('./components/PolicyPanel/PolicyPanel'));
const MCPPanelLazy = React.lazy(() => import('./components/MCPPanel/MCPPanel'));
const PatternsPanelLazy = React.lazy(() => import('./components/PatternsPanel/PatternsPanel'));

const SchedulerPanelLazy = React.lazy(() => import('./components/SchedulerPanel'));
const ExperimentalPanelLazy = React.lazy(() => import('./components/ExperimentalPanel'));
const ComingSoonPanel = React.lazy(() => import('./components/ComingSoonPanel'));
const SteelmanPanelLazy = React.lazy(() => import('./components/SteelmanPanel/SteelmanPanel'));
const BayesianJudgePanelLazy = React.lazy(() => import('./components/BayesianJudgePanel/BayesianJudgePanel'));
const BlindEvalPanelLazy = React.lazy(() => import('./components/BlindEvalPanel/BlindEvalPanel'));
const CredibilityPanelLazy = React.lazy(() => import('./components/CredibilityPanel/CredibilityPanel'));
const CalibrationPanelLazy = React.lazy(() => import('./components/CalibrationPanel/CalibrationPanel'));
const ConsistencyPanelLazy = React.lazy(() => import('./components/ConsistencyPanel/ConsistencyPanel'));
const FrameTrackerPanelLazy = React.lazy(() => import('./components/FrameTrackerPanel/FrameTrackerPanel'));
const StanceDriftPanelLazy = React.lazy(() => import('./components/StanceDriftPanel/StanceDriftPanel'));
const InsightBusPanelLazy = React.lazy(() => import('./components/InsightBusPanel/InsightBusPanel'));
const EntanglementPanelLazy = React.lazy(() => import('./components/EntanglementPanel/EntanglementPanel'));
const AnchoringPanelLazy = React.lazy(() => import('./components/AnchoringPanel/AnchoringPanel'));
const BeliefMiningPanelLazy = React.lazy(() => import('./components/BeliefMiningPanel/BeliefMiningPanel'));
const GoTDeliberationPanelLazy = React.lazy(() => import('./components/GoTDeliberationPanel/GoTDeliberationPanel'));
const BoPTrackerPanelLazy = React.lazy(() => import('./components/BoPTrackerPanel/BoPTrackerPanel'));
const PersonaMixerPanelLazy = React.lazy(() => import('./components/PersonaMixerPanel/PersonaMixerPanel'));
const ScratchpadPanelLazy = React.lazy(() => import('./components/ScratchpadPanel/ScratchpadPanel'));
const IncentiveDetectorPanelLazy = React.lazy(() => import('./components/IncentiveDetectorPanel/IncentiveDetectorPanel'));
const ConceptBlenderPanelLazy = React.lazy(() => import('./components/ConceptBlenderPanel/ConceptBlenderPanel'));
const SimilarityPanelLazy = React.lazy(() => import('./components/SimilarityPanel/SimilarityPanel'));
const MinimaxPlannerPanelLazy = React.lazy(() => import('./components/MinimaxPlannerPanel/MinimaxPlannerPanel'));
const OutcomeForecasterPanelLazy = React.lazy(() => import('./components/OutcomeForecasterPanel/OutcomeForecasterPanel'));
const MetaAgentPanelLazy = React.lazy(() => import('./components/MetaAgentPanel/MetaAgentPanel'));
const BiasProfilerPanelLazy = React.lazy(() => import('./components/BiasProfilerPanel/BiasProfilerPanel'));
const StakeholderPanelLazy = React.lazy(() => import('./components/StakeholderPanel/StakeholderPanel'));
const RhetoricPanelLazy = React.lazy(() => import('./components/RhetoricPanel/RhetoricPanel'));
const ExpertWitnessPanelLazy = React.lazy(() => import('./components/ExpertWitnessPanel/ExpertWitnessPanel'));
const DriftDetectorPanelLazy = React.lazy(() => import('./components/DriftDetectorPanel/DriftDetectorPanel'));
const ShadowOpponentPanelLazy = React.lazy(() => import('./components/ShadowOpponentPanel/ShadowOpponentPanel'));
const AdversarialSourcePanelLazy = React.lazy(() => import('./components/AdversarialSourcePanel/AdversarialSourcePanel'));
const VulnTargetingPanelLazy = React.lazy(() => import('./components/VulnTargetingPanel/VulnTargetingPanel'));
const JustificationPanelLazy = React.lazy(() => import('./components/JustificationPanel/JustificationPanel'));
const LogicalFormPanelLazy = React.lazy(() => import('./components/LogicalFormPanel/LogicalFormPanel'));

// Component map: nav id → React component (dashboard handled manually for onNavigate)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PANEL_COMPONENTS: Record<string, React.ComponentType<any>> = {
    ...TECHNIQUE_PANEL_COMPONENTS,
    analytics: AnalyticsPanelLazy,
    pricing: PricingPanel,
    budget: BudgetPanel,
    'cost-analytics': CostAnalyticsPanel,
    routing: RoutingIntelligence,
    chat: ChatPanel,
    'chat-sessions': ChatSessionsManagerPanel,
    'session-hub': SessionHubPanel,
    bookmarks: BookmarksPanel,
    tasks: TasksPanelLazy,
    files: WorkspacePanel,
    debate: DebateArena,
    builder: CognitiveBuilder,
    'debate-live': DebateLivePanel,
    'debate-workspace': DebateWorkspacePanel,
    'debate-replay': DebateReplayPanel,
    'debate-tournament': TournamentPanel,
    audience: AudiencePanelLazy,
    editors: EditorsPanelLazy,
    'argument-graph': ArgumentGraphPanel,
    'strategy-builder': DebateStrategyBuilderPanel,
    'debate-analysis': DebateAnalysisPanel,
    'debate-history': DebateHistoryPage,
    'debates-manager': DebatesManagerPanel,
    topics: TopicSuggesterPanel,
    agents: AgentsPanelLazy,
    roles: RolesPanelLazy,
    'roles-consortia': RolesConsortiaPanel,
    sre: SREAgentPanel,
    'agent-journal': AgentJournalPanel,
    mission: MissionControl,
    live: LiveWorkspace,
    'agent-marketplace': AgentMarketplacePanel,
    keys: ProviderManagerLazy,
    pools: PoolStatusPanelLazy,
    groups: GroupsPanel,
    'key-notes': KeyNotesPanel,
    'provider-dashboard': ProviderDashboard,
    'groq-speed': GroqSpeedDashboard,
    openrouter: OpenRouterPanelLazy,
    'smart-routing': SmartRoutingPanelLazy,
    'nvidia-enterprise': NvidiaEnterprisePanelLazy,
    'provider-marketplace': ProviderMarketplace,
    connectors: ConnectorsPanelLazy,
    mcp: MCPPanelLazy,
    'session-bindings': SessionBindingsPanel,
    guardians: GuardiansPanel,
    playground: ModelComparePanel,
    prompts: PromptLibraryPanel,
    batch: BatchProcessingPanel,
    workflows: WorkflowPanel,
    security: PromptSecurityPanel,
    'cost-optimization': CostOptimizationPanel,
    'ab-testing': ABTestPanel,
    'custom-metrics': CustomMetricsPanel,
    logs: LogsPanel,
    debugger: TracesPanel,
    'router-trace': RouterTraceView,
    memory: MemoryPanel,
    'memory-palace': MemoryPalacePanel,
    health: HealthPanel,
    'system-health': SystemHealthPanel,
    'docs-health': DocsHealthPanel,
    pressure: PressureMap,
    'runtime-pressure': PressureMapPanelLazy,
    'what-if': WhatIfPanel,
    'dependency-map': DependencyMapPanel,
    diagnostics: DiagnosticPanel,
    'state-inspector': StateInspectorPanel,
    'performance-profiler': PerformanceProfilerPanel,
    shadow: ShadowPanel,
    'causal-debugger': CausalDebugger,
    counterfactual: CounterfactualPanel,
    aquarium: AquariumPanel,
    patterns: PatternsPanelLazy,
    knowledge: KnowledgePanelLazy,
    docs: DocumentationPanelLazy,
    'decision-log': DecisionLogPanel,
    'project-os': ProjectOsExplorer,
    'hypothesis-gen': HypothesisGenerator,
    'research-advanced': ResearchEngineAdvancedPanelLazy,
    'research-gemini': GeminiResearchLazy,
    'eval-datasets': EvalDatasetPanel,
    'arch-review': ArchitectureReview,
    'prompt-audit': PromptAudit,
    'routing-experiments': RoutingExperiments,
    'gov-stress-test': GovStressTest,
    'obs-gaps': ObsGaps,
    'debate-system-research': DebateSystemResearch,
    'research-engine': ResearchEnginePanelLazy,
    ecosystem: EcosystemDashboardLazy,
    skills: SkillsPanelLazy,
    tools: ToolsPanelLazy,
    cache: CachePanel,
    webhooks: WebhooksPanel,
    rotations: RotationsPanel,
    'service-registry': ServiceRegistryPanel,
    'google-studio': GoogleStudioPanelLazy,
    'google-cache': GoogleCachePanelLazy,
    'gemini-live': GeminiLivePanelLazy,
    'meta-learning': MetaLearningPanelLazy,
    'quantum-inspiration': QuantumInspirationPanelLazy,
    tutorials: TutorialPanelLazy,
    'team-collaboration': CollaborationPanelLazy,
    'fine-tuning': FineTuningPanelLazy,
    'model-distillation': DistillationPanelLazy,
    deploy: DeployPanelLazy,
    'budget-alerts': BudgetAlertsPanelLazy,
    'topology-templates': TopologyGalleryPanelLazy,
    'key-usage-analytics': KeyUsageAnalyticsPanelLazy,
    'prompt-versions': PromptVersionPanelLazy,
    'community-hub': CommunityHubPanelLazy,
    'export-import': ExportImportPanelLazy,
    'agent-comparison': AgentComparisonPanelLazy,
    'debate-templates': DebateTemplatesPanelLazy,
    'health-sla': HealthSlaPanelLazy,
    leaderboard: SocialLeaderboardPanelLazy,
    'research-reports': ResearchReportPanelLazy,
    'voice-input': VoiceInputPanelLazy,
    'agent-protocol': AgentProtocolPanelLazy,
    settings: SettingsPanelLazy,
    policies: PolicyPanelLazy,
    'policy-editor': PolicyEditorPanelLazy,
    audit: AuditLogViewLazy,
    history: ConfigHistoryViewLazy,
    'debate-quality': DebateQualityPanelLazy,
    'quality-impact': QualityImpactDashboardLazy,
    lenses: LensesPanelLazy,
    crystals: CrystalVaultPanelLazy,
    junctions: JunctionPanelLazy,
    synthesis: SynthesisPanelLazy,
    'knowledge-generator': KnowledgeGenPanelLazy,
    forum: ForumPanelLazy,
    director: DirectorPanelLazy,
    room: RoomPanelLazy,
    'federated-memory': FederatedMemoryPanelLazy,
    'plugin-sdk': PluginSdkPanelLazy,
    'persona-marketplace': PersonaMarketplacePanelLazy,
    'persona-picker': PersonaPickerPanelLazy,
    'template-sharing': TemplateSharingPanelLazy,
    'memory-export-import': MemoryTransferPanelLazy,
    'aquarium-trading': AquariumTradingPanelLazy,
    'time-machine': TimeMachinePanelLazy,
    'contribution-graph': ContributionGraphPanelLazy,
    // Collapsed ~33 orphaned ComingSoonPanel debate sub-service stubs (Q8) into
    // a single discoverable Experimental hub.
    experimental: ExperimentalPanelLazy,
    steelman: SteelmanPanelLazy,
    'bayesian-judge': BayesianJudgePanelLazy,
    'blind-eval': BlindEvalPanelLazy,
    credibility: CredibilityPanelLazy,
    calibration: CalibrationPanelLazy,
    consistency: ConsistencyPanelLazy,
    'frame-tracker': FrameTrackerPanelLazy,
    'stance-drift': StanceDriftPanelLazy,
    'insight-bus': InsightBusPanelLazy,
    entanglement: EntanglementPanelLazy,
    anchoring: AnchoringPanelLazy,
    'meta-agent': MetaAgentPanelLazy,
    'outcome-forecaster': OutcomeForecasterPanelLazy,
    'concept-blender': ConceptBlenderPanelLazy,
    'belief-mining': BeliefMiningPanelLazy,
    'minimax-planner': MinimaxPlannerPanelLazy,
    'expert-witness': ExpertWitnessPanelLazy,
    rhetoric: RhetoricPanelLazy,
    'bias-profiler': BiasProfilerPanelLazy,
    'incentive-detector': IncentiveDetectorPanelLazy,
    stakeholder: StakeholderPanelLazy,
    scratchpad: ScratchpadPanelLazy,
    'persona-mixer': PersonaMixerPanelLazy,
    'bop-tracker': BoPTrackerPanelLazy,
    'got-deliberation': GoTDeliberationPanelLazy,
    similarity: SimilarityPanelLazy,
    'drift-detector': DriftDetectorPanelLazy,
    'shadow-opponent': ShadowOpponentPanelLazy,
    'adversarial-source': AdversarialSourcePanelLazy,
    'vuln-targeting': VulnTargetingPanelLazy,
    'justification': JustificationPanelLazy,
    'logical-form': LogicalFormPanelLazy,
    scheduler: SchedulerPanelLazy,
};

export const PanelLoader: React.FC<{ name: string; children: React.ReactNode }> = (props) => {
    const inner = React.createElement(
        Suspense,
        { fallback: React.createElement(PanelSkeleton, null) },
        props.children,
    );
    return React.createElement(ErrorBoundary, {
        name: props.name,
        variant: 'panel' as const,
        children: inner,
    });
};
