import type { ILifecycle } from '../../contracts/lifecycle';
import type {
    IWhatIfService,
    BudgetWhatIf,
    ProviderWhatIf,
    StrategyWhatIf,
    PolicyDryRunResult,
    SimulationRecord,
} from '../../contracts/whatif-service';
import type { TopologyWhatIf } from '../../contracts/cognitive-intelligence';
import type { ISPolicy } from '../policy-service';
import { CONFIG } from '../config-registry';
import { EVENTS } from '../../events/event-names';

const MAX_HISTORY = CONFIG?.services?.whatif?.maxHistory ?? 200;

export interface WhatIfServiceDeps {
    eventBus: { emit: (event: string, data?: unknown) => void };
    cognitiveIntelligenceService: {
        simulateTopologyChange: (
            sessionId: string,
            proposedType: string,
        ) => TopologyWhatIf | undefined;
        simulateParticipantChange: (
            sessionId: string,
            additionalAgents: number,
        ) =>
            | {
                  estimatedQualityChange: number;
                  estimatedCostIncrease: number;
                  estimatedRoundsIncrease: number;
                  recommendation: string;
              }
            | undefined;
    };
    debateEngine?: {
        getSession: (sessionId: string) => { session?: { budget?: number } } | undefined;
        getAllSessions: () => Array<{
            agentStates: Array<{
                nodeId: string;
                latency: number;
                tokensUsed: number;
                agentId: string;
            }>;
        }>;
    };
    keyService?: {
        getKeys: () => Array<{ provider: string; latency?: number; status: string }>;
    };
}

export class WhatIfService implements ILifecycle, IWhatIfService {
    private history: SimulationRecord[] = [];
    private seq = 0;
    private deps: WhatIfServiceDeps;

    constructor(deps: WhatIfServiceDeps) {
        this.deps = deps;
    }

    async init() {}
    async destroy() {
        this.history = [];
    }

    async simulateTopologyChange(
        sessionId: string,
        proposedType: string,
    ): Promise<TopologyWhatIf | undefined> {
        const result = this.deps.cognitiveIntelligenceService.simulateTopologyChange(
            sessionId,
            proposedType,
        );
        if (result) {
            this.record('topology', { sessionId, proposedType }, result);
        }
        this.deps.eventBus.emit(EVENTS.WHATIF_SIMULATION_COMPLETED, {
            type: 'topology',
            sessionId,
            proposedType,
            hasResult: !!result,
        });
        return result;
    }

    async simulateParticipantChange(sessionId: string, additionalAgents: number) {
        const result = this.deps.cognitiveIntelligenceService.simulateParticipantChange(
            sessionId,
            additionalAgents,
        );
        if (result) {
            this.record('participant', { sessionId, additionalAgents }, result);
        }
        this.deps.eventBus.emit(EVENTS.WHATIF_SIMULATION_COMPLETED, {
            type: 'participant',
            sessionId,
            additionalAgents,
            hasResult: !!result,
        });
        return result;
    }

    async simulateBudgetChange(
        sessionId: string,
        proposedBudget: number,
    ): Promise<BudgetWhatIf | undefined> {
        const currentBudget =
            this.deps?.debateEngine?.getSession(sessionId)?.session?.budget ?? 100_000;
        const ratio = proposedBudget / currentBudget;
        const estimatedRoundsChange = Math.round((ratio - 1) * 10);
        const estimatedTokenChange = Math.round(currentBudget * (ratio - 1));
        const pressureImpact =
            ratio > 1.2
                ? ('decrease' as const)
                : ratio < 0.8
                  ? ('increase' as const)
                  : ('unchanged' as const);

        const result: BudgetWhatIf = {
            currentBudget,
            proposedBudget,
            estimatedRoundsChange,
            estimatedTokenChange,
            pressureImpact,
            recommendation:
                ratio < 0.5
                    ? 'Budget too low — pressure will likely reach critical'
                    : ratio > 2
                      ? 'Large budget — consider phased allocation'
                      : 'Budget change is within acceptable range',
        };
        this.record('budget', { sessionId, proposedBudget }, result);
        this.deps.eventBus.emit(EVENTS.WHATIF_SIMULATION_COMPLETED, {
            type: 'budget',
            sessionId,
            proposedBudget,
            currentBudget,
            ratio,
        });
        return result;
    }

