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
import type { ICrewService, IAgentForgeService } from '../contracts/crew';
import type { ICouncilService } from '../contracts/council';
import type { IGraphService } from '../contracts/graph';
import type {
    ILtMemoryService,
    IPersonaService,
    ISharedContextService,
} from '../contracts/persona';
import type { PersonaRepository } from '../dal/persona-repository';
import type {
    IAuditService,
    IFleetMonitorService,
    IHierarchyService,
    IMobileAccessService,
    ISandboxBrokerService,
    ISkillMarketService,
    IToolGovernanceService,
} from '../contracts/ops';
import type { OpsRepository } from '../dal/ops-repository';
import type {
    IA2AService,
    ICoordinationService,
    IFederationService,
    IGatewayService,
} from '../contracts/interop';
import type { InteropRepository } from '../dal/interop-repository';
import type {
    ICogMemoryService,
    IMetaAgentService,
    IStrategyService,
} from '../contracts/meta';
import type { MetaRepository } from '../dal/meta-repository';
import type {
    IEcosystemService,
    IGovernanceService,
    IProvenanceService,
} from '../contracts/trust';
import type { TrustRepository } from '../dal/trust-repository';
import type {
    IEvalService,
    IFrontierOpsService,
    ISimulationService,
} from '../contracts/frontier';
import type { FrontierRepository } from '../dal/frontier-repository';
import type {
    IKnowledgeService,
    IToolRunnerService,
    ITrainingService,
} from '../contracts/parity';
import type { ParityRepository } from '../dal/parity-repository';
import type {
    IAutonomyService,
    IDyadService,
    IGroupChatService,
    IGuardrailService,
    IMemoryBlocksService,
    IPlannerService,
    IRunQueueService,
    ISopService,
} from '../contracts/rivals';
import type { RivalRepository } from '../dal/rival-repository';
import type {
    IBonsaiService,
    IChainlitService,
    IChartService,
    IGradioService,
    IGraphVizService,
    IGymService,
    IMalmoService,
    IMesaService,
    INetLogoService,
} from '../contracts/rivals11';
import type {
    IClaudeCodeService,
    IMcpDeepService,
    IFilesApiService,
    ICacheControlService,
    IProjectService,
    IDynamicWorkflowService,
    IRoutineService,
    IAgentViewService,
} from '../contracts/rivals14';
import type { ICapabilityResolver, IAgentFactory } from '../contracts/capability';
import type {
    IALifeService,
    IAlphaCodeService,
    IConstitutionalService,
    ICuriosityService,
    INeuroSymbolicService,
    IQuantumDeepService,
    ISmallvilleService,
    ISwarmService,
    IVoyagerService,
    IWorldModelService,
} from '../contracts/rivals12';
import type {
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
} from '../contracts/rivals19';
import type {
    ICodexService,
    IGeminiCliService,
    IKiloService,
    IInterpreterService,
    IMiniSweService,
    IHeliconeService,
    IPortkeyService,
    ILiteLlmService,
    ILangfuseService,
} from '../contracts/rivals20';
import type {
    IAnalitikService,
    IChemistService,
    IEvoLabService,
    IGigaStudioService,
    IHeisenbergService,
    ILocalTripleService,
    IMaestroService,
    IMetabolicService,
    IRuslanService,
    IAgencyRuService,
} from '../contracts/rivals15';
import type {
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
} from '../contracts/rivals16';
import type {
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
} from '../contracts/rivals18';
import type {
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
} from '../contracts/rivals17';
import type {
    IBizTicketService,
    IBulkService,
    ICalendarService,
    IComposeService,
    IDataSourceService,
    IFinancePackService,
    IHITLLevelsService,
    IMeetingService,
    IOrgChartService,
    IOutreachPackService,
    IPlaybookService,
    IRelayService,
    IScraperService,
    ISeoPackService,
    ISiteAuditService,
} from '../contracts/rivals13';
import type {
    IA2aSpecService,
    IAssistService,
    ICacheRegistryService,
    IDeepResearchService,
    IDotpromptService,
    ILiveBridgeService,
    INotebookService,
    IQuotaGuardService,
    IStudioPackService,
    IVertexSearchService,
} from '../contracts/rivals10';
import type {
    IDshService,
    IGensparkService,
    IManusService,
    IOpenClawService,
} from '../contracts/rivals9';
import type {
    IAtomService,
    IDecisionService,
    IErrorInboxService,
    IForumPlusService,
    IMeterService,
    IPolisService,
    IReflexionService,
    ISelfConsistencyService,
    ISoarService,
    ITotService,
} from '../contracts/rivals7';
import type { IArgTechService, IFormatService } from '../contracts/debateplus';
import type {
    IAssetService,
    IDeckService,
    IMakeService,
    IN8nService,
    ISensorService,
    ISupportService,
    ITemporalService,
    IVerifyService,
    IVoiceAgentService,
    IZapierService,
} from '../contracts/rivals6';
import type {
    IAclService,
    IAppBuilderService,
    ICodeExecService,
    IComputerService,
    IIdeService,
    IOntologyService,
    IPromptHubService,
    ISearchService,
    IWorkQueueService,
    IWriterService,
} from '../contracts/rivals5';
import type {
    IAgentforceService,
    IAssistantService,
    IBedrockService,
    ICampaignService,
    ICodeAgentService,
    ICopilotService,
    ICxfService,
    IEmployeeService,
    IEntityService,
    IGumService,
    IKoreService,
} from '../contracts/rivals4';
import type {
    IBotRouterService,
    ICodePlanService,
    IDatasetService,
    IDialogueService,
    IDocStoreService,
    IFlowApiService,
    IPrototypeService,
    IReasoningService,
    ISessionStateService,
    ITypedAgentService,
} from '../contracts/rivals3';
import type {
    IAiderService,
    ICharacterService,
    IIntegrationsService,
    ILoaderService,
    IModesService,
    IRagService,
    IReactService,
    IRuntimeService,
    IScopedMemService,
    ISweService,
} from '../contracts/rivals2';
import type { CrewRepository } from '../dal/crew-repository';
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
export const crewService = lazyService<ICrewService>('crewService');
export const crewRepository = lazyService<CrewRepository>('crewRepository');
export const agentForgeService = lazyService<IAgentForgeService>('agentForgeService');
export const councilService = lazyService<ICouncilService>('councilService');
export const graphService = lazyService<IGraphService>('graphService');
export const ltMemoryService = lazyService<ILtMemoryService>('ltMemoryService');
export const personaService = lazyService<IPersonaService>('personaService');
export const sharedContextService = lazyService<ISharedContextService>('sharedContextService');
export const personaRepository = lazyService<PersonaRepository>('personaRepository');
export const opsRepository = lazyService<OpsRepository>('opsRepository');
export const auditService = lazyService<IAuditService>('auditService');
export const hierarchyService = lazyService<IHierarchyService>('hierarchyService');
export const toolGovernanceService = lazyService<IToolGovernanceService>('toolGovernanceService');
export const sandboxBrokerService = lazyService<ISandboxBrokerService>('sandboxBrokerService');
export const skillMarketService = lazyService<ISkillMarketService>('skillMarketService');
export const fleetMonitorService = lazyService<IFleetMonitorService>('fleetMonitorService');
export const mobileAccessService = lazyService<IMobileAccessService>('mobileAccessService');
export const interopRepository = lazyService<InteropRepository>('interopRepository');
export const a2aService = lazyService<IA2AService>('a2aService');
export const gatewayService = lazyService<IGatewayService>('gatewayService');
export const federationService = lazyService<IFederationService>('federationService');
export const coordinationService = lazyService<ICoordinationService>('coordinationService');
export const metaRepository = lazyService<MetaRepository>('metaRepository');
export const metaAgentService = lazyService<IMetaAgentService>('metaAgentService');
export const strategyService = lazyService<IStrategyService>('strategyService');
export const cogMemoryService = lazyService<ICogMemoryService>('cogMemoryService');
export const trustRepository = lazyService<TrustRepository>('trustRepository');
export const governanceService = lazyService<IGovernanceService>('governanceService');
export const provenanceService = lazyService<IProvenanceService>('provenanceService');
export const ecosystemService = lazyService<IEcosystemService>('ecosystemService');
export const frontierRepository = lazyService<FrontierRepository>('frontierRepository');
export const evalService = lazyService<IEvalService>('evalService');
export const simulationService = lazyService<ISimulationService>('simulationService');
export const frontierOpsService = lazyService<IFrontierOpsService>('frontierOpsService');
export const parityRepository = lazyService<ParityRepository>('parityRepository');
export const toolRunnerService = lazyService<IToolRunnerService>('toolRunnerService');
export const knowledgeService = lazyService<IKnowledgeService>('knowledgeService');
export const trainingService = lazyService<ITrainingService>('trainingService');
export const rivalRepository = lazyService<RivalRepository>('rivalRepository');
export const groupChatService = lazyService<IGroupChatService>('groupChatService');
export const guardrailService = lazyService<IGuardrailService>('guardrailService');
export const memoryBlocksService = lazyService<IMemoryBlocksService>('memoryBlocksService');
export const sopService = lazyService<ISopService>('sopService');
export const autonomyService = lazyService<IAutonomyService>('autonomyService');
export const runQueueService = lazyService<IRunQueueService>('runQueueService');
export const plannerService = lazyService<IPlannerService>('plannerService');
export const dyadService = lazyService<IDyadService>('dyadService');
export const reactService = lazyService<IReactService>('reactService');
export const loaderService = lazyService<ILoaderService>('loaderService');
export const ragService = lazyService<IRagService>('ragService');
export const runtimeService = lazyService<IRuntimeService>('runtimeService');
export const sweService = lazyService<ISweService>('sweService');
export const aiderService = lazyService<IAiderService>('aiderService');
export const modesService = lazyService<IModesService>('modesService');
export const scopedMemService = lazyService<IScopedMemService>('scopedMemService');
export const integrationsService = lazyService<IIntegrationsService>('integrationsService');
export const characterService = lazyService<ICharacterService>('characterService');
export const reasoningService = lazyService<IReasoningService>('reasoningService');
export const sessionStateService = lazyService<ISessionStateService>('sessionStateService');
export const datasetService = lazyService<IDatasetService>('datasetService');
export const flowApiService = lazyService<IFlowApiService>('flowApiService');
export const docStoreService = lazyService<IDocStoreService>('docStoreService');
export const typedAgentService = lazyService<ITypedAgentService>('typedAgentService');
export const codePlanService = lazyService<ICodePlanService>('codePlanService');
export const dialogueService = lazyService<IDialogueService>('dialogueService');
export const botRouterService = lazyService<IBotRouterService>('botRouterService');
export const prototypeService = lazyService<IPrototypeService>('prototypeService');
export const copilotService = lazyService<ICopilotService>('copilotService');
export const bedrockService = lazyService<IBedrockService>('bedrockService');
export const cxfService = lazyService<ICxfService>('cxfService');
export const agentforceService = lazyService<IAgentforceService>('agentforceService');
export const entityService = lazyService<IEntityService>('entityService');
export const koreService = lazyService<IKoreService>('koreService');
export const campaignService = lazyService<ICampaignService>('campaignService');
export const employeeService = lazyService<IEmployeeService>('employeeService');
export const codeAgentService = lazyService<ICodeAgentService>('codeAgentService');
export const assistantService = lazyService<IAssistantService>('assistantService');
export const gumService = lazyService<IGumService>('gumService');
export const appBuilderService = lazyService<IAppBuilderService>('appBuilderService');
export const ideService = lazyService<IIdeService>('ideService');
export const promptHubService = lazyService<IPromptHubService>('promptHubService');
export const ontologyService = lazyService<IOntologyService>('ontologyService');
export const aclService = lazyService<IAclService>('aclService');
export const workQueueService = lazyService<IWorkQueueService>('workQueueService');
export const writerService = lazyService<IWriterService>('writerService');
export const computerService = lazyService<IComputerService>('computerService');
export const searchService = lazyService<ISearchService>('searchService');
export const codeExecService = lazyService<ICodeExecService>('codeExecService');
export const n8nService = lazyService<IN8nService>('n8nService');
export const makeService = lazyService<IMakeService>('makeService');
export const zapierService = lazyService<IZapierService>('zapierService');
export const temporalService = lazyService<ITemporalService>('temporalService');
export const assetService = lazyService<IAssetService>('assetService');
export const sensorService = lazyService<ISensorService>('sensorService');
export const voiceService = lazyService<IVoiceAgentService>('voiceService');
export const supportService = lazyService<ISupportService>('supportService');
export const verifyService = lazyService<IVerifyService>('verifyService');
export const deckService = lazyService<IDeckService>('deckService');
export const forumPlusService = lazyService<IForumPlusService>('forumPlusService');
export const decisionService = lazyService<IDecisionService>('decisionService');
export const polisService = lazyService<IPolisService>('polisService');
export const reflexionService = lazyService<IReflexionService>('reflexionService');
export const totService = lazyService<ITotService>('totService');
export const selfConService = lazyService<ISelfConsistencyService>('selfConService');
export const soarService = lazyService<ISoarService>('soarService');
export const atomService = lazyService<IAtomService>('atomService');
export const meterService = lazyService<IMeterService>('meterService');
export const errInboxService = lazyService<IErrorInboxService>('errInboxService');
export const openClawService = lazyService<IOpenClawService>('openClawService');
export const dshService = lazyService<IDshService>('dshService');
export const manusService = lazyService<IManusService>('manusService');
export const gensparkService = lazyService<IGensparkService>('gensparkService');
export const a2aSpecService = lazyService<IA2aSpecService>('a2aSpecService');
export const cacheRegistryService = lazyService<ICacheRegistryService>('cacheRegistryService');
export const dotpromptService = lazyService<IDotpromptService>('dotpromptService');
export const notebookService = lazyService<INotebookService>('notebookService');
export const liveBridgeService = lazyService<ILiveBridgeService>('liveBridgeService');
export const assistService = lazyService<IAssistService>('assistService');
export const vertexSearchService = lazyService<IVertexSearchService>('vertexSearchService');
export const deepResearchService = lazyService<IDeepResearchService>('deepResearchService');
export const quotaGuardService = lazyService<IQuotaGuardService>('quotaGuardService');
export const studioPackService = lazyService<IStudioPackService>('studioPackService');
export const netLogoService = lazyService<INetLogoService>('netLogoService');
export const mesaService = lazyService<IMesaService>('mesaService');
export const bonsaiService = lazyService<IBonsaiService>('bonsaiService');
export const chainlitService = lazyService<IChainlitService>('chainlitService');
export const gradioService = lazyService<IGradioService>('gradioService');
export const chartService = lazyService<IChartService>('chartService');
export const graphVizService = lazyService<IGraphVizService>('graphVizService');
export const malmoService = lazyService<IMalmoService>('malmoService');
export const gymService = lazyService<IGymService>('gymService');
export const constitutionalService = lazyService<IConstitutionalService>('constitutionalService');
export const voyagerService = lazyService<IVoyagerService>('voyagerService');
export const smallvilleService = lazyService<ISmallvilleService>('smallvilleService');
export const alphaCodeService = lazyService<IAlphaCodeService>('alphaCodeService');
export const worldModelService = lazyService<IWorldModelService>('worldModelService');
export const neuroSymbolicService = lazyService<INeuroSymbolicService>('neuroSymbolicService');
export const swarmService = lazyService<ISwarmService>('swarmService');
export const alifeService = lazyService<IALifeService>('alifeService');
export const curiosityService = lazyService<ICuriosityService>('curiosityService');
export const quantumDeepService = lazyService<IQuantumDeepService>('quantumDeepService');
export const capabilityResolver = lazyService<ICapabilityResolver>('capabilityResolver');
export const agentFactory = lazyService<IAgentFactory>('agentFactory');
export const piService = lazyService<IPiService>('piService');
export const zedService = lazyService<IZedService>('zedService');
export const warpService = lazyService<IWarpService>('warpService');
export const gptEngineerService = lazyService<IGptEngineerService>('gptEngineerService');
export const gooseService = lazyService<IGooseService>('gooseService');
export const continueService = lazyService<IContinueService>('continueService');
export const tabbyService = lazyService<ITabbyService>('tabbyService');
export const gptPilotService = lazyService<IGptPilotService>('gptPilotService');
export const voidService = lazyService<IVoidService>('voidService');
export const crushService = lazyService<ICrushService>('crushService');
export const codeWhaleService = lazyService<ICodeWhaleService>('codeWhaleService');
export const codexService = lazyService<ICodexService>('codexService');
export const geminiCliService = lazyService<IGeminiCliService>('geminiCliService');
export const kiloService = lazyService<IKiloService>('kiloService');
export const interpreterService = lazyService<IInterpreterService>('interpreterService');
export const miniSweService = lazyService<IMiniSweService>('miniSweService');
export const heliconeService = lazyService<IHeliconeService>('heliconeService');
export const portkeyService = lazyService<IPortkeyService>('portkeyService');
export const liteLlmService = lazyService<ILiteLlmService>('liteLlmService');
export const langfuseService = lazyService<ILangfuseService>('langfuseService');
export const metabolicService = lazyService<IMetabolicService>('metabolicService');
export const maestroService = lazyService<IMaestroService>('maestroService');
export const localTripleService = lazyService<ILocalTripleService>('localTripleService');
export const chemistService = lazyService<IChemistService>('chemistService');
export const analitikService = lazyService<IAnalitikService>('analitikService');
export const ruslanService = lazyService<IRuslanService>('ruslanService');
export const heisenbergService = lazyService<IHeisenbergService>('heisenbergService');
export const agencyRuService = lazyService<IAgencyRuService>('agencyRuService');
export const evoLabService = lazyService<IEvoLabService>('evoLabService');
export const gigaStudioService = lazyService<IGigaStudioService>('gigaStudioService');
export const sciAgentsService = lazyService<ISciAgentsService>('sciAgentsService');
export const sparksService = lazyService<ISparksService>('sparksService');
export const aiScientistService = lazyService<IAiScientistService>('aiScientistService');
export const latentService = lazyService<ILatentService>('latentService');
export const eightStageService = lazyService<IEightStageService>('eightStageService');
export const cognitaeService = lazyService<ICognitaeService>('cognitaeService');
export const cogTeamService = lazyService<ICogTeamService>('cogTeamService');
export const synService = lazyService<ISynService>('synService');
export const helixService = lazyService<IHelixService>('helixService');
export const ideatorService2 = lazyService<IIdeatorService>('ideatorService2');
export const metaKbService = lazyService<IMetaKbService>('metaKbService');
export const researchOsService = lazyService<IResearchOsService>('researchOsService');
export const deepResearch2Service = lazyService<IDeepResearch2Service>('deepResearch2Service');
export const darwinService = lazyService<IDarwinService>('darwinService');
export const qyvariaService = lazyService<IQyvariaService>('qyvariaService');
export const parliamentaryService = lazyService<IParliamentaryService>('parliamentaryService');
export const policyDebateService = lazyService<IPolicyDebateService>('policyDebateService');
export const socraticService2 = lazyService<ISocraticService>('socraticService2');
export const fishbowlService = lazyService<IFishbowlService>('fishbowlService');
export const delphiService = lazyService<IDelphiService>('delphiService');
export const rckService = lazyService<IRckService>('rckService');
export const cogneeService = lazyService<ICogneeService>('cogneeService');
export const metanService = lazyService<IMetanService>('metanService');
export const conceptsService = lazyService<IConceptsService>('conceptsService');
export const secondBrainService = lazyService<ISecondBrainService>('secondBrainService');
export const stormService2 = lazyService<IStormService>('stormService2');
export const blackboardService2 = lazyService<IBlackboardService>('blackboardService2');
export const metaControllerService2 = lazyService<IMetaControllerService>('metaControllerService2');
export const doloresService2 = lazyService<IDoloresService>('doloresService2');
export const epistemeService2 = lazyService<IEpistemeService>('epistemeService2');
export const claudeCodeService = lazyService<IClaudeCodeService>('claudeCodeService');
export const mcpDeepService = lazyService<IMcpDeepService>('mcpDeepService');
export const filesApiService = lazyService<IFilesApiService>('filesApiService');
export const cacheControlService = lazyService<ICacheControlService>('cacheControlService');
export const projectService = lazyService<IProjectService>('projectService');
export const dynamicWorkflowService = lazyService<IDynamicWorkflowService>('dynamicWorkflowService');
export const routineService = lazyService<IRoutineService>('routineService');
export const agentViewService = lazyService<IAgentViewService>('agentViewService');
export const orgChartService = lazyService<IOrgChartService>('orgChartService');
export const bizTicketService = lazyService<IBizTicketService>('bizTicketService');
export const meetingService = lazyService<IMeetingService>('meetingService');
export const hitlLevelsService = lazyService<IHITLLevelsService>('hitlLevelsService');
export const playbookService = lazyService<IPlaybookService>('playbookService');
export const composeService = lazyService<IComposeService>('composeService');
export const dataSourceService = lazyService<IDataSourceService>('dataSourceService');
export const bulkService = lazyService<IBulkService>('bulkService');
export const scraperService = lazyService<IScraperService>('scraperService');
export const relayService = lazyService<IRelayService>('relayService');
export const seoPackService = lazyService<ISeoPackService>('seoPackService');
export const outreachPackService = lazyService<IOutreachPackService>('outreachPackService');
export const financePackService = lazyService<IFinancePackService>('financePackService');
export const siteAuditService = lazyService<ISiteAuditService>('siteAuditService');
export const calendarService = lazyService<ICalendarService>('calendarService');
export const formatService = lazyService<IFormatService>('formatService');
export const argTechService = lazyService<IArgTechService>('argTechService');

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
