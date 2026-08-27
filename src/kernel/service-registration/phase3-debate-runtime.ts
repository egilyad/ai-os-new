/**
 * Phase 3 — Debate & Runtime.
 *
 * Debate services, research services, and runtime intelligence
 * (cognitive intelligence, what-if, pressure map, diagnostics).
 *
 * A-04: All services now use registerFactory (lazy instantiation).
 * Imperative calls (setDeps, setEngine) remain outside factories.
 */
import type { Phase } from './helpers';
import { rootLogger } from '../services/logger-service';
const LOGGER = rootLogger.child('Phase3DebateRuntime');
import type { IEventBus, IDatabaseService } from '../types/interfaces';
import type { IExecutionGovernor } from '../contracts/execution-governor';
import type { StorageLayer, DebateStore } from '../contracts/storage/storage-layer';
import type { KeyService } from '../services/key-management/key-service';
import type { ProviderAdapterRegistry } from '../services/provider-adapter-registry';
import type { ISessionManager } from '../contracts/session-manager';
import type { WorkspaceService } from '../services/workspace-service';
import type { RoleService } from '../services/role-service';
import type { OrchestrationService } from '../services/orchestration-service';
import type { MemoryService } from '../services/memory-engine';
import type { ChatMessage } from '../types/llm-types';
import type { DebateServiceDeps } from '../contracts/debate-service-deps';
import type { IEntanglementEngine, IAnchoringService } from '../contracts/debate-entanglement';
import type { IArgumentGraphService } from '../contracts/debate-argument-graph';
import type { IVulnerabilityTargetingService } from '../contracts/debate-vulnerability';
import type { IShadowOpponentService } from '../contracts/debate-shadow-opponent';
import type { IAdversarialSourceService } from '../contracts/debate-adversarial-source';
import type { IBeliefMiningService } from '../contracts/debate-belief-mining';
import type { IMinimaxPlanner } from '../contracts/debate-minimax';
import type { IMetaAgentController } from '../contracts/debate-meta-agent';
import type { ISteelmanService } from '../contracts/debate-steelman';
import type { IBoPTrackerService } from '../contracts/debate-bop';
import type { IConsistencyService } from '../contracts/debate-consistency';
import type { ICredibilityScorer } from '../contracts/debate-credibility';
import type { ISimilarityMonitor } from '../contracts/debate-similarity';
import type { IPersonaDriftDetector } from '../contracts/debate-drift';
import type { IInsightBus } from '../contracts/debate-insight-bus';
import type { ILogicalFormExtractor } from '../contracts/debate-logic';
import type { IJustificationEnforcer } from '../contracts/debate-justification';
import type { IBiasProfiler } from '../contracts/debate-bias';
import type { IInterruptQueue } from '../contracts/debate-interrupt';
import type { IStakeholderMapper } from '../contracts/debate-stakeholder';
import type { ICalibrationService } from '../contracts/debate-calibration';
import type { IPersonaMixer } from '../contracts/debate-persona-mixer';
import type { IFrameTracker } from '../contracts/debate-frame-tracker';
import type { IExpertWitnessService } from '../contracts/debate-expert-witness';
import type { IStanceDriftTracker } from '../contracts/debate-stance-drift';
import type { IRhetoricalDeviceSelector } from '../contracts/debate-rhetorical-device';
import type { IScratchpadService } from '../contracts/debate-scratchpad';
import type { IBlindEvaluationService } from '../contracts/debate-blind-eval';
import type { IIncentiveDetector } from '../contracts/debate-incentives';
import type { IGoTDeliberation } from '../contracts/debate-got';
import type { IConceptBlender } from '../contracts/debate-blending';
import type { IOutcomeForecaster } from '../contracts/debate-forecaster';
import type { ICrossExaminationService } from '../contracts/debate-cross-examination';
import type { IDeltaFocusingService } from '../contracts/debate-delta-focusing';
import type { IAgreementAnchoringService } from '../contracts/debate-agreement-anchoring';
import type { IBurdenOfProofService } from '../contracts/debate-burden-of-proof';
import type { IPrePublishCriticService } from '../contracts/debate-pre-publish-critic';

