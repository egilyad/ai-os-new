import type {
    ILevelTracker,
    LevelAnalysis,
    AbstractionLevel,
} from '../../contracts/debate-level-tracker';

const CONCRETE_KEYWORDS =
    /\b(\d+|percent|dollars|years|people|countries|cases|studies|data|example|report|research|survey|statistics|numbers|figure|table|graph|price|cost|rate|amount|total|average|median|surveyed|measured|observed|trial|experiment|specifically|например|процент|доллар|год|люди|страны|исследование|данные|пример|число|цифр)\b/i;

const ABSTRACT_KEYWORDS =
    /\b(justice|freedom|rights|democracy|equality|truth|knowledge|consciousness|essence|nature|being|existence|meaning|purpose|value|dignity|integrity|principle|virtue|ethics|morality|spirit|soul|infinite|absolute|universal|transcend|love|beauty|good|evil|свобод|справедлив|знани|истин|сущност|быти|смысл|ценност|достоинств|принцип|этик|морал|дух|бесконечн|абсолют)\b/i;

function classifyLevel(text: string): AbstractionLevel {
    if (!text) return 'moderate';
    const concreteCount = (text.match(CONCRETE_KEYWORDS) || []).length;
    const abstractCount = (text.match(ABSTRACT_KEYWORDS) || []).length;
    const total = concreteCount + abstractCount;
    if (total === 0) return 'moderate';
    const ratio = concreteCount / total;
    if (ratio > 0.7) return 'concrete';
    if (ratio < 0.3) return 'abstract';
    return 'moderate';
}

const SWITCH_INSTRUCTIONS: Record<string, string> = {
    concrete_to_abstract:
        'You are being TOO concrete. Zoom out: connect your specific point to broader principles, values, or long-term consequences. Answer: "Why does this matter in the bigger picture?"',
    concrete_to_moderate:
        'You are being very specific. Now add a sentence that connects this detail to a broader theme or general principle — keep the anchor but add depth.',
    abstract_to_concrete:
        'You are being TOO abstract. Ground your argument in a specific example, data point, case study, or concrete scenario. Answer: "Can you give me a real-world example?"',
    abstract_to_moderate:
        'You are being very abstract. Add at least one concrete example or piece of evidence that illustrates your point. Abstract principles need factual anchor.',
    moderate_to_concrete:
        'Add a specific fact, statistic, or case study to strengthen your argument. Currently your reasoning is balanced but lacks concrete support.',
    moderate_to_abstract:
        'Connect your argument to a broader principle or value. You have the specifics — now explain what this means in the bigger picture.',
    stay_put: '',
};

export class LevelTracker implements ILevelTracker {
    analyze(_agentId: string, recentClaims: string[], _round: number): LevelAnalysis {
        const lastText = recentClaims.length > 0 ? recentClaims[recentClaims.length - 1]! : '';
        const currentLevel = classifyLevel(lastText);

        // Decide whether to switch: 60% chance of forcing a switch for variety
        // Deterministic based on text hash to avoid jitter
        const hash = lastText.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
        const shouldSwitch = hash % 10 < 6;

        if (!shouldSwitch || !lastText) {
            return {
                currentLevel,
                recommendedLevel: currentLevel,
                instruction: '',
            };
        }

        const allLevels: AbstractionLevel[] = ['concrete', 'moderate', 'abstract'];
        const alternatives: AbstractionLevel[] = allLevels.filter((l) => l !== currentLevel);
        const pickIdx = Math.abs(hash * 7) % alternatives.length;
        const recommendedLevel = alternatives[pickIdx]!;
        const key = `${currentLevel}_to_${recommendedLevel}`;
        const instruction = SWITCH_INSTRUCTIONS[key]! ?? '';

        return { currentLevel, recommendedLevel, instruction };
    }
}
