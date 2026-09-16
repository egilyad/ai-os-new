import type { ApiKey, SystemState } from '../types/metrics-types';
import type { RouterConfig, WeightProfile } from '../types/routing-types';
import type { ProbeResult } from '../contracts/probe';
import type { IKeyStateStore } from '../contracts/key-state';
import type { ISessionAffinityStore } from '../contracts/session-affinity';
import { EVENTS } from '../events/event-names';
import { RouterDecisionRecorder } from './router-decision-recorder';
import {
    getEffectiveWeights,
    calculateProviderScore,
    getContentAffinity,
    estimateRequestCost,
} from './router-scoring';
import type {
    RoutingStrategy,
    SkippedKeyEntry,
    PipelineStep,
    RouterDecision,
    DecisionOrigin,
    RequestClassification,
} from './router-types';

export interface RankingDeps {
    kernel: {
        getState: () => SystemState;
    };
    keyService: {
        getKeys: () => ApiKey[];
        canUseKey: (keyId: string) => { can: boolean; reason?: string };
        isKeyInBackoff: (keyId: string) => { backoff: boolean; remainingMs: number };
        isProviderCircuitOpen: (provider: string) => boolean;
        isProviderRateLimited: (provider: string) => boolean;
    };
    budgetService: {
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
    routingPolicyService: {
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
    };
    pricingService: {
        getPricingForModel: (model: string) => { input?: number; output?: number } | undefined;
    };
    eventBus: {
        emit: (event: string, data?: unknown) => void;
    };
    sessionAffinityStore?: ISessionAffinityStore;
    keyStateStore?: IKeyStateStore;
    getConfig: () => RouterConfig;
    decisionRecorder: RouterDecisionRecorder;
    classifyRequest: (prompt: string) => RequestClassification;
    resolveProfileForRequest: () => string;
    getActiveProfile: () => WeightProfile;
    decisionHistory: RouterDecision[];
    simulationHistory: RouterDecision[];
    maxDecisions: number;
}

export class RouterRankingService {
    constructor(private deps: RankingDeps) {}

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
        const state = overrideState ?? this.deps.kernel.getState();
        const allKeys = this.deps.keyService.getKeys();

        // Session affinity: if session is bound to a specific key, prefer it
        let hadExistingBinding = false;
        if (sessionId && this.deps.sessionAffinityStore) {
            const binding = this.deps.sessionAffinityStore.getBoundKey(sessionId);
            if (binding) {
                hadExistingBinding = true;
                const boundKey = allKeys.find((k) => k.id === binding.keyId);
                if (boundKey) {
                    const ks = this.deps.keyStateStore?.get(boundKey.id);
                    const healthOk = ks
                        ? ks.healthScore >= 75 &&
                          !ks.flags.circuitOpen &&
                          !ks.flags.rateLimited &&
                          !ks.flags.authFailed
                        : boundKey.status === 'active' &&
                          !this.deps.keyService.isKeyInBackoff(boundKey.id).backoff &&
                          !this.deps.keyService.isProviderCircuitOpen(boundKey.provider) &&
                          !this.deps.keyService.isProviderRateLimited(boundKey.provider);
                    if (healthOk) {
                        return [boundKey];
                    }
                }
                // Bound key is unhealthy — try another key from the same provider first
                const sameProvider = allKeys.filter((k) => {
                    if (
                        k.provider.toLowerCase() !== binding.provider.toLowerCase() ||
                        k.id === binding.keyId
                    )
                        return false;
                    const kks = this.deps.keyStateStore?.get(k.id);
                    return kks
                        ? kks.healthScore >= 75 &&
                              !kks.flags.circuitOpen &&
                              !kks.flags.rateLimited &&
                              !kks.flags.authFailed
                        : k.status === 'active' &&
                              !this.deps.keyService.isKeyInBackoff(k.id).backoff &&
                              !this.deps.keyService.isProviderCircuitOpen(k.provider) &&
                              !this.deps.keyService.isProviderRateLimited(k.provider);
                });
                if (sameProvider.length > 0) {
                    this.deps.sessionAffinityStore.bind(
                        sessionId,
                        sameProvider[0]!.id,
                        sameProvider[0]!.provider,
                    );
                    return [sameProvider[0]!];
                }
                // No same-provider key available — evict and fall through to normal routing
                this.deps.sessionAffinityStore.unbind(sessionId);
            }
        }