import { SimilarityMonitor } from '../services/debate-runtime/similarity-monitor';
import { PersonaDriftDetector } from '../services/debate-runtime/persona-drift-detector';
import { InsightBus } from '../services/debate-runtime/insight-bus';
import { LogicalFormExtractor } from '../services/debate-runtime/logical-form-extractor';
import { JustificationEnforcer } from '../services/debate-runtime/justification-enforcer';
import { BiasProfiler } from '../services/debate-runtime/bias-profiler';
import { InterruptQueue } from '../services/debate-runtime/interrupt-queue';
import { StakeholderMapper } from '../services/debate-runtime/stakeholder-mapper';
import { CalibrationService } from '../services/debate-runtime/calibration-service';
import { PersonaMixer } from '../services/debate-runtime/persona-mixer';
import { FrameTracker } from '../services/debate-runtime/frame-tracker';
import { ExpertWitnessService } from '../services/debate-runtime/expert-witness-service';
import { BayesianJudge } from '../services/debate-runtime/bayesian-judge';
import { StanceDriftTracker } from '../services/debate-runtime/stance-drift-tracker';
import { RhetoricalDeviceSelector } from '../services/debate-runtime/rhetorical-device-selector';
import { ScratchpadService } from '../services/debate-runtime/scratchpad-service';
import { BlindEvaluationService } from '../services/debate-runtime/blind-evaluation-service';
import { IncentiveDetector } from '../services/debate-runtime/incentive-detector';
import { GoTDeliberation } from '../services/debate-runtime/got-deliberation';
import { ConceptBlender } from '../services/debate-runtime/concept-blender';
import { OutcomeForecaster } from '../services/debate-runtime/outcome-forecaster';
import { CrossExaminationService } from '../services/debate-runtime/cross-examination-service';
import { DeltaFocusingService } from '../services/debate-runtime/delta-focusing-service';
import { AgreementAnchoringService } from '../services/debate-runtime/agreement-anchoring-service';
import { BurdenOfProofService } from '../services/debate-runtime/burden-of-proof-service';
import { PrePublishCriticService } from '../services/debate-runtime/pre-publish-critic-service';
import { ExecutableEvidenceService } from '../services/debate-runtime/executable-evidence-service';
import { EvidenceTriangulationService } from '../services/debate-runtime/evidence-triangulation-service';
import { HumilityScoringService } from '../services/debate-runtime/humility-scoring-service';
import { CriticService } from '../services/debate-runtime/critic-service';
import { PivotService } from '../services/debate-runtime/pivot-service';
import { ConcessionService } from '../services/debate-runtime/concession-service';
import { CounterfactualService } from '../services/debate-runtime/counterfactual-service';
import { SynthesisService } from '../services/debate-runtime/synthesis-service';
import { TriangulationService } from '../services/debate-runtime/triangulation-service';
import { EmpathyService } from '../services/debate-runtime/empathy-service';
import { HeatDetectionService } from '../services/debate-runtime/heat-detection-service';
import { SentinelService } from '../services/debate-runtime/sentinel-service';
import { RedundancyService } from '../services/debate-runtime/redundancy-service';
import { MultiHopService } from '../services/debate-runtime/multi-hop-service';
import { EnthymemeService } from '../services/debate-runtime/enthymeme-service';
import { AbstractionLadderService } from '../services/debate-runtime/abstraction-ladder-service';
import { RoleReversalService } from '../services/debate-runtime/role-reversal-service';
import { FogOfWarService } from '../services/debate-runtime/fog-of-war-service';
import { EvidenceRevelationService } from '../services/debate-runtime/evidence-revelation-service';
import { HumorService } from '../services/debate-runtime/humor-service';
import { StatusDynamicsService } from '../services/debate-runtime/status-dynamics-service';
import { StyleMatchingService } from '../services/debate-runtime/style-matching-service';
import { DynamicPersonaService } from '../services/debate-runtime/dynamic-persona-service';
import { WhisperChannelsService } from '../services/debate-runtime/whisper-channels-service';
import { ObjectionAnticipationService } from '../services/debate-runtime/objection-anticipation-service';
import { HegelianService } from '../services/debate-runtime/hegelian-service';
import { UncertaintyPropagationService } from '../services/debate-runtime/uncertainty-propagation-service';
import { RhetoricSafetyService } from '../services/debate-runtime/rhetoric-safety-service';
import { BiddingTimeService } from '../services/debate-runtime/bidding-time-service';
import { AdaptiveOrderService } from '../services/debate-runtime/adaptive-order-service';
import { JudgeDeliberationService } from '../services/debate-runtime/judge-deliberation-service';
import { SemanticBlendingService } from '../services/debate-runtime/semantic-blending-service';
import { SocraticPivotService } from '../services/debate-runtime/socratic-pivot-service';
import { AllianceService } from '../services/debate-runtime/alliance-service';
import { PredictionMarketService } from '../services/debate-runtime/prediction-market-service';
import { DpoStrategySampler } from '../services/debate-runtime/dpo-strategy-sampler';
import { MinimaxPlanner } from '../services/debate-runtime/debate-minimax-planner';
import { MetaAgentController } from '../services/debate-runtime/debate-meta-agent-controller';
import { SteelmanService } from '../services/debate-runtime/debate-steelman-service';
import { BoPTrackerService } from '../services/debate-runtime/debate-bop-service';
import { ConsistencyService } from '../services/debate-runtime/debate-consistency-service';
import { CredibilityScorer } from '../services/debate-runtime/debate-credibility-service';
import { ArgumentGraphService } from '../services/debate-runtime/debate-argument-graph-service';
import { VulnerabilityTargetingService } from '../services/debate-runtime/debate-vulnerability-service';
import { ShadowOpponentService } from '../services/debate-runtime/debate-shadow-opponent-service';
import { AdversarialSourceService } from '../services/debate-runtime/debate-adversarial-source-service';
import { BeliefMiningService } from '../services/debate-runtime/debate-belief-mining-service';
import { FactCheckService } from '../services/fact-check-service';
import { DebatePostProcessor } from '../services/debate-runtime/debate-post-processor';
import { DebateSyncManager } from '../services/debate-runtime/debate-sync-manager';
import { resolveDebateStoreAdapters } from './debate-store-adapters';
import { DebateHumanService } from '../services/debate-runtime/debate-human-service';
import { DebateQueryEngine } from '../services/debate-runtime/debate-query-engine';
import {
    EntanglementEngine,
    AnchoringService,
} from '../services/debate-runtime/debate-entanglement-engine';
import { CollaborativeService } from '../services/collaborative-service';
import { DebateApiService } from '../services/debate-runtime/debate-api';
import { DebateKnowledgeSyncService } from '../services/debate-runtime/debate-knowledge-sync';
import { HypothesisService } from '../services/hypothesis-service';
import { ResearchRunService } from '../services/research-run-service';
import { ArchitectureReviewService } from '../services/architecture-review-service';
import { PromptAuditService } from '../services/prompt-audit-service';
import { RoutingExperimentsService } from '../services/routing-experiments-service';
import { DebateEngine } from '../services/debate-runtime/debate-engine';
import { StrategyManager } from '../services/debate-runtime/debate-strategy-manager';
import { DebateModeManagerPersistent } from '../services/debate-runtime/debate-mode-manager';
import { DebateWorkspace } from '../services/debate-runtime/debate-workspace';
import { DebatePolicyEngine } from '../services/debate-runtime/debate-policy-engine';
import { DebateRAGRetriever } from '../services/debate-runtime/debate-rag-retriever';
import { DebateEmbeddingPipeline } from '../services/debate-runtime/debate-embedding-pipeline';
import { DebateMemoryExtractor } from '../services/debate-runtime/debate-memory-extractor';
import { DebateEvaluator } from '../services/debate-runtime/debate-evaluator';
import { CognitiveIntelligenceService } from '../services/cognitive-intelligence/cognitive-intelligence-service';
import { WhatIfService } from '../services/runtime-intelligence/whatif-service';
import { PressureMapService } from '../services/runtime-intelligence/pressure-map-service';
import { DiagnosticService } from '../services/runtime-intelligence/diagnostic-service';
import { QualityImpactCollector } from '../services/quality-impact-collector';
import { ExperimentEngine } from '../services/quality-experiment-engine';

