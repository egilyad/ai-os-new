import type { Claim, ReasoningChain, AgentScore, IBlindEvaluationService } from '../../contracts';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('BlindEvaluationService');

/** Rebuttal markers — same set as DebateEvaluator uses */
const REBUTTAL_PATTERNS = [
    /\b(however|nevertheless|on the contrary|on the other hand|that said)\b/i,
    /\b(but|although|though)\b.*\b(argue|claim|point|argument|reason|evidence|wrong|incorrect|flaw|mistake|disagree|agree|oppose|rebut|refute|counter)\b/i,
    /\b(однако|тем не менее|напротив|с другой стороны)\b/i,
    /\b(но |хотя)\b.*\b(утвержд|аргумент|довод|доказательств|ошибк|неправ|неверн|опроверг|соглас|возража)\b/i,
];

/** Evidence markers that boost perceived quality */
const EVIDENCE_PATTERNS = [
    /\b(according to|study|research|data|evidence|statistics|survey|analysis)\b/i,
    /\b(согласно|исследовани|данные|доказательств|статистик|анализ)\b/i,
];

/** Count rebuttal patterns in a single text (no cross-reference to other agents) */
function countTextRebuttals(text: string): number {
    let count = 0;
    for (const pat of REBUTTAL_PATTERNS) {
        const m = text.match(pat);
        if (m) count += m.length;
    }
    return count;
}

/** Score a single claim on content alone — no agentId context */
function scoreClaimBlind(text: string, confidence: number): number {
    const normalizedLen = Math.min(0.3, text.length / 3000);
    const evidenceScore = EVIDENCE_PATTERNS.some((p) => p.test(text)) ? 0.2 : 0;
    const rebuttalScore = Math.min(0.25, countTextRebuttals(text) * 0.08);
    const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length;
    const structureScore = Math.min(0.1, sentenceCount / 25);
    const hasNumbers = /\d+/.test(text) ? 0.05 : 0;
    const confidenceScore = confidence * 0.1;

    return Math.min(
        1,
        normalizedLen +
            evidenceScore +
            rebuttalScore +
            structureScore +
            hasNumbers +
            confidenceScore,
    );
}

export class BlindEvaluationService implements IBlindEvaluationService {
    evaluateBlindly(
        agentIds: string[],
        claims: Claim[],
        _getChain: (agentId: string) => ReasoningChain[],
    ): Map<string, AgentScore> {
        const result = new Map<string, AgentScore>();

        for (const agentId of agentIds) {
            try {
                const agentClaims = claims.filter((c) => c.agentId === agentId);
                if (agentClaims.length === 0) {
                    result.set(agentId, {
                        agentId,
                        overall: 0,
                        argumentQuality: 0,
                        rebuttalStrength: 0,
                        coherence: 0,
                        persuasiveness: 0,
                        factuality: 0,
                        steelmanQuality: 0,
                    });
                    continue;
                }

                // Score each claim blindly — no identity context
                const blindScores = agentClaims.map((c) => scoreClaimBlind(c.text, c.confidence));
                const avgBlindScore = blindScores.reduce((s, v) => s + v, 0) / blindScores.length;

                // Rebuttal strength: count rebuttal text patterns in own claims
                const rebuttalCount = agentClaims.reduce(
                    (s, c) => s + countTextRebuttals(c.text),
                    0,
                );
                const rebuttalStrength = Math.min(1, rebuttalCount * 0.12);

                // Persuasion: avg blind score boosted by rebuttals
                const persuasiveness = Math.min(1, avgBlindScore + rebuttalStrength * 0.2);

                // Factuality: confidence + evidence markers
                const avgConfidence =
                    agentClaims.reduce((s, c) => s + c.confidence, 0) / agentClaims.length;
                const hasEvidence = agentClaims.some((c) =>
                    EVIDENCE_PATTERNS.some((p) => p.test(c.text)),
                );
                const factuality = Math.min(1, avgConfidence + (hasEvidence ? 0.15 : 0));

                // Argument quality: blind score + confidence
                const argumentQuality = (avgBlindScore + avgConfidence) / 2;

                // Overall: weighted composite without steelman/halo
                const overall = Math.min(
                    1,
                    argumentQuality * 0.4 +
                        rebuttalStrength * 0.2 +
                        persuasiveness * 0.2 +
                        factuality * 0.2,
                );

                result.set(agentId, {
                    agentId,
                    overall: Math.round(overall * 100) / 100,
                    argumentQuality: Math.round(argumentQuality * 100) / 100,
                    rebuttalStrength: Math.round(rebuttalStrength * 100) / 100,
                    coherence: 0, // not computable without chain context in blind mode
                    persuasiveness: Math.round(persuasiveness * 100) / 100,
                    factuality: Math.round(factuality * 100) / 100,
                    steelmanQuality: 0,
                });
            } catch (e) {
                LOGGER.warn('evaluateBlindly', 'failed for agent', {
                    agentId,
                    error: e,
                });
                result.set(agentId, {
                    agentId,
                    overall: 0,
                    argumentQuality: 0,
                    rebuttalStrength: 0,
                    coherence: 0,
                    persuasiveness: 0,
                    factuality: 0,
                    steelmanQuality: 0,
                });
            }
        }

        return result;
    }
}