        const skipped: SkippedKeyEntry[] = [];
        const activeKeys = allKeys.filter((k) => {
            const ks = this.deps.keyStateStore?.get(k.id);
            if (ks) {
                const flagReasons: string[] = [];
                if (ks.flags.circuitOpen) flagReasons.push('Circuit breaker open');
                if (ks.flags.rateLimited) flagReasons.push('Rate limited');
                if (ks.flags.authFailed) flagReasons.push('Auth failed');
                if (ks.healthScore < 75) flagReasons.push(`Health score: ${ks.healthScore}/100`);
                if (flagReasons.length > 0) {
                    skipped.push({
                        provider: k.provider,
                        keyLabel: k.label,
                        keyId: k.id,
                        reason: flagReasons.join('; '),
                        stage: ks.flags.circuitOpen
                            ? 'circuit'
                            : ks.flags.rateLimited
                              ? 'ratelimit'
                              : 'status',
                    });
                    return false;
                }
            } else {
                // Legacy fallback when KeyStateStore is not available
                if (k.status !== 'active') {
                    skipped.push({
                        provider: k.provider,
                        keyLabel: k.label,
                        keyId: k.id,
                        reason: `Status: ${k.status}`,
                        stage: 'status',
                    });
                    return false;
                }
                const backoff = this.deps.keyService.isKeyInBackoff(k.id);
                if (backoff.backoff) {
                    skipped.push({
                        provider: k.provider,
                        keyLabel: k.label,
                        keyId: k.id,
                        reason: `Exponential backoff: ${backoff.remainingMs}ms remaining`,
                        stage: 'backoff',
                    });
                    return false;
                }
                if (this.deps.keyService.isProviderCircuitOpen(k.provider)) {
                    skipped.push({
                        provider: k.provider,
                        keyLabel: k.label,
                        keyId: k.id,
                        reason: 'Circuit breaker open — provider temporarily disabled',
                        stage: 'circuit',
                    });
                    return false;
                }
                if (this.deps.keyService.isProviderRateLimited(k.provider)) {
                    skipped.push({
                        provider: k.provider,
                        keyLabel: k.label,
                        keyId: k.id,
                        reason: 'Rate limit threshold reached — tokens exhausted',
                        stage: 'ratelimit',
                    });
                    return false;
                }
                // Probe eligibility check (legacy path)
                if (probeResults) {
                    const probe = probeResults.get(k.id);
                    if (probe && (probe.status === 'broken' || probe.status === 'limited')) {
                        skipped.push({
                            provider: k.provider,
                            keyLabel: k.label,
                            keyId: k.id,
                            reason: `Probe: ${probe.status} — ${probe.error || 'not eligible'}`,
                            stage: 'unavailable',
                        });
                        return false;
                    }
                }
            }
            return true;
        });
        let keys = activeKeys;
        if (keys.length === 0) {
            // Grace fallback: allow degraded/limited keys with penalty
            keys = allKeys.filter((k) => {
                const ks = this.deps.keyStateStore?.get(k.id);
                if (ks) {
                    if (ks.healthScore < 25) {
                        skipped.push({
                            provider: k.provider,
                            keyLabel: k.label,
                            keyId: k.id,
                            reason: `Fallback skipped — health score ${ks.healthScore}/100`,
                            stage: 'status',
                        });
                        return false;
                    }
                } else {
                    if (k.status === 'error') {
                        skipped.push({
                            provider: k.provider,
                            keyLabel: k.label,
                            keyId: k.id,
                            reason: `Fallback skipped — Status: ${k.status}`,
                            stage: 'status',
                        });
                        return false;
                    }
                    const backoff = this.deps.keyService.isKeyInBackoff(k.id);
                    if (backoff.backoff) {
                        skipped.push({
                            provider: k.provider,
                            keyLabel: k.label,
                            keyId: k.id,
                            reason: `Fallback skipped — backoff ${backoff.remainingMs}ms`,
                            stage: 'backoff',
                        });
                        return false;
                    }
                }
                return true;
            });
        }