/** Simple hash-based embedding for keyword overlap without an external embedding API. */
function simpleEmbedText(text: string): Promise<Float32Array> {
    const words = text
        .toLowerCase()
        .split(/[^a-zа-яё0-9]+/)
        .filter(Boolean);
    const freq = new Map<string, number>();
    for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
    const vocab = Array.from(freq.keys());
    const dim = 64;
    const vec = new Float32Array(dim);
    for (let i = 0; i < vocab.length && i < dim; i++) {
        vec[i] = (freq.get(vocab[i]!)! || 0) / words.length;
    }
    return Promise.resolve(vec);
}

const EMPTY_DEBATE_STORE: DebateStore = {
    saveSnapshot: async () => {
        throw new Error('DebateStore not available — storageLayer not configured');
    },
    getSnapshot: async () => {
        throw new Error('DebateStore not available — storageLayer not configured');
    },
    listSessions: async () => {
        throw new Error('DebateStore not available — storageLayer not configured');
    },
    listAllSessions: async () => {
        throw new Error('DebateStore not available — storageLayer not configured');
    },
    deleteSession: async () => {
        throw new Error('DebateStore not available — storageLayer not configured');
    },
    saveVerdict: async () => {
        throw new Error('DebateStore not available — storageLayer not configured');
    },
    getVerdict: async () => {
        throw new Error('DebateStore not available — storageLayer not configured');
    },
    count: async () => {
        throw new Error('DebateStore not available — storageLayer not configured');
    },
};

