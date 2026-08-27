import type { SystemState } from '../types/metrics-types';
import type { RouterService, RouterDecision } from './provider-router';
import type { RoutingStrategy } from './router-types';
import type {
    ICounterfactualEngine,
    CounterfactualInput,
    CounterfactualResult,
    CounterfactualScoreDiff,
    CounterfactualOverride,
} from '../contracts/counterfactual';
import type { DecisionPayload } from '../events/system-events';

/** Apply overrides to a mutable SystemState snapshot */
function applyOverrides(state: SystemState, overrides: CounterfactualOverride): void {
    if (overrides.global?.providerHealth) {
        for (const [providerId, health] of Object.entries(overrides.global.providerHealth)) {
            const p = state.providers[providerId];
            if (!p) continue;
            if (health === 'offline') {
                p.status = 'offline';
                p.reliability = 0;
            } else if (health === 'degraded') {
                p.reliability = Math.min(p.reliability, 0.3);
            }
        }
    }

    if (overrides.keys) {
        for (const [providerId, ko] of Object.entries(overrides.keys)) {
            const p = state.providers[providerId];
            if (!p) continue;
            if (ko.rateLimited) p.reliability = 0;
            if (ko.latency !== undefined) p.avgTTFT = ko.latency;
            if (ko.health === 'broken') {
                p.status = 'offline';
                p.reliability = 0;
            } else if (ko.health === 'degraded') p.reliability = Math.min(p.reliability, 0.3);
        }
    }
}

function toDecisionPayload(decision: RouterDecision): DecisionPayload {
    const meta = decision as RouterDecision & { profile?: string; isExperiment?: boolean };
    return {
        requestId: decision.requestId,
        strategy: decision.strategy,
        classification: decision.classification,
        weights: decision.weights,
        selected: decision.selected,
        secondBest: decision.secondBest,
        scores: decision.scores.map((s) => ({
            p: s.provider,
            s: s.score.toFixed(3),
            c: s.components,
        })),
        skipped: decision.skipped,
        timestamp: decision.timestamp,
        profile: meta.profile,
        isExperiment: meta.isExperiment,
    };
}

function computeScoreDiffs(
    original: DecisionPayload,
    simulated: DecisionPayload,
): CounterfactualScoreDiff[] {
    const map = new Map<
        string,
        {
            orig?: number;
            sim?: number;
            origC?: Record<string, number>;
            simC?: Record<string, number>;
        }
    >();
    for (const s of original.scores) {
        map.set(s.p, { orig: parseFloat(s.s), origC: s.c as Record<string, number> | undefined });
    }
    for (const s of simulated.scores) {
        const existing = map.get(s.p);
        if (existing) {
            existing.sim = parseFloat(s.s);
            existing.simC = s.c as Record<string, number> | undefined;
        } else {
            map.set(s.p, { sim: parseFloat(s.s), simC: s.c as Record<string, number> | undefined });
        }
    }
    return Array.from(map.entries()).map(([provider, v]) => ({
        provider,
        originalScore: v.orig ?? 0,
        simulatedScore: v.sim ?? 0,
        delta: (v.sim ?? 0) - (v.orig ?? 0),
        ...(v.origC || v.simC
            ? {
                  components: { original: v.origC ?? {}, simulated: v.simC ?? {} },
              }
            : {}),
    }));
}

export class CounterfactualEngine implements ICounterfactualEngine {
    constructor(private routerService: RouterService) {}

    run(input: CounterfactualInput): CounterfactualResult {
        const start = performance.now();
        try {
            this.routerService.clearSimulation();

            const original = toDecisionPayload({
                requestId: input.baseTrace.decision.requestId ?? 'simulated',
                strategy: input.baseTrace.decision.strategy as RoutingStrategy,
                classification: input.baseTrace.decision
                    .classification as unknown as RouterDecision['classification'],
                weights: input.baseTrace.decision.weights as RouterDecision['weights'],
                selected: input.baseTrace.decision.selected ?? '',
                secondBest: input.baseTrace.decision.secondBest ?? null,
                scores: input.baseTrace.decision.scores as unknown as RouterDecision['scores'],
                skipped: input.baseTrace.decision.skipped as unknown as RouterDecision['skipped'],
                timestamp: input.baseTrace.decision.timestamp ?? Date.now(),
                promptLength: input.baseTrace.decision.promptLength ?? 0,
                estimatedCost: input.baseTrace.decision.estimatedCost ?? 0,
                steps: [],
                origin: 'simulation',
            });

            const simState = this.routerService.getStateSnapshotForSimulation();
            applyOverrides(simState, input.overrides);

            this.routerService.getRankedProviders(
                (input.overrides.global?.strategy ?? original.strategy) as Parameters<
                    RouterService['getRankedProviders']
                >[0],
                input.prompt ?? '',
                'normal',
                undefined,
                undefined,
                simState,
                true,
                'simulation',
            );

            const simDecision = this.routerService.getSimulationDecision();
            if (!simDecision) {
                return {
                    requestId: original.requestId,
                    original,
                    simulated: original,
                    scoreDiffs: [],
                    switchProvider: false,
                    meta: {
                        durationMs: performance.now() - start,
                        overridesApplied: input.overrides,
                    },
                };
            }

            const simulated = toDecisionPayload(simDecision);
            const scoreDiffs = computeScoreDiffs(original, simulated);
            const switchProvider = original.selected !== simulated.selected;
            let switchReason: string | undefined;
            if (switchProvider) {
                const changed = scoreDiffs.find(
                    (s) => s.provider === simulated.selected && s.delta > 0,
                );
                const dropped = scoreDiffs.find(
                    (s) => s.provider === original.selected && s.delta < 0,
                );
                switchReason = `${original.selected} → ${simulated.selected}`;
                if (dropped)
                    switchReason += ` (${original.selected} Δ${dropped.delta > 0 ? '+' : ''}${dropped.delta.toFixed(3)})`;
                if (changed)
                    switchReason += ` (${simulated.selected} Δ${changed.delta > 0 ? '+' : ''}${changed.delta.toFixed(3)})`;
            }

            return {
                requestId: original.requestId,
                original,
                simulated,
                scoreDiffs,
                switchProvider,
                switchReason,
                meta: { durationMs: performance.now() - start, overridesApplied: input.overrides },
            };
        } finally {
            this.routerService.clearSimulation();
        }
    }
}
