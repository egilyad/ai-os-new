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
    return colors[(provider ?? '').toLowerCase()] || '#94a3b8';
}

export function scoreBreakdown(score: RouterDecision['scores'][number] | undefined) {
    // Legacy decisions may lack components entirely — default to zeros
    // instead of crashing every scores table.
    const c = (score?.components ?? {}) as Partial<Record<string, unknown>>;
    const num = (v: unknown) => (typeof v === 'number' ? v : 0);
    return {
        ttft: Math.max(0, 1 - num(c['latencyPenalty'])),
        tps: num(c['raw']),
        reliability: Math.max(0, num(c['stabilityBonus']) + num(c['reputationBonus']) + num(c['keyReputationBonus'])),
        cost: num(c['costPenalty']),
    };
}

export function getExplanation(d: RouterDecision): string[] {
    const lines: string[] = [];
    const top = (d.scores ?? [])[0];
    if (!top) return [];

    lines.push(`Strategy: ${STRATEGY_LABELS[d.strategy] || d.strategy}`);
    lines.push(
        typeof d.promptLength === 'number'
            ? `Classified: ${d.promptLength > 2000 ? 'long' : d.promptLength > 500 ? 'medium' : 'short'} request (${d.promptLength} chars)`
            : 'Classified: unknown length',
    );
    const w = d.weights ?? { ttft: 0, tps: 0, reliability: 0 };
    lines.push(
        `Weights: TTFT ${(w.ttft * 100).toFixed(0)}% / TPS ${(w.tps * 100).toFixed(0)}% / Reliability ${(w.reliability * 100).toFixed(0)}%`,
    );

    const topBreakdown = scoreBreakdown(top);
    if (topBreakdown.ttft > 0.5) lines.push('TTFT weight high — favoring low-latency providers');
    if (topBreakdown.reliability > 0.5)
        lines.push('Reliability weight high — favoring stable providers');
    if (d.strategy === 'cost') lines.push('Cost strategy active — penalizing expensive models');
    if (d.estimatedCost) lines.push(`Estimated cost: $${d.estimatedCost.toFixed(4)}`);

    return lines;
}
