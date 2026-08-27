import type { ApiKey, RouterWeights, SystemState } from '../types/metrics-types';
import type { RouterConfig, WeightProfile, ABTestConfig } from '../types/routing-types';
import type {
    FallbackLink,
    RoutingPolicyPreview,
    RoutingPolicyPreviewInput,
    RoutingPolicySnapshot,
} from '../contracts/routing-policy';
import type { ProbeResult } from '../contracts/probe';
import type { IKeyStateStore } from '../contracts/key-state';
import type { ISessionAffinityStore } from '../contracts/session-affinity';
import { RouterConfigManager } from './router-config-manager';
import { EVENTS } from '../events/event-names';
import { matchSemanticRule, DEFAULT_SEMANTIC_RULES } from './route-rules';
import type { SemanticRouteRule } from '../types/routing-types';
import type { Result } from '../contracts/results';
import { classifyRequest as classifyRequestPrompt } from './router-request-classifier';
import type { DowngradeCandidate, ProviderMetrics } from './downgrade-strategy';
import { RouterDecisionRecorder } from './router-decision-recorder';
import { RouterLatencyMonitor } from './router-latency-monitor';
import { RouterRankingService } from './router-ranking';
import { RouterFallbackResolver } from './router-fallback-resolver';
import { RouterDebateSelector } from './router-debate-selector';

export type {
    RequestIntent,
    RequestLanguage,
    RoutingStrategy,
    ScoringComponents,
    SkippedKeyEntry,
    DecisionOrigin,
    PipelineStep,
    RequestClassification,
    RouterDecision,
} from './router-types';

import type { RoutingStrategy, RouterDecision, DecisionOrigin } from './router-types';

export interface RouterServiceDeps {
    kernel: {
        getState: () => SystemState;
        setBaseWeights: (weights: RouterWeights) => void;
    };
    keyService: {
        getKeys: () => ApiKey[];
        getKey: (id: string) => ApiKey | undefined;
        getPoolKeys: (provider: string) => ApiKey[];
        selectFromPool: (provider: string) => ApiKey | undefined;
        selectWithBurst?: (provider: string) => ApiKey | undefined;
        canUseKey: (keyId: string) => { can: boolean; reason?: string };
        isKeyInBackoff: (keyId: string) => { backoff: boolean; remainingMs: number };
        isProviderCircuitOpen: (provider: string) => boolean;
        isProviderRateLimited: (provider: string) => boolean;
    };
    pricingService: {
        getPricingForModel: (model: string) => { input?: number; output?: number } | undefined;
    };
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        onSafe: <T>(event: string, cb: (data: T) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
    };
    budgetService: {
        canUseProvider: (provider: string) => boolean;
        getBudgetInfo: () => {
            providerBudgets: { provider: string; monthlyBudget: number; spentThisMonth: number }[];
        };
    };
    policyService: {
        checkAgentPolicy: (
            agentId: string,
            provider: string,
            model?: string,
        ) => { allowed: boolean; reason?: string };
    };
    sessionAffinityStore?: ISessionAffinityStore;
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    routingPolicyService: {
        getSnapshot: () => RoutingPolicySnapshot;
        preview: (input: RoutingPolicyPreviewInput) => RoutingPolicyPreview;
        getFallbackChain: (strategy: string) => FallbackLink[];
        setFallbackChain: (strategy: string, chain: FallbackLink[]) => void;
        getDowngradeChain: (model: string) => string[];
        setDowngradeChain: (model: string, chain: string[]) => void;
        getDowngradedModel: (model: string) => string | null;
        getDeepDowngradedModel: (model: string, steps: number) => string | null;
        calculateLatencyPenalty: (
            providerId: string,
            avgLatency: number,
            medianLatency: number,
        ) => number;
        calculateCostPenalty: (model: string, promptLength: number) => number;
        calculateBudgetPenalty: (
            provider: string,
            spentThisMonth: number,
            monthlyBudget: number,
        ) => number;
        recordPenalty: (provider: string, type: string, amount: number) => void;
        smartDowngrade?: (model: string, metrics: ProviderMetrics) => DowngradeCandidate | null;
        smartDowngradeDeep?: (
            model: string,
            metrics: ProviderMetrics,
            maxSteps?: number,
        ) => DowngradeCandidate | null;
    };
    keyStateStore?: IKeyStateStore;
}

