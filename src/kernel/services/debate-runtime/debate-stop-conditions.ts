import type { DebateSession } from '../../contracts/debate-types';
import { jaccardSimilarity } from '../../contracts/debate-types';
import { buildDebateState } from './debate-state-builder';

export function calculateConfidence(content: string): number {
    const wordCount = content.split(/\s+/).length;

    // Structural score: well-structured arguments are more confident
    const hasParagraphs = content.includes('\n\n');
    const hasStructuredList = /^\s*[-*\d]+\s/m.test(content);
    const sentences = content.split(/[.!?]+\s/).length;
    const structureScore = hasParagraphs ? 0.15 : hasStructuredList ? 0.1 : 0;
    const sentenceVariety = Math.min(0.1, sentences / 20);

    // Evidential support: citations, data, examples
    const hasData = /\d+%|[\d,]+\.?\d*\s*(million|billion|percent|%|\$|€|£)/i.test(content);
    const hasCitation =
        /https?:\/\/|www\.|according to|source|study|research|survey|report|data/i.test(content);
    const evidenceScore = (hasData ? 0.15 : 0) + (hasCitation ? 0.1 : 0);

    // Reasoning depth: logical connectors indicate structured reasoning
    const reasoningMarkers =
        /\b(therefore|because|thus|hence|consequently|however|nevertheless|furthermore|moreover|in contrast|on the other hand|this implies|as a result)\b/gi;
    const reasoningCount = (content.match(reasoningMarkers) || []).length;
    const reasoningScore = Math.min(0.15, reasoningCount * 0.03);

    // Certainty vs hedging ratio
    const certaintyMarkers =
        /\b(definitely|certainly|undoubtedly|absolutely|clearly|obviously|always|never|must|without doubt|unquestionably|undeniable)\b/gi;
    const hedgingMarkers =
        /\b(maybe|perhaps|possibly|might|could|seems|appears|i think|i believe|probably|likely|somewhat|generally|often|sometimes|i suspect|i guess|i suppose)\b/gi;
    const certainty = (content.match(certaintyMarkers) || []).length;
    const hedging = (content.match(hedgingMarkers) || []).length;
    const certaintyDelta = Math.min(0.15, Math.max(-0.1, (certainty - hedging) * 0.02));

    // Word count baseline (too short = low confidence)
    const lengthScore =
        wordCount < 30 ? -0.2 : wordCount > 500 ? 0 : Math.min(0.1, wordCount / 500);

    const score =
        0.4 +
        structureScore +
        sentenceVariety +
        evidenceScore +
        reasoningScore +
        certaintyDelta +
        lengthScore;
    return Math.max(0.1, Math.min(1.0, score));
}

export function hasNovelClaims(session: DebateSession): boolean {
    const state = buildDebateState(session.arguments, '');
    const currentRoundClaims = state.currentClaims;
    const previousRoundClaims = state.previousClaims;
    if (currentRoundClaims.length === 0) return false;
    const novel = currentRoundClaims.filter((c) => {
        const norm = c.text
            .toLowerCase()
            .replace(/[^a-zа-яё0-9\s]/g, '')
            .trim();
        return !previousRoundClaims.some((p) =>
            p.text
                .toLowerCase()
                .replace(/[^a-zа-яё0-9\s]/g, '')
                .trim()
                .includes(norm.slice(0, 40)),
        );
    });
    return novel.length > 0;
}

export function isConvergencePlateau(
    session: DebateSession,
    jaccardSim: (a: string, b: string) => number = jaccardSimilarity,
): boolean {
    const roundScores: number[] = [];
    for (let r = Math.max(0, session.currentRound - 3); r <= session.currentRound; r++) {
        const roundArgs = session.arguments.filter((a) => a.round === r);
        if (roundArgs.length < 2) continue;
        let total = 0;
        for (let i = 1; i < roundArgs.length; i++) {
            total += jaccardSim(roundArgs[i - 1]!.content, roundArgs[i]!.content);
        }
        roundScores.push((total / (roundArgs.length - 1)) * 100);
    }
    if (roundScores.length < 3) return false;
    const allAbove = roundScores.every((s) => s > 80);
    const stable = Math.max(...roundScores) - Math.min(...roundScores) < 10;
    return allAbove && stable;
}

export function updateConvergenceScore(
    session: DebateSession,
    jaccardSim: (a: string, b: string) => number = jaccardSimilarity,
): void {
    if (session.arguments.length < 2) return;

    const recentArgs = session.arguments.slice(-4);

    let totalOverlap = 0;
    let pairs = 0;
    for (let i = 0; i < recentArgs.length; i++) {
        for (let j = i + 1; j < recentArgs.length; j++) {
            if (recentArgs[i]!.round === recentArgs[j]!.round) {
                totalOverlap += jaccardSim(recentArgs[i]!.content, recentArgs[j]!.content);
                pairs++;
            }
        }
    }

    const avgOverlap = pairs > 0 ? totalOverlap / pairs : 50;
    const target = avgOverlap * 100;
    session.convergenceScore = Math.min(100, 0.3 * target + 0.7 * session.convergenceScore);
}
