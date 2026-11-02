import { describe, expect, it } from 'vitest';
import { CognitiveMetricsEngine } from './cognitive-metrics';
import { CognitivePressureEngine } from './cognitive-pressure';
import { CognitiveWhatIfEngine } from './cognitive-whatif';
import { CognitiveDiagnosticsEngine } from './cognitive-diagnostics';
import type { CognitiveSessionSummary } from '../../contracts/cognitive-intelligence';

const summary: CognitiveSessionSummary = {
    id: 's1',
    phase: 'deliberating',
    round: 3,
    topologyType: 'roundtable',
    topologyDepth: 1,
    agentCount: 3,
    activeAgentCount: 2,
    totalTokens: 5000,
    contradictionDensity: 0.2,
    consensusConfidence: 0.6,
};

describe('CognitiveMetricsEngine', () => {
    it('compute возвращает snapshot без падений', () => {
        const engine = new CognitiveMetricsEngine();
        expect(engine.compute()).toBeDefined();
    });

    it('recordSummary учитывает сессию', () => {
        const engine = new CognitiveMetricsEngine();
        engine.recordSummary(summary);
        const metrics = engine.compute();
        expect(metrics).toBeDefined();
    });
});

describe('CognitivePressureEngine', () => {
    it('compute возвращает pressure', () => {
        const engine = new CognitivePressureEngine();
        const pressure = engine.compute([summary]);
        expect(pressure).toBeDefined();
        expect(typeof pressure.level).toBe('string');
    });
});

describe('CognitiveWhatIfEngine', () => {
    it('simulateTopologyChange считает стоимость и риски', () => {
        const engine = new CognitiveWhatIfEngine();
        const res = engine.simulateTopologyChange(summary, 'tree-of-thought');
        expect(res.proposedType).toBe('tree-of-thought');
        expect(res.estimatedTokenCost).toBeGreaterThan(5000);
        expect(res.riskScore).toBeGreaterThanOrEqual(0);
    });

    it('неизвестная топология возвращает riskScore=1', () => {
        const engine = new CognitiveWhatIfEngine();
        const res = engine.simulateTopologyChange(summary, 'bogus');
        expect(res.riskScore).toBe(1);
        expect(res.recommendation).toContain('Unknown');
    });
});

describe('CognitiveDiagnosticsEngine', () => {
    it('getActiveIssues возвращает пустой список', () => {
        const engine = new CognitiveDiagnosticsEngine();
        expect(engine.getActiveIssues()).toEqual([]);
    });
});
