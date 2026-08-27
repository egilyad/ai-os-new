import type { SystemState, SLAMode } from './types/metrics-types';

export function updateAdaptiveWeights(
    state: SystemState,
    signal: {
        provider: string;
        success: boolean;
        wasRaceWinner: boolean;
        wasFallback: boolean;
        ttft?: number;
        tps?: number;
    },
): void {
    const delta = state.weights.adaptiveDelta;
    if (signal.success) {
        delta.reliability = Math.min(0.3, delta.reliability + 0.02);
        if (signal.ttft !== undefined && signal.ttft < 1000)
            delta.ttft = Math.min(0.3, delta.ttft + 0.01);
        if (signal.wasRaceWinner) delta.ttft = Math.min(0.3, delta.ttft + 0.03);
        if (signal.tps !== undefined && signal.tps > 20)
            delta.tps = Math.min(0.3, delta.tps + 0.01);
        if (signal.wasRaceWinner && signal.tps !== undefined)
            delta.tps = Math.min(0.3, delta.tps + 0.02);
    } else {
        delta.reliability = Math.max(-0.3, delta.reliability - 0.05);
        if (signal.wasFallback) delta.reliability = Math.max(-0.3, delta.reliability - 0.02);
        if (signal.tps !== undefined && signal.tps < 5)
            delta.tps = Math.max(-0.3, delta.tps - 0.02);
    }
    recalculateEffectiveWeights(state);
}

const VALID_SLA_MODES = ['LOW_LATENCY', 'HIGH_QUALITY', 'BALANCED', 'ECONOMY', 'FREE_FIRST'];

export function recalculateEffectiveWeights(state: SystemState): void {
    const combined = {
        ttft: Math.max(0, state.weights.base.ttft + state.weights.adaptiveDelta.ttft),
        tps: Math.max(0, state.weights.base.tps + state.weights.adaptiveDelta.tps),
        reliability: Math.max(
            0,
            state.weights.base.reliability + state.weights.adaptiveDelta.reliability,
        ),
    };
    const sum = Math.max(0.01, combined.ttft + combined.tps + combined.reliability);
    state.weights.effective = {
        ttft: combined.ttft / sum,
        tps: combined.tps / sum,
        reliability: combined.reliability / sum,
    };
}

export function setSLAMode(state: SystemState, mode: string): void {
    if (!VALID_SLA_MODES.includes(mode)) return;
    state.activeSLA = mode as SLAMode;

    const weights: Record<string, { ttft: number; tps: number; reliability: number }> = {
        LOW_LATENCY: { ttft: 0.7, tps: 0.1, reliability: 0.2 },
        HIGH_QUALITY: { ttft: 0.1, tps: 0.2, reliability: 0.7 },
        BALANCED: { ttft: 0.4, tps: 0.2, reliability: 0.4 },
        ECONOMY: { ttft: 0.2, tps: 0.6, reliability: 0.2 },
        FREE_FIRST: { ttft: 0.2, tps: 0.2, reliability: 0.6 },
    };

    if (weights[mode]) {
        state.weights.base = weights[mode];
        recalculateEffectiveWeights(state);
    }
}

export function setExplorationFactor(state: SystemState, val: number): void {
    state.explorationFactor = val;
}
