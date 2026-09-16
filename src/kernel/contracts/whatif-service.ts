import type { TopologyWhatIf } from './cognitive-intelligence';
import type { ISPolicy } from '../services/policy-service';

export interface BudgetWhatIf {
    readonly currentBudget: number;
    readonly proposedBudget: number;
    readonly estimatedRoundsChange: number;
    readonly estimatedTokenChange: number;
    readonly pressureImpact: 'decrease' | 'increase' | 'unchanged';
    readonly recommendation: string;
}

export interface ProviderWhatIf {
    readonly currentProvider: string;
    readonly proposedProvider: string;
    readonly latencyImpact: number;
    readonly costImpact: number;
    readonly reliabilityImpact: number;
    readonly recommendation: string;
}

export interface StrategyWhatIf {
    readonly currentStrategy: string;
    readonly proposedStrategy: string;
    readonly estimatedQualityChange: number;
    readonly estimatedLatencyChange: number;
    readonly estimatedCostChange: number;
    readonly recommendation: string;
}

export interface PolicyDryRunResult {
    readonly violationsCount: number;
    readonly blockedRequestsCount: number;
    readonly severityLevel: 'info' | 'warning' | 'error' | 'critical';
    readonly projectedImpact: string;
    readonly blockedNodes: string[];
}

export interface SimulationRecord<T = Record<string, unknown>> {
    readonly id: string;
    readonly type:
        'topology' | 'participant' | 'budget' | 'provider' | 'strategy' | 'policy_dry_run';
    readonly input: Record<string, unknown>;
    readonly result: T;
    readonly timestamp: number;
}

export interface IWhatIfService {
    simulateTopologyChange(
        sessionId: string,
        proposedType: string,
    ): Promise<TopologyWhatIf | undefined>;
    simulateParticipantChange(
        sessionId: string,
        additionalAgents: number,
    ): Promise<
        | {
              estimatedQualityChange: number;
              estimatedCostIncrease: number;
              estimatedRoundsIncrease: number;
              recommendation: string;
          }
        | undefined
    >;
    simulateBudgetChange(
        sessionId: string,
        proposedBudget: number,
    ): Promise<BudgetWhatIf | undefined>;
    simulateProviderChange(
        currentProvider: string,
        proposedProvider: string,
    ): Promise<ProviderWhatIf>;
    simulateStrategyChange(
        currentStrategy: string,
        proposedStrategy: string,
    ): Promise<StrategyWhatIf>;
    simulatePolicyDryRun(proposedPolicy: ISPolicy): Promise<PolicyDryRunResult>;
    getSimulationHistory(limit?: number): SimulationRecord[];
    clearHistory(): void;
}