        const filteredByPolicy = agentId
            ? keys.filter((k) => {
                  const p = this.deps.policyService.checkAgentPolicy(agentId, k.provider, k.model);
                  if (!p.allowed) {
                      skipped.push({
                          provider: k.provider,
                          keyLabel: k.label,
                          keyId: k.id,
                          reason: p.reason || 'Blocked by policy',
                          stage: 'policy',
                      });
                      return false;
                  }
                  return true;
              })
            : keys;
        if (agentId && filteredByPolicy.length === 0) {
            this.deps.decisionRecorder.recordDecision({ strategy, skipped, selected: '', prompt });
            return [];
        }

        keys = agentId ? filteredByPolicy : keys;

        if (strategy === 'free_first') {
            const freeKeys = keys.filter((k) => k.tags?.some((t) => t === 'tier:free'));
            const paidKeys = keys.filter((k) => !k.tags?.some((t) => t === 'tier:free'));
            const usableFree = freeKeys.filter((k) => {
                const u = this.deps.keyService.canUseKey(k.id);
                if (!u.can)
                    skipped.push({
                        provider: k.provider,
                        keyLabel: k.label,
                        keyId: k.id,
                        reason: u.reason || 'Quota exhausted',
                        stage: 'quota',
                    });
                return u.can;
            });
            if (usableFree.length > 0) {
                this.deps.decisionRecorder.recordDecision({
                    strategy,
                    skipped,
                    selected: usableFree[0]!.provider,
                    prompt,
                });
                return usableFree;
            }
            const usablePaid = paidKeys.filter((k) => {
                const u = this.deps.keyService.canUseKey(k.id);
                if (!u.can)
                    skipped.push({
                        provider: k.provider,
                        keyLabel: k.label,
                        keyId: k.id,
                        reason: u.reason || 'Quota exhausted',
                        stage: 'quota',
                    });
                return u.can;
            });
            this.deps.decisionRecorder.recordDecision({
                strategy,
                skipped,
                selected: usablePaid[0]?.provider || '',
                prompt,
            });
            return usablePaid;
        }

        const usedProfile = this.deps.resolveProfileForRequest();
        const profile =
            this.deps.getConfig().weightProfiles[usedProfile] || this.deps.getActiveProfile();
        const weights = getEffectiveWeights(strategy, prompt, state, profile);
        const cls = this.deps.classifyRequest(prompt);

        const providerLats = new Map<string, number>();
        for (const key of keys) {
            const pid = key.provider.toLowerCase();
            const avg = state.providers[pid]?.avgTTFT || 0;
            providerLats.set(pid, avg);
        }
        const latValues = [...providerLats.values()].sort((a, b) => a - b);
        const medianLat =
            latValues.length % 2 === 0
                ? (latValues[latValues.length / 2 - 1]! + latValues[latValues.length / 2]!) / 2
                : latValues[Math.floor(latValues.length / 2)] || 0;

        const sc = profile.scoring;