    async simulateProviderChange(
        currentProvider: string,
        proposedProvider: string,
    ): Promise<ProviderWhatIf> {
        const currentKeys =
            this.deps?.keyService?.getKeys()?.filter((k) => k.provider === currentProvider) || [];
        const proposedKeys =
            this.deps?.keyService?.getKeys()?.filter((k) => k.provider === proposedProvider) || [];
        const currentLat =
            currentKeys.reduce((s, k) => s + (k.latency || 500), 0) /
            Math.max(1, currentKeys.length);
        const proposedLat =
            proposedKeys.reduce((s, k) => s + (k.latency || 500), 0) /
            Math.max(1, proposedKeys.length);
        const latencyImpact =
            Math.round(((proposedLat - currentLat) / Math.max(1, currentLat)) * 100) / 100;
        const costImpact = Math.round((proposedKeys.length > 0 ? 0.05 : 0.15) * 100) / 100;
        const reliabilityImpact =
            Math.round(
                (proposedKeys.filter((k) => k.status === 'active').length /
                    Math.max(1, proposedKeys.length) -
                    0.85) *
                    100,
            ) / 100;

        const recommendation =
            reliabilityImpact < -0.1
                ? `${proposedProvider} may have lower reliability — monitor closely`
                : costImpact > 0.3
                  ? `${proposedProvider} may increase costs significantly`
                  : `${proposedProvider} is a viable alternative`;

        const result: ProviderWhatIf = {
            currentProvider,
            proposedProvider,
            latencyImpact,
            costImpact,
            reliabilityImpact,
            recommendation,
        };
        this.record('provider', { currentProvider, proposedProvider }, result);
        this.deps.eventBus.emit(EVENTS.WHATIF_SIMULATION_COMPLETED, {
            type: 'provider',
            currentProvider,
            proposedProvider,
            latencyImpact,
            costImpact,
            reliabilityImpact,
        });
        return result;
    }

    async simulateStrategyChange(
        currentStrategy: string,
        proposedStrategy: string,
    ): Promise<StrategyWhatIf> {
        const strategyQuality: Record<string, number> = {
            latency: 0.6,
            reliability: 0.8,
            balanced: 0.7,
            cost: 0.5,
            race: 0.4,
            broadcast: 0.3,
        };
        const strategyLatency: Record<string, number> = {
            latency: 200,
            reliability: 800,
            balanced: 500,
            cost: 1000,
            race: 150,
            broadcast: 600,
        };
        const strategyCost: Record<string, number> = {
            latency: 1.0,
            reliability: 1.5,
            balanced: 1.0,
            cost: 0.5,
            race: 1.2,
            broadcast: 3.0,
        };

        const currentQuality = strategyQuality[currentStrategy] || 0.5;
        const proposedQuality = strategyQuality[proposedStrategy] || 0.5;
        const estimatedQualityChange = Math.round((proposedQuality - currentQuality) * 100) / 100;
        const estimatedLatencyChange =
            (strategyLatency[proposedStrategy] || 500) - (strategyLatency[currentStrategy] || 500);
        const estimatedCostChange = Math.round(
            ((strategyCost[proposedStrategy] || 1) / (strategyCost[currentStrategy] || 1) - 1) *
                100,
        );

        const recs: string[] = [];
        if (estimatedLatencyChange > 200) recs.push('Latency may increase significantly');
        if (estimatedCostChange > 50) recs.push(`Cost may increase ~${estimatedCostChange}%`);
        if (estimatedQualityChange > 0) recs.push('Quality may improve');

        const result: StrategyWhatIf = {
            currentStrategy,
            proposedStrategy,
            estimatedQualityChange,
            estimatedLatencyChange,
            estimatedCostChange,
            recommendation: recs.join('; ') || 'No significant impact expected',
        };
        this.record('strategy', { currentStrategy, proposedStrategy }, result);
        this.deps.eventBus.emit(EVENTS.WHATIF_SIMULATION_COMPLETED, {
            type: 'strategy',
            currentStrategy,
            proposedStrategy,
            estimatedQualityChange,
            estimatedLatencyChange,
            estimatedCostChange,
        });
        return result;
    }

