import { lazyService } from '../service-helper';
import type { IForumService } from '../contracts/forum';
import type { ILensEngineService } from '../contracts/lens-engine';
import type { ICrystalVaultService } from '../contracts/knowledge-crystal';
import type { IJunctionEngineService } from '../contracts/junction-engine';
import type { ISynthesisEngineService } from '../contracts/synthesis-engine';
import type { IKnowledgeGeneratorService } from '../contracts/knowledge-generator';
import type { IArchitectureReviewService } from '../contracts/architecture-review';
import type { IPromptAuditService } from '../contracts/prompt-audit';
import type { IRoutingExperimentsService } from '../contracts/routing-experiments';
import type { IGovStressTestService } from '../contracts/gov-stress-test';
import type { IObsGapsService } from '../contracts/obs-gaps';
import type { IConsistencyChecker } from '../contracts/consistency-checker';
import type { IConsistencyHealingPipeline } from '../contracts/consistency-healing';
import type { IRotationService } from '../contracts/key-rotation';
import type { IBudgetService } from '../contracts/budget';
import type { TaskHandoffService } from '../services/task-handoff';
import type { TemplateService } from '../services/template-service';
import type { AgentVersionService } from '../services/agent-version-service';
import type { MetricsService } from '../services/metrics-service';
import type { WorkforceFederation } from '../services/workforce-federation';
import type { AgentMarketplace } from '../services/agent-marketplace';
import type { TopologyManager } from '../services/topology-manager';
import type { CollaborativeService } from '../services/collaborative-service';
import type { DebateApiService } from '../services/debate-runtime/debate-api';
import type { DebateKnowledgeSyncService } from '../services/debate-runtime/debate-knowledge-sync';
import type { IHypothesisService } from '../contracts/hypothesis';
import type { ResearchRunService as ResearchRunServiceType } from '../services/research-run-service';
import type { ChatSummarizerService as ChatSummarizerServiceType } from '../services/chat-summarizer-service';
import type { IBridgeKeeperService } from '../contracts/guardian';
import type { ReconnectionService } from '../services/reconnection-service';
import type { IResearchEngine } from '../contracts/research-engine';
import type { IGeminiResearchService } from '../contracts/gemini-research';
import type { IAudienceService } from '../contracts/audience';
import type { ITutorialService } from '../contracts/tutorial';
import type { ITeamCollaborationService } from '../contracts/team-collaboration';
import type { IFineTuningService } from '../contracts/fine-tuning';
import type { IDistillationService } from '../contracts/model-distillation';
import type { IDeployService } from '../contracts/deploy';
import type { IBudgetAlertService } from '../contracts/budget-alert';
import type { ITopologyTemplateService } from '../contracts/topology-templates';
import type { IKeyUsageAnalyticsService } from '../contracts/key-usage-analytics';
import type { IPromptVersionService } from '../contracts/prompt-version-history';
import type { IProviderMigrationService } from '../contracts/provider-migration';
import type { IHealthSlaService } from '../contracts/health-sla';
import type { IResearchReportService } from '../contracts/research-report';
import type { IVoiceInputService } from '../contracts/voice-input';
import type { IAgentProtocolService } from '../contracts/agent-protocol';
import type { IFederatedMemoryService } from '../contracts/federated-memory';
import type { IPluginSdkService } from '../contracts/plugin-sdk';
import type { IPersonaMarketplaceService } from '../contracts/persona-marketplace';
import type { ITemplateSharingService } from '../contracts/template-sharing';
import type { IMemoryTransferService } from '../contracts/memory-transfer';
import type { IAquariumTradingService } from '../contracts/aquarium-trading';
import type { ITimeMachineService } from '../contracts/time-machine';
import type { IContributionService } from '../contracts/contribution';
import type { IGeminiLiveService } from '../contracts/gemini-live';
import type { IMetaLearningService } from '../contracts/meta-learning';
import type { IQuantumInspirationService } from '../contracts/quantum-inspiration';
import type { ISmartRoutingService } from '../contracts/smart-routing';
import type { INvidiaEnterpriseService } from '../contracts/nvidia-enterprise';
import type { IGeminiCacheService } from '../contracts/gemini-cache';
import type { IProviderAchievementService } from '../contracts/provider-achievements';
import type { GoogleGenAIService as GoogleGenAIServiceType } from '../services/google-genai-service';
import type { WorkflowService as WorkflowServiceType } from '../services/workflow-service';
import type { ConversationDirectorService as ConversationDirectorServiceType } from '../services/conversation-director-service';
import type { SourceAdapterRegistry as SourceAdapterRegistryType } from '../services/research-adapters/source-adapter-registry';
import type { PromptLibraryService as PromptLibraryServiceType } from '../services/prompt-library-service';
import type { BatchProcessorService as BatchProcessorServiceType } from '../services/batch-processor-service';
import type { AgentAvatarService } from '../services/agent-avatar-service';
import type { ConnectorService } from '../services/connector-service';
import type { IQualityImpactCollector, IExperimentEngine } from '../contracts/quality-impact';
import type { ScenarioRepository } from '../dal/scenario-repository';
import type { DirectorRepository } from '../dal/director-repository';
import type { InvocationRepository } from '../services/invocation/invocation-repository';
import type { InvocationCostTracker } from '../services/invocation/invocation-cost-tracker';
import type { IInvocationEngineService } from '../contracts/invocation';
export const scenarioRepository = lazyService<ScenarioRepository>('scenarioRepository');
export const directorRepository = lazyService<DirectorRepository>('directorRepository');
export const forumService = lazyService<IForumService>('forumService');
export const lensEngine = lazyService<ILensEngineService>('lensEngine');
export const crystalVault = lazyService<ICrystalVaultService>('crystalVault');
export const junctionEngine = lazyService<IJunctionEngineService>('junctionEngine');
export const synthesisEngine = lazyService<ISynthesisEngineService>('synthesisEngine');
export const knowledgeGenerator = lazyService<IKnowledgeGeneratorService>('knowledgeGenerator');
export const invocationEngine = lazyService<IInvocationEngineService>('invocationEngineService');
export const invocationRepository = lazyService<InvocationRepository>('invocationRepository');
export const invocationCostTracker = lazyService<InvocationCostTracker>('invocationCostTracker');

