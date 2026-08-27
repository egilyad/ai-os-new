import type {
    Claim,
    ReasoningChain,
    AgentScore,
    IDebateEvaluator,
} from '../../contracts/debate-runtime';
import type { IDpoStrategySampler } from '../../contracts/debate-dpo-sampler';

// P0.9: Steelmanning quality heuristic — detects whether the agent
// restates opponent positions in strong form before rebutting, rather
// than attacking strawman versions.
function computeSteelmanQuality(claims: Claim[], agentId: string): number {
    const agentClaims = claims.filter((c) => c.agentId === agentId);
    if (agentClaims.length === 0) return 0;

    // Steelmanning markers: restatement + confirmation before rebuttal
    const steelmanPatterns = [
        /\blet\s+me\s+(make\s+sure|understand|see\s+if)\s+/i,
        /\bif\s+i\s+(understand|read)\s+(correctly|right)\b/i,
        /\byour\s+(strongest|best|main|central)\s+(argument|point|claim)\b/i,
        /\bdid\s+i\s+(understand|get\s+it)\s+(correctly|right)\b/i,
        /\bwhat\s+i\s+hear\s+(you\s+saying|is)\b/i,
        /\bcorrect\s+me\s+if\s+i\s+('m|am)\s+wrong\b/i,
        /\byou're\s+(arguing|saying|claiming)\s+that\b/i,

        // Russian patterns
        /\bдай\s+я\s+(удостоверюсь|убежусь|проверю)\b/iu,
        /\bесли\s+я\s+(правильно\s+)?понял\b/iu,
        /\bтвой\s+(сильнейший|главный|основной)\s+(аргумент|тезис)\b/iu,
        /\bя\s+правильно\s+(тебя\s+)?понял\b/iu,
        /\bправильно\s+ли\s+я\s+(понимаю|понял)\b/iu,
        /\bты\s+(утверждаешь|говоришь|считаешь)\s+что\b/iu,
    ];

    let matchCount = 0;
    const texts = agentClaims.map((c) => c.text);

    for (const text of texts) {
        for (const pat of steelmanPatterns) {
            if (pat.test(text)) {
                matchCount++;
                break; // one match per claim
            }
        }
    }

    // Score: ratio of claims with steelmanning, 0-1
    const ratio = matchCount / Math.max(1, agentClaims.length);

    // Bonus for multiple steelmanning patterns in the same text
    let multiPatternBonus = 0;
    for (const text of texts) {
        let patternsInText = 0;
        for (const pat of steelmanPatterns) {
            if (pat.test(text)) patternsInText++;
        }
        if (patternsInText >= 2) multiPatternBonus += 0.1;
        if (patternsInText >= 3) multiPatternBonus += 0.1;
    }

    return Math.min(1, ratio * 0.7 + multiPatternBonus * 0.3);
}

export class DebateEvaluator implements IDebateEvaluator {
    constructor(private dpoSampler?: IDpoStrategySampler) {}

    scoreArguments(agentId: string, claims: Claim[], chain: ReasoningChain[]): AgentScore {
        const argumentCount = claims.filter((c) => c.agentId === agentId).length;
        const avgConfidence =
            claims.filter((c) => c.agentId === agentId).reduce((s, c) => s + c.confidence, 0) /
            Math.max(1, argumentCount);

        const rebuttals = claims.filter(
            (c) =>
                c.agentId === agentId &&
                (/\b(however|nevertheless|on the contrary|on the other hand|that said)\b/i.test(
                    c.text,
                ) ||
                    /\b(but|although|though)\b.*\b(argue|claim|point|argument|reason|evidence|wrong|incorrect|flaw|mistake|disagree|agree|oppose|rebut|refute|counter)\b/i.test(
                        c.text,
                    ) ||
                    /\b(однако|тем не менее|напротив|с другой стороны)\b/i.test(c.text) ||
                    /\b(но |хотя)\b.*\b(утвержд|аргумент|довод|доказательств|ошибк|неправ|неверн|опроверг|соглас|возража)\b/i.test(
                        c.text,
                    )),
        ).length;

        const coherence =
            chain.length > 0 ? chain.reduce((s, c) => s + c.coherence, 0) / chain.length : 0;

        const persuasiveness = Math.min(1, (avgConfidence + coherence) / 2 + rebuttals * 0.05);
        const factuality = Math.min(1, avgConfidence + (chain.length > 0 ? 0.1 : 0));
        const rebuttalStrength = Math.min(1, rebuttals * 0.15);
        const steelmanQuality = computeSteelmanQuality(claims, agentId);

        // P1.10: DPO preference score — topic relevance + novelty + persuasiveness
        let preferenceScore = 0.5;
        if (this.dpoSampler) {
            try {
                const agentClaims = claims.filter((c) => c.agentId === agentId);
                const allTexts = claims.map((c) => c.text);
                const texts = agentClaims.map((c) => c.text);
                if (texts.length > 0) {
                    const combined = texts.join(' ');
                    const pref = this.dpoSampler.scorePreference(combined, '', allTexts);
                    preferenceScore = pref.overall;
                }
            } catch {
                // fallback to neutral
            }
        }

        const normalizedArgCount = Math.min(1, argumentCount / 10);
        const overall = Math.min(
            1,
            normalizedArgCount * 0.05 +
                persuasiveness * 0.3 +
                factuality * 0.1 +
                rebuttalStrength * 0.15 +
                steelmanQuality * 0.2 +
                preferenceScore * 0.2,
        );

        return {
            agentId,
            overall: Math.round(overall * 100) / 100,
            argumentQuality: Math.min(1, (argumentCount / 10) * avgConfidence),
            rebuttalStrength,
            coherence,
            persuasiveness,
            factuality,
            steelmanQuality: Math.round(steelmanQuality * 100) / 100,
        };
    }

    rankParticipants(scores: AgentScore[]): AgentScore[] {
        return [...scores].sort((a, b) => b.overall - a.overall);
    }
}