/**
 * RouterService — SINGLE SOURCE OF TRUTH for live provider routing (B-21).
 *
 * All execution consumers (chat-executor, debate-query-engine, cognitive-service,
 * advisor/insight-engine, temporal-replay, counterfactual-engine) resolve providers
 * exclusively through `getRankedProviders(...)` (and the related `trySelectProvider` /
 * `resolveWithFallback` / `getDebateProviders` helpers). Its authoritative rule surface
 * is `config.semanticRouteRules` (via `trySelectProvider` → `matchSemanticRule`) plus the
 * `routingPolicyService` fallback/downgrade chains.
 *
 * NOTE: `SmartRoutingService` is a separate, simulation-only store (see its own JSDoc);
 * its rules do NOT affect routing here. This class is authoritative — do not add a second
 * routing-rule store or consult `SmartRoutingService` from the execution path.
 */
export class RouterService {
    private decisionHistory: RouterDecision[] = [];
    private simulationHistory: RouterDecision[] = [];
    private config: RouterConfig;
    private configManager: RouterConfigManager;
    private decisionRecorder: RouterDecisionRecorder;
    private latencyMonitor: RouterLatencyMonitor;
    private rankingService: RouterRankingService;
    private fallbackResolver: RouterFallbackResolver;
    private debateSelector: RouterDebateSelector;
    private deps: RouterServiceDeps;
    private _initialized = false;

    constructor(deps: RouterServiceDeps) {
        this.deps = deps;
        this.configManager = new RouterConfigManager({ database: deps.database });
        this.config = this.configManager.raw;
        this.decisionRecorder = new RouterDecisionRecorder({
            kernel: deps.kernel,
            keyService: deps.keyService,
            getActiveProfile: () => this.getActiveProfile(),
        });
        this.latencyMonitor = new RouterLatencyMonitor({
            eventBus: deps.eventBus,
            kernel: deps.kernel,
            getActiveProfile: () => this.getActiveProfile(),
        });
        this.rankingService = new RouterRankingService({
            kernel: deps.kernel,
            keyService: deps.keyService,
            budgetService: deps.budgetService,
            policyService: deps.policyService,
            routingPolicyService: deps.routingPolicyService,
            pricingService: deps.pricingService,
            eventBus: deps.eventBus,
            sessionAffinityStore: deps.sessionAffinityStore,
            keyStateStore: deps.keyStateStore,
            getConfig: () => this.config,
            decisionRecorder: this.decisionRecorder,
            classifyRequest: (prompt: string) => this.classifyRequest(prompt as string),
            resolveProfileForRequest: () => this.resolveProfileForRequest(),
            getActiveProfile: () => this.getActiveProfile(),
            decisionHistory: this.decisionHistory,
            simulationHistory: this.simulationHistory,
            maxDecisions: this.config.history.maxDecisions,
        });
        this.fallbackResolver = new RouterFallbackResolver({
            keyService: deps.keyService,
            budgetService: deps.budgetService,
            routingPolicyService: deps.routingPolicyService,
            decisionRecorder: this.decisionRecorder,
        });
        this.debateSelector = new RouterDebateSelector({
            keyService: deps.keyService,
            kernel: deps.kernel,
            keyStateStore: deps.keyStateStore,
            decisionRecorder: this.decisionRecorder,
        });
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        await this.configManager.init();
        this.config = this.configManager.raw;
        this.latencyMonitor.startMonitoring(this.config);
    }

    getActiveProfile(): WeightProfile {
        return this.configManager.getActiveProfile();
    }

    getConfig(): RouterConfig {
        return this.configManager.getConfig();
    }

    async updateConfig(partial: Partial<RouterConfig>): Promise<void> {
        await this.configManager.updateConfig(partial);
        this.config = this.configManager.raw;
    }

    getProfileNames(): string[] {
        return this.configManager.getProfileNames();
    }

    getProfile(name: string): WeightProfile | null {
        return this.configManager.getProfile(name);
    }

    async setProfile(name: string, profile: WeightProfile): Promise<void> {
        await this.configManager.setProfile(name, profile);
        this.config = this.configManager.raw;
        this.deps.eventBus.emit(EVENTS.SETTINGS_UPDATED, {
            settings: { router: this.config },
            changes: { profile: name },
        });
    }

    async deleteProfile(name: string): Promise<boolean> {
        const ok = await this.configManager.deleteProfile(name);
        if (ok) {
            this.config = this.configManager.raw;
            this.deps.eventBus.emit(EVENTS.SETTINGS_UPDATED, {
                settings: { router: this.config },
                changes: { deletedProfile: name },
            });
        }
        return ok;
    }

