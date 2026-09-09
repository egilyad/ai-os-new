import { sessionManager, debateService } from '../../kernel/instances';
import type { DebateSession } from '../../kernel/contracts/debate-types';

export function getCurrentSessions(): DebateSession[] {
    const history = sessionManager.getDebateHistory();
    const active = debateService.getActiveDebateSession();
    if (active && active.status === 'completed')
        return [active, ...history.filter((s) => s.id !== active.id)];
    return history;
}

export const CONCLUSION_COLORS: Record<string, string> = {
    consensus: '#10b981',
    dominance: '#f59e0b',
    stalemate: '#ef4444',
    partial_agreement: '#8b5cf6',
    inconclusive: '#6b7280',
};

export const CONCLUSION_LABELS: Record<string, string> = {
    consensus: 'Consensus',
    dominance: 'Dominance',
    stalemate: 'Stalemate',
    partial_agreement: 'Partial Agreement',
    inconclusive: 'Inconclusive',
};

export function computeStats(sessions: DebateSession[]) {
    let totalArgs = 0;
    let completedWithConclusion = 0;
    let avgConfidence = 0;
    let confidenceCount = 0;
    for (const s of sessions) {
        if (s.arguments) totalArgs += s.arguments.length;
        if (s.status === 'completed') completedWithConclusion++;
        for (const a of s.arguments ?? []) {
            if (a.confidence !== undefined) {
                avgConfidence += a.confidence;
                confidenceCount++;
            }
        }
    }
    return {
        totalSessions: sessions.length,
        totalArguments: totalArgs,
        completedWithConclusion,
        avgConfidence: confidenceCount > 0 ? avgConfidence / confidenceCount : 0,
    };
}

export function findRelated(activeIndex: number, allSessions: DebateSession[]) {
    if (allSessions.length === 0) return [];
    const current = allSessions[activeIndex];
    if (!current) return [];
    const currentWords = new Set(
        current.topic
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length > 3),
    );
    return allSessions
        .filter((s) => s.id !== current.id)
        .map((s) => {
            const topicOverlap = s.topic
                .toLowerCase()
                .split(/\s+/)
                .filter((w) => currentWords.has(w)).length;
            const topicScore = topicOverlap / Math.max(1, currentWords.size);
            const sArgText = (s.arguments ?? []).map((a) => a.content.toLowerCase()).join(' ');
            const sWords = new Set(sArgText.split(/\s+/).filter((w) => w.length > 4));
            const currentWordsInS = [...currentWords].filter((w) => sWords.has(w)).length;
            const contentScore = currentWordsInS / Math.max(1, currentWords.size);
            return {
                session: s,
                relevance: Math.round(Math.max(topicScore, contentScore * 0.7) * 100) / 100,
            };
        })
        .filter((r) => r.relevance > 0.05)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5);
}

export function getConclusionType(score: number | undefined): string {
    if (!score) return 'inconclusive';
    if (score > 0.7) return 'consensus';
    if (score > 0.4) return 'dominance';
    return 'inconclusive';
}
