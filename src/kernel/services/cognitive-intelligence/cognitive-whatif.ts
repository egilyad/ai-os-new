import type {
    CognitiveSessionSummary,
    TopologyWhatIf,
    ICognitiveWhatIfEngine,
} from '../../contracts/cognitive-intelligence';

const TOPOLOGY_COMPLEXITY: Record<string, { depth: number; costMultiplier: number }> = {
    linear: { depth: 1, costMultiplier: 1 },
    roundtable: { depth: 1, costMultiplier: 1.2 },
    judge: { depth: 2, costMultiplier: 1.5 },
    'tree-of-thought': { depth: 3, costMultiplier: 2.0 },
    'red-blue': { depth: 2, costMultiplier: 1.8 },
};

export class CognitiveWhatIfEngine implements ICognitiveWhatIfEngine {
    simulateTopologyChange(current: CognitiveSessionSummary, proposedType: string): TopologyWhatIf {
        const currentComplexity =
            TOPOLOGY_COMPLEXITY[current.topologyType] ?? TOPOLOGY_COMPLEXITY['roundtable']!;
        const proposed = TOPOLOGY_COMPLEXITY[proposedType];
        if (!proposed) {
            return {
                currentType: current.topologyType,
                proposedType,
                estimatedDebateQuality: 0,
                estimatedTokenCost: 0,
                estimatedRounds: 0,
                riskScore: 1,
                recommendation: `Unknown topology type: ${proposedType}`,
            };
        }

        const qualityDelta = (proposed.depth - currentComplexity.depth) * 0.1;
        const estimatedDebateQuality = Math.max(
            0,
            Math.min(1, current.consensusConfidence + qualityDelta),
        );

        const costMultiplier = proposed.costMultiplier / currentComplexity.costMultiplier;
        const estimatedTokenCost = Math.round(current.totalTokens * costMultiplier);

        const estimatedRounds = Math.round(
            current.round * (proposed.depth / Math.max(1, currentComplexity.depth)),
        );

        const riskScore = Math.min(
            1,
            (proposed.depth / 5) * 0.5 +
                (costMultiplier - 1) * 0.3 +
                (estimatedRounds > 10 ? 0.2 : 0),
        );

        const recommendations: string[] = [];
        if (riskScore > 0.6) recommendations.push('High risk — consider less complex topology');
        if (estimatedDebateQuality > current.consensusConfidence)
            recommendations.push('May improve consensus quality');
        if (costMultiplier > 1.5)
            recommendations.push(
                'Expected token cost increase of ~' + Math.round((costMultiplier - 1) * 100) + '%',
            );

        return {
            currentType: current.topologyType,
            proposedType,
            estimatedDebateQuality: Math.round(estimatedDebateQuality * 100) / 100,
            estimatedTokenCost,
            estimatedRounds,
            riskScore: Math.round(riskScore * 100) / 100,
            recommendation: recommendations.join('; ') || 'No significant change expected',
        };
    }

    simulateParticipantChange(
        current: CognitiveSessionSummary,
        additionalAgents: number,
    ): {
        estimatedQualityChange: number;
        estimatedCostIncrease: number;
        estimatedRoundsIncrease: number;
        recommendation: string;
    } {
        const newTotal = current.agentCount + additionalAgents;
        const qualityDiminishingReturns = Math.max(0, 1 - (newTotal - 2) * 0.05);
        const estimatedQualityChange =
            Math.round(((qualityDiminishingReturns - 0.8) / 0.8) * 100) / 100;

        // B10-29: Guard against division by zero when agentCount is 0
        const estimatedCostIncrease =
            current.agentCount > 0
                ? Math.round((additionalAgents / current.agentCount) * 100)
                : additionalAgents > 0
                  ? 100
                  : 0;
        const estimatedRoundsIncrease = Math.round(additionalAgents * 0.5);

        const recs: string[] = [];
        if (additionalAgents > 2)
            recs.push('Adding more than 2 agents may cause diminishing returns');
        if (estimatedCostIncrease > 50)
            recs.push(`Expected cost increase of ~${estimatedCostIncrease}%`);
        if (qualityDiminishingReturns < 0.5)
            recs.push('Quality may degrade — too many participants');

        return {
            estimatedQualityChange,
            estimatedCostIncrease,
            estimatedRoundsIncrease,
            recommendation: recs.join('; ') || 'Acceptable change',
        };
    }
}
