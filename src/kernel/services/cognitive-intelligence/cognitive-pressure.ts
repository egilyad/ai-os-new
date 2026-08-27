import type { CognitivePressure, CognitiveSessionSummary, ICognitivePressureEngine, PressureLevel } from '../../contracts/cognitive-intelligence';

const PRESSURE_THRESHOLDS = [
  { level: 'critical' as PressureLevel, minScore: 0.8 },
  { level: 'high' as PressureLevel, minScore: 0.6 },
  { level: 'normal' as PressureLevel, minScore: 0.3 },
  { level: 'low' as PressureLevel, minScore: 0 },
];

export class CognitivePressureEngine implements ICognitivePressureEngine {
  private listeners: Array<(pressure: CognitivePressure) => void> = [];
  private lastPressure: CognitivePressure | null = null;

  compute(sessions: CognitiveSessionSummary[]): CognitivePressure {
    const activeReasoningChains = sessions.filter(s => s.phase === 'active' || s.phase === 'deliberating').length;
    const avgChainComplexity = sessions.length > 0
      ? sessions.reduce((s, x) => s + x.topologyDepth * x.agentCount, 0) / sessions.length
      : 0;

    const totalAgents = sessions.reduce((s, x) => s + x.agentCount, 0);
    const activeAgents = sessions.reduce((s, x) => s + x.activeAgentCount, 0);
    const contentionScore = totalAgents > 0 ? 1 - (activeAgents / totalAgents) : 0;

    const maxDepth = sessions.reduce((s, x) => Math.max(s, x.topologyDepth), 0);
    const complexityScore = Math.min(1, (avgChainComplexity / 20) * 0.5 + (maxDepth / 10) * 0.3 + (sessions.length / 10) * 0.2);

    const totalTokens = sessions.reduce((s, x) => s + x.totalTokens, 0);
    const memoryPressure = Math.min(1, totalTokens / 500_000);

    const rawScore = complexityScore * 0.35 + contentionScore * 0.25 + memoryPressure * 0.25 + (activeReasoningChains / 10) * 0.15;
    const score = Math.min(1, rawScore);

    let level: PressureLevel = 'low';
    for (const t of PRESSURE_THRESHOLDS) {
      if (score >= t.minScore) { level = t.level; break; }
    }

    const pressure: CognitivePressure = {
      level,
      score: Math.round(score * 100) / 100,
      activeReasoningChains,
      avgChainComplexity: Math.round(avgChainComplexity * 100) / 100,
      contentionScore: Math.round(contentionScore * 100) / 100,
      memoryPressure: Math.round(memoryPressure * 100) / 100,
      complexityScore: Math.round(complexityScore * 100) / 100,
      timestamp: Date.now(),
    };

    this.lastPressure = pressure;
    for (const cb of this.listeners) cb(pressure);
    return pressure;
  }

  onPressureChange(cb: (pressure: CognitivePressure) => void): () => void {
    this.listeners.push(cb);
    if (this.lastPressure) cb(this.lastPressure);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  destroy(): void {
    this.listeners = [];
    this.lastPressure = null;
  }
}
