import { CONFIG } from '../config-registry';
import type { DebatePolicyEngine } from './debate-policy-engine';
import type { DebateRAGRetriever } from './debate-rag-retriever';
import type { DebateMemoryExtractor } from './debate-memory-extractor';
import type { IEntanglementEngine, IAnchoringService } from '../../contracts/debate-entanglement';
import type { IArgumentGraphService } from '../../contracts/debate-argument-graph';
import type { IVulnerabilityTargetingService } from '../../contracts/debate-vulnerability';
import type { IShadowOpponentService } from '../../contracts/debate-shadow-opponent';
import type { IAdversarialSourceService } from '../../contracts/debate-adversarial-source';
import type { IBeliefMiningService } from '../../contracts/debate-belief-mining';
import type { IMinimaxPlanner } from '../../contracts/debate-minimax';
import type { IMetaAgentController } from '../../contracts/debate-meta-agent';
import type { ISteelmanService } from '../../contracts/debate-steelman';
import type { IBoPTrackerService } from '../../contracts/debate-bop';
import type { IConsistencyService } from '../../contracts/debate-consistency';
import type { ICredibilityScorer } from '../../contracts/debate-credibility';
import type { ISimilarityMonitor } from '../../contracts/debate-similarity';
import type { IPersonaDriftDetector } from '../../contracts/debate-drift';
import type { IInsightBus } from '../../contracts/debate-insight-bus';
import type { ILogicalFormExtractor } from '../../contracts/debate-logic';
import type { IJustificationEnforcer } from '../../contracts/debate-justification';
import type { IBiasProfiler } from '../../contracts/debate-bias';
import type { IInterruptQueue } from '../../contracts/debate-interrupt';
import type { IStakeholderMapper } from '../../contracts/debate-stakeholder';
import type { ICalibrationService } from '../../contracts/debate-calibration';
import type { IPersonaMixer } from '../../contracts/debate-persona-mixer';
import type { IFrameTracker } from '../../contracts/debate-frame-tracker';
import type { IExpertWitnessService } from '../../contracts/debate-expert-witness';
import type { IBayesianJudge } from '../../contracts/debate-bayesian';
import type { IStanceDriftTracker } from '../../contracts/debate-stance-drift';
import type { IRhetoricalDeviceSelector } from '../../contracts/debate-rhetorical-device';
import type { IScratchpadService } from '../../contracts/debate-scratchpad';
import type { IBlindEvaluationService } from '../../contracts/debate-blind-eval';
import type { IDebateEvaluator } from '../../contracts/debate-runtime';
import type { IQualityImpactCollector } from '../../contracts/quality-impact';
import type { IIncentiveDetector } from '../../contracts/debate-incentives';
import type { IGoTDeliberation } from '../../contracts/debate-got';
import type { IConceptBlender } from '../../contracts/debate-blending';
import type { IOutcomeForecaster } from '../../contracts/debate-forecaster';
import type { IEventBus } from '../../types/interfaces';
import type { IAdapterRegistry } from '../../contracts/provider-adapter';
import type { IDistributedLock } from '../../contracts/cross-tab-lock';
import type { DebateStore } from '../../contracts/storage/debate-store';
import { DebateProviderResolver } from './debate-query-engine';

export interface KeyServiceLike {
    getKeys(): Array<{
        id: string;
        key: string;
        provider: string;
        status: string;
        model?: string;
        availableModels?: string[];
    }>;
    recordUsage(
        keyId: string,
        latency: number,
        tokens: number,
        modelId: string,
        metadata?: Record<string, unknown>,
    ): void;
    updateKeyStatus(keyId: string, status: string): void;
}

export interface RouterServiceLike {
    getDebateProviders(count: number): Array<{
        provider: string;
        key: { id: string; provider: string; key: string; availableModels?: string[] };
    }>;
    getRankedProviders(
        strategy: string,
        prompt: string,
    ): Array<{ id: string; provider: string; key: string; availableModels?: string[] }>;
}

export interface DebateEngineDeps {
    eventBus: IEventBus;
    getRouterService: () => RouterServiceLike;
    getKeyService: () => KeyServiceLike;
    getAdapterRegistry: () => IAdapterRegistry;
    getKeyStateStore?: () => {
        get(
            id: string,
        ):
            | { flags: { authFailed: boolean; circuitOpen: boolean; rateLimited: boolean } }
            | undefined;
        update(id: string, patch: { flags: Record<string, boolean> }): void;
    };
    debateStore?: DebateStore;
    getExecutionGovernor?: () => {
        start(spec: { type: string; timeoutMs: number; metadata?: Record<string, unknown> }): {
            complete(): void;
            fail(e: Error): void;
            signal: AbortSignal;
        };
    };
    policyEngine?: DebatePolicyEngine;
    ragRetriever?: DebateRAGRetriever;
    memoryExtractor?: DebateMemoryExtractor;
    evaluator?: IDebateEvaluator;
    providerResolver?: DebateProviderResolver;
    entanglementEngine?: IEntanglementEngine;
    anchoringService?: IAnchoringService;
    argumentGraphService?: IArgumentGraphService;
    vulnerabilityTargeting?: IVulnerabilityTargetingService;
    shadowOpponent?: IShadowOpponentService;
    adversarialSource?: IAdversarialSourceService;
    beliefMiningService?: IBeliefMiningService;
    minimaxPlanner?: IMinimaxPlanner;
    metaAgent?: IMetaAgentController;
    steelmanService?: ISteelmanService;
    boPTracker?: IBoPTrackerService;
    consistencyService?: IConsistencyService;
    credibilityScorer?: ICredibilityScorer;
    similarityMonitor?: ISimilarityMonitor;
    driftDetector?: IPersonaDriftDetector;
    insightBus?: IInsightBus;
    logicalFormExtractor?: ILogicalFormExtractor;
    justificationEnforcer?: IJustificationEnforcer;
    biasProfiler?: IBiasProfiler;
    interruptQueue?: IInterruptQueue;
    stakeholderMapper?: IStakeholderMapper;
    calibrationService?: ICalibrationService;
    personaMixer?: IPersonaMixer;
    frameTracker?: IFrameTracker;
    expertWitness?: IExpertWitnessService;
    bayesianJudge?: IBayesianJudge;
    stanceDriftTracker?: IStanceDriftTracker;
    rhetoricalDeviceSelector?: IRhetoricalDeviceSelector;
    scratchpadService?: IScratchpadService;
    blindEval?: IBlindEvaluationService;
    factCheckService?: {
        getForArgument(argumentId: string):
            | {
                  overallScore: number;
                  results: Array<{ verdict: string; claim: string; reasoning: string }>;
              }
            | undefined;
    };
    qualityCollector?: IQualityImpactCollector;
    incentiveDetector?: IIncentiveDetector;
    gotDeliberation?: IGoTDeliberation;
    conceptBlender?: IConceptBlender;
    outcomeForecaster?: IOutcomeForecaster;
    deadLetterQueue?: import('../../contracts/dead-letter-queue').IDeadLetterQueue;
    distributedLock?: IDistributedLock;
}

// P1-2: overall debate duration watchdog — default 30min, configurable via CONFIG
export function getDebateMaxDurationMs(): number {
    return CONFIG?.services?.debate?.maxDurationMs ?? 1_800_000;
}