        const rankedItems = [...keys]
            .map((key) => {
                const providerId = key.provider.toLowerCase();
                const m = state.providers[providerId];
                const rawScore = m ? calculateProviderScore(providerId, state, weights, sc) : 0.2;
                if (!m || rawScore <= 0) {
                    skipped.push({
                        provider: key.provider,
                        keyLabel: key.label,
                        keyId: key.id,
                        reason: !m ? 'No provider metrics' : `Score floor (${rawScore.toFixed(2)})`,
                        stage: 'score',
                    });
                }
                const keyReputationBonus =
                    ((key.stats?.extended?.reputationScore || 100) / 100) * sc.keyReputationBonus;
                const totalPulls = (key.stats?.successCount || 0) + (key.stats?.errorCount || 0);
                const explorationBonus =
                    state.totalRequests > 0
                        ? state.explorationFactor *
                          Math.sqrt(Math.log(state.totalRequests) / Math.max(1, totalPulls))
                        : 0.2;
                const costPenalty = strategy === 'cost' ? this.getCostPenalty(key, prompt) : 0;
                const budgetPenalty = this.getBudgetPenalty(providerId);
                const affinityBonus = getContentAffinity(
                    this.deps.getConfig().affinity,
                    providerId,
                    cls,
                    prompt,
                );
                const prioCfg = this.deps.getConfig().priority;
                const priorityBonus =
                    priority === 'high'
                        ? prioCfg.high[providerId] || 0
                        : priority === 'low'
                          ? prioCfg.low[providerId] || 0
                          : 0;
                const provLat = providerLats.get(providerId) || 0;
                const latencyPenalty = this.deps.routingPolicyService.calculateLatencyPenalty(
                    providerId,
                    provLat,
                    medianLat,
                );
                return {
                    key,
                    score:
                        rawScore +
                        explorationBonus +
                        keyReputationBonus +
                        affinityBonus +
                        priorityBonus -
                        costPenalty -
                        latencyPenalty -
                        budgetPenalty,
                    components: {
                        raw: rawScore,
                        stabilityBonus: 0,
                        reputationBonus: 0,
                        explorationBonus,
                        keyReputationBonus,
                        affinityBonus,
                        priorityBonus,
                        costPenalty,
                        latencyPenalty,
                        budgetPenalty,
                    },
                };
            })
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score);

        const decisionOrigin = origin ?? 'live';