    async setActiveProfile(name: string): Promise<boolean> {
        const ok = await this.configManager.setActiveProfile(name);
        if (ok) {
            this.config = this.configManager.raw;
            this.deps.eventBus.emit(EVENTS.SETTINGS_UPDATED, {
                settings: { router: this.config },
                changes: { activeProfile: name },
            });
        }
        return ok;
    }

    async updateActiveProfileWeights(weights: {
        ttft: number;
        tps: number;
        reliability: number;
    }): Promise<void> {
        await this.configManager.updateActiveProfileWeights(weights);
        this.config = this.configManager.raw;
        this.deps.kernel.setBaseWeights(weights);
        this.deps.eventBus.emit(EVENTS.SETTINGS_UPDATED, {
            settings: { router: this.config },
            changes: { weights },
        });
    }

    async startABTest(control: string, experiment: string, splitPercent: number): Promise<boolean> {
        const ok = await this.configManager.startABTest(control, experiment, splitPercent);
        if (ok) {
            this.config = this.configManager.raw;
            this.deps.eventBus.emit(EVENTS.SETTINGS_UPDATED, {
                settings: { router: this.config },
                changes: { abTest: 'started' },
            });
        }
        return ok;
    }

    async stopABTest(): Promise<void> {
        await this.configManager.stopABTest();
        this.config = this.configManager.raw;
        this.deps.eventBus.emit(EVENTS.SETTINGS_UPDATED, {
            settings: { router: this.config },
            changes: { abTest: 'stopped' },
        });
    }

    getABTest(): ABTestConfig | null {
        return this.configManager.getABTest();
    }

    recordABTestResult(
        usedExperiment: boolean,
        latency: number,
        success: boolean,
        score: number,
    ): void {
        this.configManager.recordABTestResult(usedExperiment, latency, success, score);
    }

    resolveProfileForRequest(): string {
        return this.configManager.resolveProfileForRequest();
    }

    destroy(): void {
        this.latencyMonitor.stopMonitoring();
    }

    getProviderAvgLatency(provider: string): number {
        return this.latencyMonitor.getProviderAvgLatency(provider);
    }

    getLatencyBalancedWeights(): RouterWeights {
        return this.latencyMonitor.getLatencyBalancedWeights(this.config);
    }

    classifyRequest(prompt: string) {
        return classifyRequestPrompt(this.config.classification, prompt);
    }

    getDowngradeChain(model: string): string[] {
        return this.deps.routingPolicyService.getDowngradeChain(model);
    }

    getDowngradedModel(model: string): string | null {
        return this.deps.routingPolicyService.getDowngradedModel(model);
    }

    getDeepDowngradedModel(model: string, steps: number): string | null {
        return this.deps.routingPolicyService.getDeepDowngradedModel(model, steps);
    }

    smartDowngrade(model: string, metrics: ProviderMetrics) {
        return this.deps.routingPolicyService.smartDowngrade?.(model, metrics) ?? null;
    }

    smartDowngradeDeep(model: string, metrics: ProviderMetrics, maxSteps = 3) {
        return (
            this.deps.routingPolicyService.smartDowngradeDeep?.(model, metrics, maxSteps) ?? null
        );
    }

    trySelectProvider(
        prompt: string,
    ): Result<
        { provider: string; model: string; confidence: number; reasoning: string },
        { code: string; message: string }
    > {
        const cls = this.classifyRequest(prompt);
        const customRules: SemanticRouteRule[] =
            this.config.semanticRouteRules || DEFAULT_SEMANTIC_RULES;
        const match = matchSemanticRule(customRules, cls);
        if (match) {
            const confidence =
                cls.complexity === 'simple' ? 0.9 : cls.complexity === 'medium' ? 0.75 : 0.6;
            return {
                ok: true,
                value: {
                    provider: match.target.provider,
                    model: match.target.model || '',
                    confidence,
                    reasoning: `Semantic rule matched: ${match.label || match.id} (intent=${cls.intent}, lang=${cls.language})`,
                },
            };
        }
        try {
            const result = this.selectProviderByComplexity(prompt);
            return {
                ok: true,
                value: {
                    provider: result.provider,
                    model: result.model,
                    confidence: 0.5,
                    reasoning: 'Fallback to complexity-based routing',
                },
            };
        } catch (e) {
            return {
                ok: false,
                error: {
                    code: 'NO_MATCH',
                    message: `No semantic route matched: ${(e as Error).message || 'unknown'}`,
                },
            };
        }
    }

    selectProviderByComplexity(prompt: string): { provider: string; model: string } {
        const cls = this.classifyRequest(prompt);
        const pbc = this.config.providerByComplexity;
        if (cls.isMultimodal) return pbc.multimodal;
        if (cls.isLong) return pbc.long;
        if (cls.complexity === 'complex' && cls.isCode) return pbc.complexCode;
        if (cls.complexity === 'complex') return pbc.complex;
        if (cls.complexity === 'medium') return pbc.medium;
        return pbc.default;
    }

