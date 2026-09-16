import type { PressureLevel } from './debate-runtime';
import type { CanonicalHealthStatus } from './health';

export type { PressureLevel } from './debate-runtime';

// ── Cognitive Metrics ──────────────────────────────────────────────────

export interface CognitiveMetricsSnapshot {
    readonly timestamp: number;
    readonly debateQuality: number;
    readonly avgContradictionDensity: number;
    readonly avgConsensusConfidence: number;
    readonly avgReasoningCoherence: number;
    readonly topologyEffectiveness: Record<string, number>;
    readonly reasoningCollapseDetected: boolean;
    readonly hallucinationZones: CognitiveZone[];
    readonly sessionCount: number;
    readonly updatedAt: number;
}

export interface CognitiveZone {
    readonly sessionId: string;
    readonly agentId?: string;
    readonly type:
        | 'contradiction_cluster'
        | 'low_confidence_region'
        | 'reasoning_collapse'
        | 'hallucination_risk';
    readonly severity: number;
    readonly evidence: string[];
    readonly timestamp: number;
}

// ── Cognitive Pressure ─────────────────────────────────────────────────

export interface CognitivePressure {
    readonly level: PressureLevel;
    readonly score: number;
    readonly activeReasoningChains: number;
    readonly avgChainComplexity: number;
    readonly contentionScore: number;
    readonly memoryPressure: number;
    readonly complexityScore: number;
    readonly timestamp: number;
}

export interface ICognitivePressureEngine {
    compute(sessions: CognitiveSessionSummary[]): CognitivePressure;
    onPressureChange(cb: (pressure: CognitivePressure) => void): () => void;
}

export interface CognitiveSessionSummary {
    readonly id: string;
    readonly phase: string;
    readonly round: number;
    readonly topologyType: string;
    readonly topologyDepth: number;
    readonly agentCount: number;
    readonly activeAgentCount: number;
    readonly totalTokens: number;
    readonly contradictionDensity: number;
    readonly consensusConfidence: number;
}

// ── Cognitive Diagnostics ──────────────────────────────────────────────

export interface SessionDiagnostic {
    readonly sessionId: string;
    readonly topic: string;
    readonly health: CanonicalHealthStatus;
    readonly issues: CognitiveIssue[];
    readonly metrics: {
        readonly coherenceTrend: number[];
        readonly contradictionTrend: number[];
        readonly confidenceTrend: number[];
    };
    readonly score: number;
    readonly updatedAt: number;
}

export interface CognitiveIssue {
    readonly type:
        | 'reasoning_collapse'
        | 'contradiction_spike'
        | 'confidence_drop'
        | 'agent_failure'
        | 'budget_pressure'
        | 'memory_pressure';
    readonly severity: 'low' | 'medium' | 'high' | 'critical';
    readonly message: string;
    readonly timestamp: number;
    readonly details?: string;
}

export interface ICognitiveDiagnosticsEngine {
    diagnose(
        session: CognitiveSessionSummary,
        history: CognitiveSessionSummary[],
    ): SessionDiagnostic;
    getActiveIssues(): CognitiveIssue[];
}

// ── Cognitive What-If ──────────────────────────────────────────────────

export interface TopologyWhatIf {
    readonly currentType: string;
    readonly proposedType: string;
    readonly estimatedDebateQuality: number;
    readonly estimatedTokenCost: number;
    readonly estimatedRounds: number;
    readonly riskScore: number;
    readonly recommendation: string;
}

export interface ICognitiveWhatIfEngine {
    simulateTopologyChange(current: CognitiveSessionSummary, proposedType: string): TopologyWhatIf;
    simulateParticipantChange(
        current: CognitiveSessionSummary,
        additionalAgents: number,
    ): {
        estimatedQualityChange: number;
        estimatedCostIncrease: number;
        estimatedRoundsIncrease: number;
        recommendation: string;
    };
}

// ── Facade ─────────────────────────────────────────────────────────────

export interface ICognitiveIntelligenceService {
    getMetrics(): CognitiveMetricsSnapshot;
    getPressure(): CognitivePressure;
    diagnoseSession(sessionId: string): SessionDiagnostic | undefined;
    simulateTopologyChange(sessionId: string, proposedType: string): TopologyWhatIf | undefined;
    simulateParticipantChange(
        sessionId: string,
        additionalAgents: number,
    ):
        | {
              estimatedQualityChange: number;
              estimatedCostIncrease: number;
              estimatedRoundsIncrease: number;
              recommendation: string;
          }
        | undefined;
    getActiveIssues(): CognitiveIssue[];
    refresh(): void;
    onMetricsChange(cb: (metrics: CognitiveMetricsSnapshot) => void): () => void;
    onPressureChange(cb: (pressure: CognitivePressure) => void): () => void;
    destroy(): void;
}