    async simulatePolicyDryRun(proposedPolicy: ISPolicy): Promise<PolicyDryRunResult> {
        let violationsCount = 0;
        let blockedRequestsCount = 0;
        let severityLevel: 'info' | 'warning' | 'error' | 'critical' = 'info';
        let projectedImpact: string;
        const blockedNodes: string[] = [];

        // B10-65: Use real agent state data from debate engine instead of hardcoded mocks
        const realNodes: Array<{
            id: string;
            latency: number;
            cost: number;
            content: string;
            model: string;
        }> = [];
        if (this.deps.debateEngine) {
            for (const snap of this.deps.debateEngine.getAllSessions()) {
                for (const state of snap.agentStates) {
                    realNodes.push({
                        id: state.nodeId,
                        latency: state.latency,
                        cost: state.tokensUsed * 0.00001, // approximate cost from token count
                        content: `agent:${state.agentId} node:${state.nodeId}`,
                        model: state.agentId,
                    });
                }
            }
        }
        const nodes =
            realNodes.length > 0
                ? realNodes
                : [
                      // Fallback only when no real sessions exist
                      {
                          id: 'node_1',
                          latency: 850,
                          cost: 0.012,
                          content: 'standard hello message',
                          model: 'gpt-4o-mini',
                      },
                      {
                          id: 'node_2',
                          latency: 2200,
                          cost: 0.065,
                          content: 'toxic_content or explicit stuff',
                          model: 'claude-3-opus',
                      },
                      {
                          id: 'node_3',
                          latency: 1500,
                          cost: 0.008,
                          content: 'my email is secure@gmail.com',
                          model: 'gemini-3.1-flash-lite',
                      },
                      {
                          id: 'node_4',
                          latency: 4500,
                          cost: 0.12,
                          content: 'complex code architecture logic',
                          model: 'llama-3.1-405b',
                      },
                      {
                          id: 'node_5',
                          latency: 950,
                          cost: 0.005,
                          content: 'simple reply',
                          model: 'groq',
                      },
                  ];

        if (proposedPolicy.type === 'latency') {
            const limit = proposedPolicy.value as number;
            const violating = nodes.filter((n) => n.latency > limit);
            violationsCount = violating.length;
            if (proposedPolicy.action === 'block') {
                blockedRequestsCount = violating.length;
                blockedNodes.push(...violating.map((n) => n.id));
            }
            severityLevel = limit < 1500 ? 'critical' : 'warning';
            projectedImpact =
                `Proposed latency limit of ${limit}ms would flag ${violationsCount} out of ${nodes.length} active sessions. ` +
                (proposedPolicy.action === 'block'
                    ? `Crucially, this would block requests on nodes: ${blockedNodes.join(', ')}.`
                    : `This is a warning policy, so execution continues uninterrupted but flags observability traces.`);
        } else if (proposedPolicy.type === 'privacy') {
            const violating = nodes.filter(
                (n) => n.content.includes('@') || n.content.includes('gmail.com'),
            );
            violationsCount = violating.length;
            if (proposedPolicy.action === 'block') {
                blockedRequestsCount = violating.length;
                blockedNodes.push(...violating.map((n) => n.id));
            }
            severityLevel = 'error';
            projectedImpact =
                `Proposed privacy checks would trigger ${violationsCount} violation warnings for personal identifiers (PII). ` +
                (proposedPolicy.action === 'block'
                    ? `Active execution would block secure data flows on: ${blockedNodes.join(', ')}.`
                    : `PII warnings will be logged synchronously in observability traces.`);
        } else if (proposedPolicy.type === 'content') {
            const violating = nodes.filter((n) => n.content.includes('toxic_content'));
            violationsCount = violating.length;
            if (proposedPolicy.action === 'block') {
                blockedRequestsCount = violating.length;
                blockedNodes.push(...violating.map((n) => n.id));
            }
            severityLevel = 'warning';
            projectedImpact =
                `Content safety analysis would identify ${violationsCount} matches for toxic or safety-sensitive patterns. ` +
                (proposedPolicy.action === 'block'
                    ? `Requests on nodes [${blockedNodes.join(', ')}] will be terminated.`
                    : `Triggered items will be masked or rewritten.`);
        } else if (proposedPolicy.type === 'cost') {
            const cap = proposedPolicy.value as number;
            const violating = nodes.filter((n) => n.cost > cap);
            violationsCount = violating.length;
            severityLevel = 'warning';
            projectedImpact =
                `Proposed cost policy threshold of $${cap} per transaction would trigger warnings on ${violationsCount} nodes. ` +
                `Model ${violating.map((n) => n.model).join(', ')} exceed this limit.`;
        } else {
            projectedImpact = `Proposed custom policy has minor operational footprint. No active disruptions expected.`;
        }

        const result: PolicyDryRunResult = {
            violationsCount,
            blockedRequestsCount,
            severityLevel,
            projectedImpact,
            blockedNodes,
        };
        this.record('policy_dry_run', { policy: proposedPolicy }, result);
        this.deps.eventBus.emit(EVENTS.WHATIF_SIMULATION_COMPLETED, {
            type: 'policy_dry_run',
            policyType: proposedPolicy.type,
            violationsCount,
            severityLevel,
        });
        return result;
    }

    getSimulationHistory(limit = 20): SimulationRecord[] {
        return this.history.slice(0, limit);
    }

    clearHistory(): void {
        this.history = [];
    }

    private record<T>(
        type: SimulationRecord['type'],
        input: Record<string, unknown>,
        result: T,
    ): void {
        this.history.unshift({
            id: `sim_${++this.seq}`,
            type,
            input,
            result,
            timestamp: Date.now(),
        } as SimulationRecord);
        if (this.history.length > MAX_HISTORY) this.history.pop();
    }
}