        if (rankedItems.length > 0) {
            const blockedSteps: PipelineStep[] = [];
            for (const s of skipped) {
                if (
                    s.stage === 'status' ||
                    s.stage === 'circuit' ||
                    s.stage === 'ratelimit' ||
                    s.stage === 'backoff'
                ) {
                    blockedSteps.push({
                        name:
                            s.stage === 'circuit'
                                ? 'circuit:check'
                                : s.stage === 'ratelimit'
                                  ? 'ratelimit:check'
                                  : s.stage === 'backoff'
                                    ? 'backoff:check'
                                    : 'provider:check',
                        status: 'blocked' as const,
                        provider: s.provider,
                        detail: s.reason,
                    });
                } else if (s.stage === 'policy' && agentId) {
                    blockedSteps.push({
                        name: 'policy:check',
                        status: 'blocked' as const,
                        provider: s.provider,
                        detail: s.reason,
                    });
                } else if (s.stage === 'quota') {
                    blockedSteps.push({
                        name: 'quota:check',
                        status: 'blocked' as const,
                        provider: s.provider,
                        detail: s.reason,
                    });
                } else if (s.stage === 'budget') {
                    blockedSteps.push({
                        name: 'budget:check',
                        status: 'blocked' as const,
                        provider: s.provider,
                        detail: s.reason,
                    });
                }
            }
            const steps: PipelineStep[] = [
                {
                    name: 'providers:scan',
                    status: 'passed',
                    detail: `Scanned ${allKeys.length} keys`,
                },
                ...blockedSteps,
                { name: 'scoring', status: 'passed', detail: `${rankedItems.length} keys scored` },
                {
                    name: 'selection',
                    status: 'passed',
                    provider: rankedItems[0]!.key.provider,
                    detail: `Score: ${rankedItems[0]!.score.toFixed(3)}`,
                },
            ];

            const decision: RouterDecision = {
                requestId: crypto.randomUUID(),
                strategy,
                classification: cls,
                weights,
                selected: rankedItems[0]!.key.provider,
                secondBest: rankedItems[1]?.key.provider || null,
                scores: rankedItems.slice(0, 3).map((i) => ({
                    provider: i.key.provider,
                    score: i.score,
                    components: i.components,
                })),
                skipped,
                steps,
                timestamp: Date.now(),
                promptLength: prompt.length,
                estimatedCost: estimateRequestCost(rankedItems[0]!.key, prompt, (model) =>
                    this.deps.pricingService.getPricingForModel(model),
                ),
                origin: decisionOrigin,
            };

            if (decisionOrigin === 'live') {
                this.deps.decisionHistory.unshift(decision);
                if (this.deps.decisionHistory.length > this.deps.maxDecisions)
                    this.deps.decisionHistory.pop();
            } else {
                this.deps.simulationHistory.unshift(decision);
                if (this.deps.simulationHistory.length > this.deps.maxDecisions)
                    this.deps.simulationHistory.pop();
            }

            const isExperiment = usedProfile !== this.deps.getConfig().activeProfile;
            if (!suppressEmit && decisionOrigin === 'live')
                this.deps.eventBus.emit(EVENTS.DECISION, {
                    requestId: decision.requestId,
                    strategy,
                    classification: cls,
                    weights,
                    selected: decision.selected,
                    secondBest: decision.secondBest,
                    scores: decision.scores.map((s) => ({
                        p: s.provider,
                        s: s.score.toFixed(3),
                        c: s.components,
                    })),
                    skipped: skipped.map((s) => ({
                        provider: s.provider,
                        keyLabel: s.keyLabel,
                        keyId: s.keyId,
                        reason: s.reason,
                        stage: s.stage,
                    })),
                    timestamp: Date.now(),
                    profile: usedProfile,
                    isExperiment,
                });
        }

        // Shadow mode: compare with KeyStateStore routing (live only)
        if (decisionOrigin === 'live' && this.deps.keyStateStore && rankedItems.length > 0) {
            const selectedKey = rankedItems[0]!.key;
            const shadow = this.deps.keyStateStore.getForRouting();
            const shadowTop = shadow[0];
            if (
                shadowTop &&
                (shadowTop.id !== selectedKey.id || shadowTop.provider !== selectedKey.provider)
            ) {
                this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `[Shadow] KeyState would route to ${shadowTop.provider}/${shadowTop.label} (id=${shadowTop.id}), legacy picked ${selectedKey.provider}/${selectedKey.label}`,
                    type: 'info',
                    source: 'router-shadow',
                });
            }
        }

        // Initial session-key binding: create on first key selection
        if (
            sessionId &&
            this.deps.sessionAffinityStore &&
            !hadExistingBinding &&
            rankedItems.length > 0
        ) {
            const topKey = rankedItems[0]!.key;
            this.deps.sessionAffinityStore.bind(sessionId, topKey.id, topKey.provider);
        }

        return rankedItems.map((item) => item.key);
    }

    // C-78: removed deduplicateCandidates — return ALL usable keys ranked by score
    // so callers can fall through multiple keys per provider if the first fails

    private getBudgetPenalty(provider: string): number {
        const info = this.deps.budgetService.getBudgetInfo();
        const provInfo = info.providerBudgets.find((p) => p.provider === provider);
        if (!provInfo) return 0;
        return this.deps.routingPolicyService.calculateBudgetPenalty(
            provider,
            provInfo.spentThisMonth,
            provInfo.monthlyBudget,
        );
    }

    private getCostPenalty(key: ApiKey, prompt: string): number {
        return this.deps.routingPolicyService.calculateCostPenalty(
            key.model || 'auto',
            prompt.length,
        );
    }
}
