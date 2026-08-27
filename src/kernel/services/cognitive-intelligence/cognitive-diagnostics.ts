import type {
    CognitiveSessionSummary,
    SessionDiagnostic,
    CognitiveIssue,
    ICognitiveDiagnosticsEngine,
} from '../../contracts/cognitive-intelligence';

const MAX_SESSIONS = 100;
const MAX_ISSUES = 200;
const MAX_HISTORY_PER_SESSION = 100;

export class CognitiveDiagnosticsEngine implements ICognitiveDiagnosticsEngine {
    private activeIssues: CognitiveIssue[] = [];
    private history = new Map<string, CognitiveSessionSummary[]>();
    // B10-30: Track issues per-session to avoid overwriting
    private issuesBySession = new Map<string, CognitiveIssue[]>();

    dropSession(id: string): void {
        this.history.delete(id);
        this.issuesBySession.delete(id);
    }

    diagnose(
        session: CognitiveSessionSummary,
        history: CognitiveSessionSummary[],
    ): SessionDiagnostic {
        this.recordHistory(session.id, session);
        const issues: CognitiveIssue[] = [];
        const coherenceTrend: number[] = [];
        const contradictionTrend: number[] = [];
        const confidenceTrend: number[] = [];

        for (const h of history) {
            contradictionTrend.push(h.contradictionDensity);
            confidenceTrend.push(h.consensusConfidence);
        }

        if (history.length >= 2) {
            for (let i = 1; i < history.length; i++) {
                const delta = Math.abs(
                    history[i]!.contradictionDensity - history[i - 1]!.contradictionDensity,
                );
                coherenceTrend.push(1 - Math.min(1, delta));
            }

            const last = history[history.length - 1]!;
            const prev = history[history.length - 2]!;

            if (last.contradictionDensity - prev.contradictionDensity > 0.3) {
                issues.push({
                    type: 'contradiction_spike',
                    severity: last.contradictionDensity > 0.6 ? 'high' : 'medium',
                    message: `Contradiction spike: ${(last.contradictionDensity * 100).toFixed(0)}% density`,
                    timestamp: Date.now(),
                });
            }

            if (last.consensusConfidence < 0.3 && last.contradictionDensity > 0.6) {
                issues.push({
                    type: 'reasoning_collapse',
                    severity: 'critical',
                    message: 'Reasoning collapse detected — high contradiction with low consensus',
                    timestamp: Date.now(),
                });
            }

            if (last.consensusConfidence - prev.consensusConfidence < -0.25) {
                issues.push({
                    type: 'confidence_drop',
                    severity: 'medium',
                    message: `Confidence dropped ${((prev.consensusConfidence - last.consensusConfidence) * 100).toFixed(0)}%`,
                    timestamp: Date.now(),
                });
            }
        }

        issues.push(...this.getBudgetIssues(session));
        issues.push(...this.getAgentIssues(session));

        const health: SessionDiagnostic['health'] = issues.some((i) => i.severity === 'critical')
            ? 'critical'
            : issues.some((i) => i.severity === 'high')
              ? 'degraded'
              : 'healthy';

        const score = Math.max(
            0,
            Math.min(
                1,
                (1 - session.contradictionDensity) * 0.4 +
                    session.consensusConfidence * 0.3 +
                    (health === 'healthy' ? 0.3 : health === 'degraded' ? 0.15 : 0),
            ),
        );

        // B10-30: Track issues per-session instead of overwriting global state
        this.issuesBySession.set(session.id, issues);
        // Rebuild activeIssues from all sessions
        this.activeIssues = [];
        for (const sessionIssues of this.issuesBySession.values()) {
            this.activeIssues.push(...sessionIssues);
        }
        if (this.activeIssues.length > MAX_ISSUES)
            this.activeIssues = this.activeIssues.slice(-MAX_ISSUES);

        return {
            sessionId: session.id,
            topic: '',
            health,
            issues,
            metrics: { coherenceTrend, contradictionTrend, confidenceTrend },
            score: Math.round(score * 100) / 100,
            updatedAt: Date.now(),
        };
    }

    getActiveIssues(): CognitiveIssue[] {
        return [...this.activeIssues];
    }

    private recordHistory(sessionId: string, summary: CognitiveSessionSummary): void {
        const existing = this.history.get(sessionId) || [];
        existing.push(summary);
        if (existing.length > MAX_HISTORY_PER_SESSION) existing.shift();
        this.history.set(sessionId, existing);
        if (this.history.size > MAX_SESSIONS) {
            const oldest = this.history.keys().next().value;
            if (oldest !== undefined) this.history.delete(oldest);
        }
        if (this.issuesBySession.size > MAX_SESSIONS) {
            const oldest = this.issuesBySession.keys().next().value;
            if (oldest !== undefined) this.issuesBySession.delete(oldest);
        }
    }

    private getBudgetIssues(session: CognitiveSessionSummary): CognitiveIssue[] {
        const issues: CognitiveIssue[] = [];
        if (session.totalTokens > 80_000) {
            issues.push({
                type: 'budget_pressure',
                severity: session.totalTokens > 95_000 ? 'critical' : 'high',
                message: `Token usage at ${((session.totalTokens / 100_000) * 100).toFixed(0)}% of budget`,
                timestamp: Date.now(),
            });
        }
        return issues;
    }

    private getAgentIssues(session: CognitiveSessionSummary): CognitiveIssue[] {
        const issues: CognitiveIssue[] = [];
        const inactive = session.agentCount - session.activeAgentCount;
        if (inactive > 0) {
            issues.push({
                type: 'agent_failure',
                severity: inactive > session.agentCount / 2 ? 'high' : 'medium',
                message: `${inactive} of ${session.agentCount} agents inactive`,
                timestamp: Date.now(),
            });
        }
        return issues;
    }

    destroy(): void {
        this.activeIssues = [];
        this.history.clear();
        this.issuesBySession.clear();
    }
}
