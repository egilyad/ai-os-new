// ── Quality Impact Tracker — Contract ──────────────────────────────────
// P0 MVP: typed event schema, IQualityImpactCollector interface, aggregate types

export type QualityEventType =
    | 'PROMPT_BLOCK_USED'
    | 'SERVICE_EXECUTED'
    | 'SIGNAL_CREATED'
    | 'SCORE_CHANGED'
    | 'ARGUMENT_FEATURE'
    | 'FINAL_IMPACT';

export interface PromptBlockUsedPayload {
    blockName: string;
    charLength: number;
    runtimeServiceCalled: boolean;
    serviceLatencyMs?: number;
}

export interface ServiceExecutedPayload {
    serviceName: string;
    calls: number;
    totalLatencyMs: number;
    outputSummary?: string;
}

export interface SignalCreatedPayload {
    signalName: string;
    value: number;
    context?: Record<string, unknown>;
}

export interface ScoreChangedPayload {
    prior: number;
    posterior: number;
    delta: number;
    dimension: string;
}

export interface ArgumentFeaturePayload {
    feature: string;
    detected: boolean;
    strength?: number;
}

export interface FinalImpactPayload {
    sessionScore: number;
    baselineAvgScore?: number;
    delta: number;
    confidence: 'none' | 'low' | 'medium' | 'high' | 'very_high';
}

export type QualityEventPayload =
    | PromptBlockUsedPayload
    | ServiceExecutedPayload
    | SignalCreatedPayload
    | ScoreChangedPayload
    | ArgumentFeaturePayload
    | FinalImpactPayload;

export interface QualityImpactEvent {
    id: string;
    sessionId: string;
    techniqueId: string;
    timestamp: number;
    eventType: QualityEventType;
    round: number;
    agentId?: string;
    payload: QualityEventPayload;
}

export interface TechniqueImpactMetrics {
    techniqueId: string;
    totalSessions: number;
    totalActivations: number;
    totalSkips: number;
    avgJudgeScoreDelta: number;
    avgConfidenceDelta: number;
    avgRoundCountDelta: number;
    avgTokenCostDelta: number;
    sampleSizeOn: number;
    sampleSizeOff: number;
    confidence: 'none' | 'low' | 'medium' | 'high' | 'very_high';
    pValue?: number;
    lastTouchCount: number;
    frequencyInBestRounds: number;
    lastUpdated: number;
}

export interface QualitySessionRecord {
    sessionId: string;
    topic: string;
    strategy: string;
    participantCount: number;
    roundCount: number;
    totalTokens: number;
    durationMs: number;
    enabledTechniques: string[];
    activatedTechniques: string[];
    techniqueEventCount: number;
    timestamp: number;
}

export interface QualityBaselineRecord {
    sessionId: string;
    topic: string;
    strategy: string;
    participantCount: number;
    roundCount: number;
    totalTokens: number;
    durationMs: number;
    judgeScore: number;
    avgConfidence: number;
    timestamp: number;
}

export interface QualityExperiment {
    id: string;
    name: string;
    description: string;
    techniqueIds: string[];
    enabledOnInit: boolean;
    sessionsPlanned: number;
    sessionsCompleted: number;
    status: 'draft' | 'running' | 'completed' | 'cancelled';
    result?: {
        techniqueResults: Array<{
            techniqueId: string;
            avgScoreOn: number;
            avgScoreOff: number;
            sessionsOn: number;
            sessionsOff: number;
            confidence: 'none' | 'low' | 'medium' | 'high' | 'very_high';
            pValue?: number;
        }>;
    };
    createdAt: number;
}

export interface IExperimentEngine {
    startExperiment(config: {
        techniqueIds: string[];
        name?: string;
        enabledOnInit?: boolean;
    }): Promise<string>;
    stopExperiment(experimentId: string): Promise<void>;
    deleteExperiment(experimentId: string): Promise<void>;
    getExperiment(id: string): QualityExperiment | undefined;
    getAllExperiments(): QualityExperiment[];
    isExperimentRunning(): boolean;
    generateAssignmentForSession(
        sessionId: string,
        enabledTechniques: string[],
    ): Record<string, boolean>;
    getAssignmentForSession(sessionId: string): Record<string, boolean> | undefined;
    recordSessionCompletion(
        sessionId: string,
        techniqueResults: Record<string, number>,
    ): Promise<void>;
}

export interface SessionScoreSnapshot {
    sessionId: string;
    enabledTechniques: string[];
    judgeScore: number;
    avgConfidence: number;
    roundCount: number;
    totalTokens: number;
    participantCount: number;
    strategy: string;
    topic: string;
    durationMs: number;
    timestamp: number;
}

export interface BestConditions {
    techniqueId: string;
    bestRoundRange?: [number, number];
    bestAgentCount?: number;
    bestTopicCategory?: string;
    confidence: 'none' | 'low' | 'medium' | 'high' | 'very_high';
}

export interface AttributionEntry {
    techniqueId: string;
    lastTouchCount: number;
    frequencyInBestRounds: number;
    compositeScore: number;
}

export interface IQualityImpactCollector {
    record(event: QualityImpactEvent): void;
    finalizeSession(
        sessionId: string,
        sessionData: {
            enabledTechniques: string[];
            topic: string;
            strategy: string;
            participantCount: number;
            roundCount: number;
            totalTokens: number;
            durationMs: number;
            judgeScore?: number;
        },
    ): Promise<void>;
    getMetrics(techniqueId: string): TechniqueImpactMetrics | undefined;
    getAllMetrics(): TechniqueImpactMetrics[];
    getSessionHistory(): QualitySessionRecord[];
    getBaselineSessions(): QualityBaselineRecord[];
    getBestConditions(techniqueId: string): BestConditions;
    getSignificance(techniqueId: string): {
        pValue: number;
        confidence: 'none' | 'low' | 'medium' | 'high' | 'very_high';
    };
    getScoreSnapshots(): SessionScoreSnapshot[];
    getAttribution(): AttributionEntry[];
    getAttributionLeaderboard(limit?: number): AttributionEntry[];
}