export const architectureReviewService = lazyService<IArchitectureReviewService>(
    'architectureReviewService',
);
export const promptAuditService = lazyService<IPromptAuditService>('promptAuditService');
export const routingExperimentsService = lazyService<IRoutingExperimentsService>(
    'routingExperimentsService',
);
export const govStressTestService = lazyService<IGovStressTestService>('govStressTestService');
export const obsGapsService = lazyService<IObsGapsService>('obsGapsService');

export const consistencyChecker = lazyService<IConsistencyChecker>('consistencyChecker');
export const consistencyHealingPipeline = lazyService<IConsistencyHealingPipeline>(
    'consistencyHealingPipeline',
);
export const rotationService = lazyService<IRotationService>('rotationService');
export const budgetService = lazyService<IBudgetService>('budgetService');
export const taskHandoffService = lazyService<TaskHandoffService>('taskHandoffService');
export const templateService = lazyService<TemplateService>('templateService');
export const agentVersionService = lazyService<AgentVersionService>('agentVersionService');
export const metricsService = lazyService<MetricsService>('metricsService');
export const workforceFederation = lazyService<WorkforceFederation>('workforceFederation');
export const agentMarketplace = lazyService<AgentMarketplace>('agentMarketplace');
export const topologyManager = lazyService<TopologyManager>('topologyManager');
export const collaborativeService = lazyService<CollaborativeService>('collaborativeService');
export const debateApiService = lazyService<DebateApiService>('debateApiService');
export const debateKnowledgeSync = lazyService<DebateKnowledgeSyncService>('debateKnowledgeSync');
export const hypothesisService = lazyService<IHypothesisService>('hypothesisService');

// ── Research Run Service (direct re-export + lazyService) ──
export { ResearchRunService, type ResearchRun } from '../services/research-run-service';
export const researchRunService = lazyService<ResearchRunServiceType>('researchRunService');

// ── Debate Templates (direct re-export) ──
export { DEBATE_TEMPLATES, getDebateTemplate } from '../services/debate-runtime/debate-templates';
export type { DebateTemplate } from '../services/debate-runtime/debate-templates';

// ── ELO Rating Service ──
export const eloService =
    lazyService<import('../services/elo/elo-service').EloRatingService>('eloService');
export type { AgentElo } from '../services/elo/elo-service';

export const chatSummarizerService =
    lazyService<ChatSummarizerServiceType>('chatSummarizerService');