export const registerPhase3: Phase = (helpers, ctx) => {
    const { register, asDeps } = helpers;
    const storageLayer = ctx.container.get<StorageLayer>('storageLayer');

    // Lazy factory registrations — services created on first container.get().
    register(
        'debateEmbeddingPipeline',
        (_c) => new DebateEmbeddingPipeline({ embedText: simpleEmbedText }),
    );
    register('debateEvaluator', (_c) => new DebateEvaluator(new DpoStrategySampler()));
    register('debateMemoryExtractor', (_c) => new DebateMemoryExtractor());
    register(
        'debateRAGRetriever',
        (c) =>
            new DebateRAGRetriever({
                embeddingPipeline: c.get<DebateEmbeddingPipeline>('debateEmbeddingPipeline'),
            }),
    );

    register(
        'qualityImpactCollector',
        (c) => new QualityImpactCollector(c.get<IEventBus>('eventBus')),
    );

    register('experimentEngine', (c) => {
        const engine = new ExperimentEngine(c.get<IEventBus>('eventBus'));
        engine
            .init()
            .catch((e: unknown) =>
                LOGGER.warn('Phase3DebateRuntime', 'ExperimentEngine.init failed', { error: e }),
            );
        return engine;
    });

    register('factCheckService', (c) => {
        const eventBus = c.get<IEventBus>('eventBus');
        return new FactCheckService({
            eventBus,
            getApiKey: (provider: string) => {
                const ks = c.get<KeyService>('keyService');
                const keys = ks.getKeys();
                const key = keys.find(
                    (k) =>
                        k.provider.toLowerCase() === provider.toLowerCase() &&
                        k.status === 'active',
                );
                return key?.key;
            },
            sendMessage: async (messages, model, apiKey) => {
                const providers = c
                    .get<import('../services/provider-router').RouterService>('routerService')
                    .getDebateProviders(1);
                const adapter = c
                    .get<ProviderAdapterRegistry>('providerAdapterRegistry')
                    .getAdapter(providers[0]?.provider || 'groq');
                if (!adapter) throw new Error('No adapter');
                const res = await adapter.sendMessage(
                    messages as ChatMessage[],
                    model,
                    apiKey,
                    new AbortController().signal,
                );
                return { content: res.content };
            },
        });
    });

    register('debateService', (c) => {
        const factCheckService = c.get<FactCheckService>('factCheckService');
        const postProcessor = new DebatePostProcessor({ factCheckService });
        const syncManager = new DebateSyncManager(postProcessor);
        syncManager.setDeps(
            asDeps<DebateServiceDeps>({
                database: c.get<IDatabaseService>('database'),
                eventBus: c.get<IEventBus>('eventBus'),
                get routerService() {
                    return c.get<import('../services/provider-router').RouterService>(
                        'routerService',
                    );
                },
                get keyService() {
                    return c.get<KeyService>('keyService');
                },
                get adapterRegistry() {
                    return c.get<ProviderAdapterRegistry>('providerAdapterRegistry');
                },
                get workspaceService() {
                    return c.get<WorkspaceService>('workspaceService');
                },
                queryEngine: new DebateQueryEngine(),
                debateStore: storageLayer?.debates ?? EMPTY_DEBATE_STORE,
                ...resolveDebateStoreAdapters(ctx.container),
                get sessionManager() {
                    return c.get<
                        import('../services/session-manager-service').SessionManagerService
                    >('sessionManagerService');
                },
                qualityCollector: c.get<QualityImpactCollector>('qualityImpactCollector'),
                experimentEngine: c.get<ExperimentEngine>('experimentEngine'),
            }),
        );
        // Wire DebateEngine → DebateSyncManager (lazy: resolved on first container.get)
        syncManager.engine = c.get<DebateEngine>('debateEngine');
        return syncManager;
    });

    register(
        'collaborativeService',
        (c) =>
            new CollaborativeService({
                eventBus: c.get<IEventBus>('eventBus'),
                get humanService() {
                    return c.get<
                        import('../services/debate-runtime/debate-human-service').DebateHumanService
                    >('debateHumanService');
                },
                get debateApiService() {
                    return c.get<import('../services/debate-runtime/debate-api').DebateApiService>(
                        'debateApiService',
                    );
                },
            }),
    );

    register(
        'debateApiService',
        (c) =>
            new DebateApiService({
                eventBus: c.get<IEventBus>('eventBus'),
                debateService: c.get<DebateSyncManager>('debateService'),
                get orchestrator() {
                    return c.get<OrchestrationService>('orchestrator');
                },
                get sessionManager() {
                    return c.get<ISessionManager>('sessionManagerService');
                },
            }),
    );

    register(
        'debateKnowledgeSync',
        (c) =>
            new DebateKnowledgeSyncService({
                eventBus: c.get<IEventBus>('eventBus'),
                memoryService: c.get<MemoryService>('memoryService'),
            }),
    );

    register(
        'hypothesisService',
        (c) =>
            new HypothesisService({
                eventBus: c.get<IEventBus>('eventBus'),
                database: c.get<IDatabaseService>('database'),
            }),
    );

    register(
        'researchRunService',
        (c) =>
            new ResearchRunService({
                database: c.get<IDatabaseService>('database'),
            }),
    );

    register('architectureReviewService', (_c) => new ArchitectureReviewService());

    register(
        'promptAuditService',
        (c) =>
            new PromptAuditService({
                get getAllRoles() {
                    return () => c.get<RoleService>('roleService').getAllRoles();
                },
            }),
    );

    register(
        'routingExperimentsService',
        (c) =>
            new RoutingExperimentsService({
                database: c.get<IDatabaseService>('database'),
                resolveApiKey: (provider: string) => {
                    const keyService = c.get<KeyService>('keyService');
                    const keys = keyService.getKeysByProvider(provider);
                    return keys?.[0]?.key ?? '';
                },
                getAdapter: (provider: string) => {
                    const registry = c.get<ProviderAdapterRegistry>('providerAdapterRegistry');
                    const adapter = registry.getAdapter(provider);
                    if (!adapter) return null;
                    return {
                        sendMessage: async (
                            messages: Array<{ role: string; content: string }>,
                            model: string,
                            apiKey: string,
                            temperature?: number,
                            maxTokens?: number,
                        ) => {
                            return adapter.sendMessage(
                                messages as ChatMessage[],
                                model,
                                apiKey,
                                undefined,
                                { temperature, maxOutputTokens: maxTokens },
                            ) as Promise<{ content?: string }>;
                        },
                    };
                },
            }),
    );

    register('debatePolicyEngine', (_c) => new DebatePolicyEngine());

    register('entanglementEngine', (c) => {
        const engine = new EntanglementEngine();
        try {
            engine.setGraph(c.get<IArgumentGraphService>('argumentGraphService'));
        } catch {
            /* graph may not be registered yet */
        }
        return engine;
    });
    register('anchoringService', (c) => {
        const svc = new AnchoringService();
        try {
            svc.setGraph(c.get<IArgumentGraphService>('argumentGraphService'));
        } catch {
            /* graph may not be registered yet */
        }
        return svc;
    });
    register('argumentGraphService', (_c) => new ArgumentGraphService());
    register('vulnerabilityTargetingService', (c) => {
        const graph = c.get<IArgumentGraphService>('argumentGraphService');
        return new VulnerabilityTargetingService(graph);
    });
    register('shadowOpponentService', (_c) => new ShadowOpponentService());
    register('adversarialSourceService', (_c) => new AdversarialSourceService());
    register('beliefMiningService', (_c) => new BeliefMiningService());
    register('minimaxPlannerService', (c) => {
        const graph = c.get<IArgumentGraphService>('argumentGraphService');
        return new MinimaxPlanner(graph);
    });
    register('metaAgentController', (c) => {
        const graph = c.get<IArgumentGraphService>('argumentGraphService');
        return new MetaAgentController(graph);
    });

    register('steelmanService', (_c) => new SteelmanService());
    register('boPTrackerService', (_c) => new BoPTrackerService());
    register('consistencyService', (_c) => new ConsistencyService());
    register('credibilityScorer', (_c) => new CredibilityScorer());
    register('similarityMonitor', (_c) => new SimilarityMonitor());
    register('driftDetector', (_c) => new PersonaDriftDetector());
    register('insightBus', (_c) => new InsightBus());
    register('logicalFormExtractor', (_c) => new LogicalFormExtractor());
    register('justificationEnforcer', (_c) => new JustificationEnforcer());
    register('biasProfiler', (_c) => new BiasProfiler());
    register('interruptQueue', (_c) => new InterruptQueue());
    register('stakeholderMapper', (_c) => new StakeholderMapper());
    register('calibrationService', (_c) => new CalibrationService());
    register('personaMixer', (_c) => new PersonaMixer());
    register('frameTracker', (_c) => new FrameTracker());
    register('expertWitnessService', (_c) => new ExpertWitnessService());
    register('bayesianJudge', (_c) => new BayesianJudge());
    register('stanceDriftTracker', (_c) => new StanceDriftTracker());
    register('rhetoricalDeviceSelector', (_c) => new RhetoricalDeviceSelector());
    register('scratchpadService', (_c) => new ScratchpadService());
    register('blindEval', (_c) => new BlindEvaluationService());

    register('incentiveDetector', (_c) => new IncentiveDetector());
    register('gotDeliberation', (_c) => new GoTDeliberation());
    register('conceptBlender', (_c) => new ConceptBlender());
    register('outcomeForecaster', (_c) => new OutcomeForecaster());

    // P0 batch 1 — Quality pattern gap closure
    register('crossExaminationService', (_c) => new CrossExaminationService());
    register('deltaFocusingService', (_c) => new DeltaFocusingService());
    register('agreementAnchoringService', (_c) => new AgreementAnchoringService());
    register('burdenOfProofService', (_c) => new BurdenOfProofService());
    register('prePublishCriticService', (_c) => new PrePublishCriticService());
    register('executableEvidenceService', (_c) => new ExecutableEvidenceService());
    register('evidenceTriangulationService', (_c) => new EvidenceTriangulationService());
    register('humilityScoringService', (_c) => new HumilityScoringService());
    register('criticService', (_c) => new CriticService());
    register('pivotService', (_c) => new PivotService());
    register('concessionService', (_c) => new ConcessionService());
    register('counterfactualService', (_c) => new CounterfactualService());
    register('synthesisService', (_c) => new SynthesisService());
    register('triangulationService', (_c) => new TriangulationService());
    register('empathyService', (_c) => new EmpathyService());
    register('heatDetectionService', (_c) => new HeatDetectionService());
    register('sentinelService', (_c) => new SentinelService());
    register('redundancyService', (_c) => new RedundancyService());
    register('multiHopService', (_c) => new MultiHopService());
    register('enthymemeService', (_c) => new EnthymemeService());
    register('abstractionLadderService', (_c) => new AbstractionLadderService());
    register('roleReversalService', (_c) => new RoleReversalService());
    register('fogOfWarService', (_c) => new FogOfWarService());
    register('evidenceRevelationService', (_c) => new EvidenceRevelationService());
    register('humorService', (_c) => new HumorService());
    register('statusDynamicsService', (_c) => new StatusDynamicsService());
    register('styleMatchingService', (_c) => new StyleMatchingService());
    register('dynamicPersonaService', (_c) => new DynamicPersonaService());
    register('whisperChannelsService', (_c) => new WhisperChannelsService());
    register('objectionAnticipationService', (_c) => new ObjectionAnticipationService());
    register('hegelianService', (_c) => new HegelianService());
    register('uncertaintyPropagationService', (_c) => new UncertaintyPropagationService());
    register('rhetoricSafetyService', (_c) => new RhetoricSafetyService());
    register('biddingTimeService', (_c) => new BiddingTimeService());
    register('adaptiveOrderService', (_c) => new AdaptiveOrderService());
    register('judgeDeliberationService', (_c) => new JudgeDeliberationService());
    register('semanticBlendingService', (_c) => new SemanticBlendingService());
    register('socraticPivotService', (_c) => new SocraticPivotService());
    register('allianceService', (_c) => new AllianceService());
    register('predictionMarketService', (_c) => new PredictionMarketService());

    register('debateEngine', (c) => {
        const noopGet = () => undefined;
        const noopUpdate = () => {};
        return new DebateEngine({
            eventBus: c.get<IEventBus>('eventBus'),
            get getRouterService() {
                return () =>
                    c.get<import('../services/provider-router').RouterService>('routerService');
            },
            get getKeyService() {
                return () => c.get<KeyService>('keyService');
            },
            get getAdapterRegistry() {
                return () => c.get<ProviderAdapterRegistry>('providerAdapterRegistry');
            },
            get getKeyStateStore() {
                const getter = (): {
                    get: (id: string) =>
                        | {
                              flags: {
                                  authFailed: boolean;
                                  circuitOpen: boolean;
                                  rateLimited: boolean;
                              };
                          }
                        | undefined;
                    update: (id: string, patch: { flags: Record<string, boolean> }) => void;
                } => {
                    try {
                        return c.get<import('../services/key-state-store').KeyStateStore>(
                            'keyStateStore',
                        ) as unknown as {
                            get: (id: string) =>
                                | {
                                      flags: {
                                          authFailed: boolean;
                                          circuitOpen: boolean;
                                          rateLimited: boolean;
                                      };
                                  }
                                | undefined;
                            update: (id: string, patch: { flags: Record<string, boolean> }) => void;
                        };
                    } catch {
                        return { get: noopGet, update: noopUpdate };
                    }
                };
                return getter;
            },
            get getExecutionGovernor() {
                return () => c.get<IExecutionGovernor>('executionGovernor');
            },
            debateStore: storageLayer?.debates ?? EMPTY_DEBATE_STORE,
            policyEngine: c.get<DebatePolicyEngine>('debatePolicyEngine'),
            ragRetriever: c.get<DebateRAGRetriever>('debateRAGRetriever'),
            memoryExtractor: c.get<DebateMemoryExtractor>('debateMemoryExtractor'),
            evaluator: c.get<DebateEvaluator>('debateEvaluator'),
            entanglementEngine: c.get<IEntanglementEngine>('entanglementEngine'),
            anchoringService: c.get<IAnchoringService>('anchoringService'),
            argumentGraphService: c.get<IArgumentGraphService>('argumentGraphService'),
            vulnerabilityTargeting: c.get<IVulnerabilityTargetingService>(
                'vulnerabilityTargetingService',
            ),
            shadowOpponent: c.get<IShadowOpponentService>('shadowOpponentService'),
            adversarialSource: c.get<IAdversarialSourceService>('adversarialSourceService'),
            beliefMiningService: c.get<IBeliefMiningService>('beliefMiningService'),
            minimaxPlanner: c.get<IMinimaxPlanner>('minimaxPlannerService'),
            metaAgent: c.get<IMetaAgentController>('metaAgentController'),
            steelmanService: c.get<ISteelmanService>('steelmanService'),
            boPTracker: c.get<IBoPTrackerService>('boPTrackerService'),
            consistencyService: c.get<IConsistencyService>('consistencyService'),
            credibilityScorer: c.get<ICredibilityScorer>('credibilityScorer'),
            similarityMonitor: c.get<ISimilarityMonitor>('similarityMonitor'),
            driftDetector: c.get<IPersonaDriftDetector>('driftDetector'),
            insightBus: c.get<IInsightBus>('insightBus'),
            logicalFormExtractor: c.get<ILogicalFormExtractor>('logicalFormExtractor'),
            justificationEnforcer: c.get<IJustificationEnforcer>('justificationEnforcer'),
            biasProfiler: c.get<IBiasProfiler>('biasProfiler'),
            interruptQueue: c.get<IInterruptQueue>('interruptQueue'),
            stakeholderMapper: c.get<IStakeholderMapper>('stakeholderMapper'),
            calibrationService: c.get<ICalibrationService>('calibrationService'),
            personaMixer: c.get<IPersonaMixer>('personaMixer'),
            frameTracker: c.get<IFrameTracker>('frameTracker'),
            expertWitness: c.get<IExpertWitnessService>('expertWitnessService'),
            factCheckService: c.get<FactCheckService>('factCheckService'),
            stanceDriftTracker: c.get<IStanceDriftTracker>('stanceDriftTracker'),
            rhetoricalDeviceSelector: c.get<IRhetoricalDeviceSelector>('rhetoricalDeviceSelector'),
            scratchpadService: c.get<IScratchpadService>('scratchpadService'),
            blindEval: c.get<IBlindEvaluationService>('blindEval'),
            qualityCollector: c.get<QualityImpactCollector>('qualityImpactCollector'),
            incentiveDetector: c.get<IIncentiveDetector>('incentiveDetector'),
            gotDeliberation: c.get<IGoTDeliberation>('gotDeliberation'),
            conceptBlender: c.get<IConceptBlender>('conceptBlender'),
            outcomeForecaster: c.get<IOutcomeForecaster>('outcomeForecaster'),
            deadLetterQueue:
                c.get<import('../contracts/dead-letter-queue').IDeadLetterQueue>('deadLetterQueue'),
            distributedLock:
                c.get<import('../contracts/cross-tab-lock').IDistributedLock>('distributedLock'),
        });
    });

    register('debateHumanService', (c) => {
        const factCheckService = c.get<FactCheckService>('factCheckService');
        const postProcessor = new DebatePostProcessor({ factCheckService });
        return new DebateHumanService(
            c.get<IEventBus>('eventBus'),
            storageLayer?.debates ?? EMPTY_DEBATE_STORE,
            {
                updateConvergenceScore: (session) => postProcessor.updateConvergenceScore(session),
            },
        );
    });
    register('strategyManager', (_c) => new StrategyManager(storageLayer.config));
    register('debateModeManager', (_c) => new DebateModeManagerPersistent(storageLayer));

    register(
        'debateWorkspace',
        (c) =>
            new DebateWorkspace({
                getRoom: () => undefined,
                getEngine: () => c.get<DebateEngine>('debateEngine'),
                storage: storageLayer,
            }),
    );

    register(
        'cognitiveIntelligenceService',
        (c) => new CognitiveIntelligenceService(c.get<IEventBus>('eventBus')),
    );

    register(
        'whatIfService',
        (c) =>
            new WhatIfService({
                eventBus: c.get<IEventBus>('eventBus'),
                cognitiveIntelligenceService: c.get<CognitiveIntelligenceService>(
                    'cognitiveIntelligenceService',
                ),
            }),
    );

    register(
        'pressureMapService',
        (c) =>
            new PressureMapService({
                eventBus: c.get<IEventBus>('eventBus'),
                cognitiveIntelligenceService: c.get<CognitiveIntelligenceService>(
                    'cognitiveIntelligenceService',
                ),
            }),
    );

    register(
        'diagnosticService',
        (c) =>
            new DiagnosticService({
                eventBus: c.get<IEventBus>('eventBus'),
                cognitiveIntelligenceService: c.get<CognitiveIntelligenceService>(
                    'cognitiveIntelligenceService',
                ),
            }),
    );
};
