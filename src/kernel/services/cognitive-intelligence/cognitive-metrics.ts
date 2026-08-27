import type {
    CognitiveMetricsSnapshot,
    CognitiveZone,
    CognitiveSessionSummary,
} from '../../contracts/cognitive-intelligence';

const MAX_SESSIONS = 100;

export class CognitiveMetricsEngine {
    private sessions = new Map<string, CognitiveSessionSummary[]>();
    private listeners: Array<(metrics: CognitiveMetricsSnapshot) => void> = [];

    recordSummary(summary: CognitiveSessionSummary): void {
        const history = this.sessions.get(summary.id) || [];
        history.push(summary);
        if (history.length > 100) history.shift();
        this.sessions.set(summary.id, history);
        if (this.sessions.size > MAX_SESSIONS) {
            const oldest = this.sessions.keys().next().value;
            if (oldest !== undefined) this.sessions.delete(oldest);
        }
        this.emit();
    }

    dropSession(id: string): void {
        this.sessions.delete(id);
    }

    onMetricsChange(cb: (metrics: CognitiveMetricsSnapshot) => void): () => void {
        this.listeners.push(cb);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== cb);
        };
    }

    compute(): CognitiveMetricsSnapshot {
        const allSummaries = Array.from(this.sessions.values()).flat();
        const sessionCount = this.sessions.size;
        if (allSummaries.length === 0) {
            return {
                timestamp: Date.now(),
                debateQuality: 0,
                avgContradictionDensity: 0,
                avgConsensusConfidence: 0,
                avgReasoningCoherence: 0,
                topologyEffectiveness: {},
                reasoningCollapseDetected: false,
                hallucinationZones: [],
                sessionCount: 0,
                updatedAt: Date.now(),
            };
        }

        const latestBySession = new Map<string, CognitiveSessionSummary>();
        for (const s of allSummaries) {
            latestBySession.set(s.id, s);
        }
        const latest = Array.from(latestBySession.values());

        const avgContradictionDensity =
            latest.reduce((s, x) => s + x.contradictionDensity, 0) / latest.length;
        const avgConsensusConfidence =
            latest.reduce((s, x) => s + x.consensusConfidence, 0) / latest.length;

        const coherenceBySession = Array.from(this.sessions.entries()).map(([, history]) => {
            if (history.length < 2) return 1;
            let stable = 0;
            for (let i = 1; i < history.length; i++) {
                const delta = Math.abs(
                    history[i]!.contradictionDensity - history[i - 1]!.contradictionDensity,
                );
                if (delta < 0.2) stable++;
            }
            return stable / (history.length - 1);
        });
        const avgReasoningCoherence =
            coherenceBySession.length > 0
                ? coherenceBySession.reduce((s, c) => s + c, 0) / coherenceBySession.length
                : 0;

        const debateQuality = Math.max(
            0,
            Math.min(
                1,
                (1 - avgContradictionDensity) * 0.4 +
                    avgConsensusConfidence * 0.3 +
                    avgReasoningCoherence * 0.3,
            ),
        );

        const topologyTypes = new Set(latest.map((s) => s.topologyDepth.toString()));
        const topologyEffectiveness: Record<string, number> = {};
        for (const t of topologyTypes) {
            const withType = latest.filter((s) => s.topologyDepth.toString() === t);
            topologyEffectiveness[`depth_${t}`] =
                withType.reduce((s, x) => s + x.consensusConfidence, 0) / withType.length;
        }

        const reasoningCollapseDetected =
            avgContradictionDensity > 0.6 && avgConsensusConfidence < 0.3;

        const hallucinationZones: CognitiveZone[] = [];
        if (reasoningCollapseDetected) {
            for (const s of latest) {
                if (s.contradictionDensity > 0.7) {
                    hallucinationZones.push({
                        sessionId: s.id,
                        type: 'reasoning_collapse',
                        severity: Math.min(1, s.contradictionDensity),
                        evidence: [
                            `Contradiction density ${(s.contradictionDensity * 100).toFixed(0)}%`,
                        ],
                        timestamp: Date.now(),
                    });
                }
            }
        }

        return {
            timestamp: Date.now(),
            debateQuality: Math.round(debateQuality * 100) / 100,
            avgContradictionDensity: Math.round(avgContradictionDensity * 100) / 100,
            avgConsensusConfidence: Math.round(avgConsensusConfidence * 100) / 100,
            avgReasoningCoherence: Math.round(avgReasoningCoherence * 100) / 100,
            topologyEffectiveness,
            reasoningCollapseDetected,
            hallucinationZones,
            sessionCount,
            updatedAt: Date.now(),
        };
    }

    getSessionHistory(sessionId: string): CognitiveSessionSummary[] {
        return this.sessions.get(sessionId) || [];
    }

    private emit(): void {
        const metrics = this.compute();
        for (const cb of this.listeners) cb(metrics);
    }

    destroy(): void {
        this.sessions.clear();
        this.listeners = [];
    }
}