export const bridgeKeeperService = lazyService<IBridgeKeeperService>('bridgeKeeperService');
export const reconnectionService = lazyService<ReconnectionService>('reconnectionService');
export const researchEngine = lazyService<IResearchEngine>('researchEngine');
export const geminiResearchService = lazyService<IGeminiResearchService>('geminiResearchService');
export const audienceService = lazyService<IAudienceService>('audienceService');
export const tutorialService = lazyService<ITutorialService>('tutorialService');
export const teamCollaborationService = lazyService<ITeamCollaborationService>(
    'teamCollaborationService',
);
export const fineTuningService = lazyService<IFineTuningService>('fineTuningService');
export const distillationService = lazyService<IDistillationService>('distillationService');
export const deployService = lazyService<IDeployService>('deployService');
export const budgetAlertService = lazyService<IBudgetAlertService>('budgetAlertService');
export const topologyTemplateService =
    lazyService<ITopologyTemplateService>('topologyTemplateService');
export const keyUsageAnalyticsService = lazyService<IKeyUsageAnalyticsService>(
    'keyUsageAnalyticsService',
);
export const promptVersionService = lazyService<IPromptVersionService>('promptVersionService');
export const providerMigrationService = lazyService<IProviderMigrationService>(
    'providerMigrationService',
);
export const healthSlaService = lazyService<IHealthSlaService>('healthSlaService');
export const researchReportService = lazyService<IResearchReportService>('researchReportService');
export const voiceInputService = lazyService<IVoiceInputService>('voiceInputService');
export const agentProtocolService = lazyService<IAgentProtocolService>('agentProtocolService');
export const federatedMemoryService =
    lazyService<IFederatedMemoryService>('federatedMemoryService');
export const pluginSdkService = lazyService<IPluginSdkService>('pluginSdkService');
export const personaMarketplaceService = lazyService<IPersonaMarketplaceService>(
    'personaMarketplaceService',
);
export const templateSharingService =
    lazyService<ITemplateSharingService>('templateSharingService');
export const memoryTransferService = lazyService<IMemoryTransferService>('memoryTransferService');
export const aquariumTradingService =
    lazyService<IAquariumTradingService>('aquariumTradingService');
export const timeMachineService = lazyService<ITimeMachineService>('timeMachineService');
export const contributionService = lazyService<IContributionService>('contributionService');
export const geminiLiveService = lazyService<IGeminiLiveService>('geminiLiveService');
export const metaLearningService = lazyService<IMetaLearningService>('metaLearningService');
export const quantumInspirationService = lazyService<IQuantumInspirationService>(
    'quantumInspirationService',
);
export const smartRoutingService = lazyService<ISmartRoutingService>('smartRoutingService');
export const nvidiaEnterpriseService =
    lazyService<INvidiaEnterpriseService>('nvidiaEnterpriseService');
export const geminiCacheService = lazyService<IGeminiCacheService>('geminiCacheService');
export const providerAchievementService = lazyService<IProviderAchievementService>(
    'providerAchievementService',
);
export { promptSecurityService } from './extra-references';
export const googleGenAIService = lazyService<GoogleGenAIServiceType>('googleGenAIService');
export const workflowService = lazyService<WorkflowServiceType>('workflowService');
export const sourceAdapterRegistry =
    lazyService<SourceAdapterRegistryType>('sourceAdapterRegistry');
export const conversationDirector = lazyService<ConversationDirectorServiceType>(
    'conversationDirectorService',
);
export const promptLibraryService = lazyService<PromptLibraryServiceType>('promptLibraryService');
export const batchProcessorService =
    lazyService<BatchProcessorServiceType>('batchProcessorService');
export const agentAvatarService = lazyService<AgentAvatarService>('agentAvatarService');
export const connectorService = lazyService<ConnectorService>('connectorService');
export const qualityImpactCollector =
    lazyService<IQualityImpactCollector>('qualityImpactCollector');
export const experimentEngine = lazyService<IExperimentEngine>('experimentEngine');

// ── Debate archetype helpers (data/config, not service instances) ───────────
export {
    DEBATE_ARCHETYPES,
    getArchetypePrompt,
    getArchetypeName,
    getArchetypesForRole,
    getRecommendedArchetypes,
    getPersonaArchetypes,
} from '../services/debate-runtime/debate-archetypes';

// ── Historical figure helpers ──────────────────────────────────────────────
export { getHistoricalFigure } from '../services/debate-runtime/debate-historical-figures';

// ── Debate quality settings (data/config, not service instances) ──────────
export {
    getAllSettings,
    setSetting,
    setAllSettings,
    resetAllSettings,
    getTechniques,
} from '../services/debate-runtime/quality-settings-store';
