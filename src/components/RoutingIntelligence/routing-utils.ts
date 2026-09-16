import type { RouterDecision } from '../../kernel/instances';

export const STRATEGY_LABELS: Record<string, string> = {
    broadcast: 'Broadcast all',
    performance: 'Performance',
    reliability: 'Reliability',
    latency: 'Low Latency',
    auto: 'Auto (UCB1)',
    race: 'Race',
    cost: 'Cost-saving',
    free_first: 'Free First',
};

export function providerColor(provider: string): string {
    const colors: Record<string, string> = {
        groq: '#10b981',
        gemini: '#8b5cf6',
        openrouter: '#3b82f6',
        nvidia: '#f59e0b',
    };
    return colors[provider.toLowerCase()] || '#94a3b8';
}

export function scoreBreakdown(score: RouterDecision['scores'][number]) {
    return {
        ttft: Math.max(0, 1 - score.components.latencyPenalty),
        tps: score.components.raw,
        reliability: Math.max(
            0,
            score.components.stabilityBonus +
                score.components.reputationBonus +
                score.components.keyReputationBonus,
        ),
        cost: score.components.costPenalty,
    };
}

export function getExplanation(d: RouterDecision): string[] {
    const lines: string[] = [];
    const top = d.scores[0];
    if (!top) return [];

    lines.push(`Strategy: ${STRATEGY_LABELS[d.strategy] || d.strategy}`);
    lines.push(
        `Classified: ${d.promptLength > 2000 ? 'long' : d.promptLength > 500 ? 'medium' : 'short'} request (${d.promptLength} chars)`,
    );
    lines.push(
        `Weights: TTFT ${(d.weights.ttft * 100).toFixed(0)}% / TPS ${(d.weights.tps * 100).toFixed(0)}% / Reliability ${(d.weights.reliability * 100).toFixed(0)}%`,
    );

    const topBreakdown = scoreBreakdown(top);
    if (topBreakdown.ttft > 0.5) lines.push('TTFT weight high — favoring low-latency providers');
    if (topBreakdown.reliability > 0.5)
        lines.push('Reliability weight high — favoring stable providers');
    if (d.strategy === 'cost') lines.push('Cost strategy active — penalizing expensive models');
    if (d.estimatedCost) lines.push(`Estimated cost: $${d.estimatedCost.toFixed(4)}`);

    return lines;
}