    getFallbackChain(strategy: RoutingStrategy): FallbackLink[] {
        return this.fallbackResolver.getFallbackChain(strategy);
    }

    resolveWithFallback(
        strategy: RoutingStrategy,
        excludeProviders?: Set<string> | string,
        excludeKeyId?: string,
    ): { key: ApiKey; provider: string } | null {
        return this.fallbackResolver.resolveWithFallback(strategy, excludeProviders, excludeKeyId);
    }

    getSelectionTrace(keyId?: string): readonly RouterDecision[] {
        return this.decisionRecorder.getSelectionTrace(keyId);
    }

    getRankedProviders(
        strategy: RoutingStrategy,
        prompt: string,
        priority: 'low' | 'normal' | 'high' = 'normal',
        agentId?: string,
        probeResults?: Map<string, ProbeResult>,
        overrideState?: SystemState,
        suppressEmit?: boolean,
        origin?: DecisionOrigin,
        sessionId?: string,
    ): ApiKey[] {
        return this.rankingService.getRankedProviders(
            strategy,
            prompt,
            priority,
            agentId,
            probeResults,
            overrideState,
            suppressEmit,
            origin,
            sessionId,
        );
    }

    getRaceCandidates(prompt: string): ApiKey[] {
        return this.getRankedProviders('race', prompt).slice(0, 2);
    }

    getRaceCandidateDetails(
        prompt: string,
    ): Array<{ provider: string; model: string; keyId: string }> {
        const cls = this.classifyRequest(prompt);
        const pbc = this.config.providerByComplexity;
        const ranked = this.getRankedProviders('race', prompt);
        return ranked.slice(0, 3).map((key) => {
            let model = key.model || '';
            if (!model) {
                if (cls.isMultimodal) model = pbc.multimodal.model;
                else if (cls.isLong) model = pbc.long.model;
                else if (cls.complexity === 'complex' && cls.isCode) model = pbc.complexCode.model;
                else if (cls.complexity === 'complex') model = pbc.complex.model;
                else if (cls.complexity === 'medium') model = pbc.medium.model;
                else model = pbc.default.model;
            }
            return { provider: key.provider, model, keyId: key.id };
        });
    }

    setStrategy(strategy: RoutingStrategy) {
        const w = this.getActiveProfile().strategyWeights[strategy];
        if (w) this.deps.kernel.setBaseWeights(w);
    }

    getCurrentAutoWeights() {
        return this.deps.kernel.getState().weights.effective;
    }

    getDecisionHistory(limit = 20): RouterDecision[] {
        return this.decisionHistory.slice(0, limit);
    }

    getLastDecision(): RouterDecision | undefined {
        return this.decisionHistory[0];
    }

    getSimulationDecision(): RouterDecision | undefined {
        return this.simulationHistory[0];
    }

    clearSimulation(): void {
        this.simulationHistory = [];
    }

    pushSimulationDecision(decision: RouterDecision): void {
        this.simulationHistory.unshift(decision);
        if (this.simulationHistory.length > (this.config.history?.maxDecisions ?? 100))
            this.simulationHistory.pop();
    }

    getStateSnapshotForSimulation(): SystemState {
        return structuredClone(this.deps.kernel.getState());
    }

    getDebateProviders(count: number): Array<{ provider: string; key: ApiKey }> {
        return this.debateSelector.getDebateProviders(count);
    }

    getProviderStats() {
        return this.debateSelector.getProviderStats();
    }

    setFallbackChain(strategy: string, chain: FallbackLink[]) {
        this.fallbackResolver.setFallbackChain(strategy, chain);
    }

    setDowngradeChain(model: string, chain: string[]) {
        this.fallbackResolver.setDowngradeChain(model, chain);
    }

    getRoutingPolicySurface(): RoutingPolicySnapshot {
        return this.fallbackResolver.getRoutingPolicySurface();
    }

    previewRoutingPolicy(input: RoutingPolicyPreviewInput): RoutingPolicyPreview {
        return this.fallbackResolver.previewRoutingPolicy(input);
    }

    getRawConfig(): RoutingPolicySnapshot & Pick<RouterConfig, 'activeProfile' | 'weightProfiles'> {
        return {
            ...this.getRoutingPolicySurface(),
            activeProfile: this.config.activeProfile,
            weightProfiles: this.config.weightProfiles,
        };
    }
}
