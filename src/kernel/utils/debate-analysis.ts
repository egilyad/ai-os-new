export interface FallacyMatch {
    type: string;
    description: string;
    pattern: string;
    severity: 'low' | 'medium' | 'high';
}

interface FallacyRule {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    patterns: RegExp[];
    heuristic?: (text: string) => boolean;
}

const FALLACY_RULES: FallacyRule[] = [
    {
        type: 'ad_hominem',
        description: 'Attacking the person rather than the argument',
        severity: 'high',
        patterns: [
            /\b(idiot|moron|stupid|fool|dumb|ignorant|naive|clueless)\b/i,
            /\byou (are|seem|look) (an?\s+)?(fool|idiot|liar|biased|unqualified)\b/i,
            /\btypical (leftist|rightist|liberal|conservative|libertarian)\b/i,
        ],
        heuristic: (t) =>
            /\b(you|your)\b/i.test(t) &&
            /\b(always|never|just|simply)\b/i.test(t) &&
            !/\b(because|since|therefore|thus)\b/i.test(t),
    },
    {
        type: 'straw_man',
        description: 'Misrepresenting opponent\u2019s position to make it easier to attack',
        severity: 'high',
        patterns: [
            /\bso (what you\u2019re saying|you mean|you imply) is\b/i,
            /\bin other words, you (think|believe|claim)\b/i,
            /\byou (just|simply|basically) (want|think|say)\b/i,
        ],
    },
    {
        type: 'false_dichotomy',
        description: 'Presenting only two options when more exist',
        severity: 'medium',
        patterns: [
            /\b(either .* or .*)\b/i,
            /\b(only two (options|choices|ways))\b/i,
            /\b(you\u2019re either with us or against us)\b/i,
            /\b(it\u2019s either .* or .*)\b/i,
        ],
    },
    {
        type: 'appeal_to_authority',
        description: 'Citing an authority instead of a substantive argument',
        severity: 'low',
        patterns: [
            /\b(according to|as) (a |an )?(famous|renowned|leading|top|expert) (scientist|professor|expert|authority)\b/i,
            /\beveryone knows\b/i,
            /\bthe experts (all )?(agree|say|claim)\b/i,
        ],
    },
    {
        type: 'appeal_to_emotion',
        description: 'Manipulating emotions instead of using facts',
        severity: 'medium',
        patterns: [
            /\b(imagine|think of) (the )?(children|kids|families|innocent|elderly|poor)\b/i,
            /\bhow (would|could) you feel\b/i,
            /\b(disaster|catastrophe|nightmare|hell)\b/i,
            /\bif (you|we) (don\u2019t|do not) act (now|immediately)\b/i,
        ],
    },
    {
        type: 'slippery_slope',
        description: 'Claiming one step will inevitably lead to extreme outcomes',
        severity: 'medium',
        patterns: [
            /\b(next thing|before you know it|inevitably|will lead to)\b/i,
            /\b(slippery|downhill|domino)\b/i,
            /\bif we (allow|let) .* (then)? (what|how) (will|next|stop)\b/i,
        ],
    },
    {
        type: 'hasty_generalization',
        description: 'Drawing broad conclusions from limited evidence',
        severity: 'medium',
        patterns: [
            /\b(all|every|always|never|none) (of )?(the )?(people|men|women|users|customers|students|politicians|companies)\b/i,
            /\b(in my experience|i have (always|never) seen)\b/i,
        ],
    },
    {
        type: 'red_herring',
        description: 'Diverting the discussion away from the original topic',
        severity: 'medium',
        patterns: [
            /\banyway, (what about|let\u2019s talk about)\b/i,
            /\bbut (look|let\u2019s not forget) (at|what about)\b/i,
        ],
    },
    {
        type: 'circular_reasoning',
        description: 'Conclusion appears as a premise',
        severity: 'high',
        patterns: [
            /\b(because .* is .*, therefore .* is .*)\b/i,
            /\b(it is .* because .* is .*)\b/i,
        ],
    },
    {
        type: 'ad_populum',
        description: 'Claiming something is true because many people believe it',
        severity: 'low',
        patterns: [
            /\b(millions|billions|many|most|everyone) (of people )?(believe|think|say|agree)\b/i,
            /\b(popular|widely accepted|mainstream|consensus)\b/i,
        ],
    },
    {
        type: 'no_true_scotsman',
        description: 'Dismissing counterexamples by redefining the group',
        severity: 'medium',
        patterns: [/\bno (true|real|genuine) .* would\b/i, /\breal (.*) don\u2019t\b/i],
    },
    {
        type: 'tu_quoque',
        description: 'Deflecting criticism by accusing the opponent of the same',
        severity: 'medium',
        patterns: [/\byou (do|the same|too|as well)\b/i, /\blook who\u2019s talking\b/i],
    },
];

export function detectFallacies(text: string): FallacyMatch[] {
    if (!text || text.length < 8) return [];
    const matches: FallacyMatch[] = [];
    for (const rule of FALLACY_RULES) {
        for (const pattern of rule.patterns) {
            const m = text.match(pattern);
            if (m) {
                matches.push({
                    type: rule.type,
                    description: rule.description,
                    pattern: m[0],
                    severity: rule.severity,
                });
                break;
            }
        }
        if (rule.heuristic && rule.heuristic(text)) {
            if (!matches.find((x) => x.type === rule.type)) {
                matches.push({
                    type: rule.type,
                    description: rule.description,
                    pattern: '(heuristic)',
                    severity: rule.severity,
                });
            }
        }
    }
    return matches;
}

export function fallacyScore(fallacies: FallacyMatch[]): number {
    if (fallacies.length === 0) return 0;
    const severityWeight = { low: 1, medium: 2, high: 4 } as const;
    const total = fallacies.reduce((s, f) => s + severityWeight[f.severity], 0);
    return Math.min(1, total / 8);
}

export interface PersuasionScore {
    agentId: string;
    initialConfidence: number;
    finalConfidence: number;
    delta: number;
    roundsParticipated: number;
}

export interface PersuasionResult {
    byAgent: PersuasionScore[];
    biggestMover: PersuasionScore | null;
    mostConsistent: PersuasionScore | null;
    overallShift: number;
}

interface ArgumentLite {
    agentId: string;
    content: string;
    confidence: number;
    round: number;
    parentId?: string;
}

export function computePersuasion(args: ArgumentLite[]): PersuasionResult {
    if (!args.length) {
        return { byAgent: [], biggestMover: null, mostConsistent: null, overallShift: 0 };
    }
    const byAgentMap = new Map<string, ArgumentLite[]>();
    for (const a of args) {
        if (!byAgentMap.has(a.agentId)) byAgentMap.set(a.agentId, []);
        byAgentMap.get(a.agentId)!.push(a);
    }
    const byAgent: PersuasionScore[] = [];
    for (const [agentId, list] of byAgentMap.entries()) {
        const sorted = [...list].sort((a, b) => a.round - b.round);
        const initial = sorted[0]?.confidence ?? 0;
        const final = sorted[sorted.length - 1]?.confidence ?? 0;
        byAgent.push({
            agentId,
            initialConfidence: initial,
            finalConfidence: final,
            delta: final - initial,
            roundsParticipated: sorted.length,
        });
    }
    const biggestMover = byAgent.reduce<PersuasionScore | null>((best, x) => {
        if (!best) return x;
        return Math.abs(x.delta) > Math.abs(best.delta) ? x : best;
    }, null);
    const mostConsistent = byAgent.reduce<PersuasionScore | null>((best, x) => {
        if (!best) return x;
        return Math.abs(x.delta) < Math.abs(best.delta) ? x : best;
    }, null);
    const overallShift =
        byAgent.length === 0
            ? 0
            : byAgent.reduce((s, x) => s + Math.abs(x.delta), 0) / byAgent.length;
    return { byAgent, biggestMover, mostConsistent, overallShift };
}

const POSITIVE_LEXICON = new Set([
    'good',
    'great',
    'excellent',
    'wonderful',
    'amazing',
    'fantastic',
    'love',
    'best',
    'happy',
    'joy',
    'success',
    'win',
    'beautiful',
    'positive',
    'agree',
    'yes',
    'definitely',
    'absolutely',
    'clear',
    'clearly',
    'strong',
    'support',
    'helpful',
    'хорошо',
    'отлично',
    'прекрасно',
    'замечательно',
    'люблю',
    'согласен',
    'да',
    'безусловно',
    'успех',
    'победа',
    'красивый',
    'позитивный',
    'поддерживаю',
    'ясно',
    'сильный',
]);

const NEGATIVE_LEXICON = new Set([
    'bad',
    'terrible',
    'awful',
    'horrible',
    'hate',
    'worst',
    'sad',
    'fail',
    'failure',
    'ugly',
    'wrong',
    'negative',
    'no',
    'never',
    'cannot',
    'impossible',
    'reject',
    'against',
    'weak',
    'poor',
    'harmful',
    'dangerous',
    'stupid',
    'idiotic',
    'плохо',
    'ужасно',
    'кошмар',
    'ненавижу',
    'худший',
    'грустно',
    'провал',
    'неудача',
    'уродливый',
    'неправильно',
    'негативный',
    'нет',
    'никогда',
    'невозможно',
    'отвергаю',
    'против',
    'слабый',
    'бедный',
    'вредный',
    'опасный',
    'глупый',
]);

const INTENSIFIERS = new Set([
    'very',
    'extremely',
    'absolutely',
    'totally',
    'completely',
    'utterly',
    'highly',
    'really',
    'so',
    'too',
    'очень',
    'крайне',
    'абсолютно',
    'совершенно',
    'совсем',
    'чрезвычайно',
    'сильно',
    'реально',
    'так',
]);

export interface TonePoint {
    round: number;
    sentiment: number;
    confidence: number;
    intensity: number;
    text: string;
}

export interface ToneAnalysis {
    points: TonePoint[];
    averageSentiment: number;
    volatility: number;
    trend: 'rising' | 'falling' | 'stable' | 'oscillating';
}

function tokenize(text: string): string[] {
    return (text ?? '').toLowerCase().match(/[a-zA-Z\u0400-\u04FF]+/g) ?? [];
}

export function analyzeTone(
    args: { round: number; content: string; confidence?: number }[],
): ToneAnalysis {
    const points: TonePoint[] = [];
    for (const a of args) {
        const tokens = tokenize(a.content);
        let positive = 0;
        let negative = 0;
        let intensifierCount = 0;
        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            if (POSITIVE_LEXICON.has(t!)) positive++;
            if (NEGATIVE_LEXICON.has(t!)) negative++;
            if (INTENSIFIERS.has(t!)) intensifierCount++;
        }
        const total = positive + negative;
        const sentiment = total === 0 ? 0 : (positive - negative) / total;
        const intensity = Math.min(1, (total + intensifierCount) / Math.max(10, tokens.length / 8));
        points.push({
            round: a.round,
            sentiment,
            confidence: a.confidence ?? 0.5,
            intensity,
            text: a.content.slice(0, 80),
        });
    }
    points.sort((a, b) => a.round - b.round);
    const sentiments = points.map((p) => p.sentiment);
    const avg =
        sentiments.length === 0 ? 0 : sentiments.reduce((s, x) => s + x, 0) / sentiments.length;
    let variance = 0;
    for (const s of sentiments) variance += (s - avg) ** 2;
    const volatility = sentiments.length < 2 ? 0 : Math.sqrt(variance / sentiments.length);
    let trend: ToneAnalysis['trend'] = 'stable';
    if (sentiments.length >= 2) {
        const mid = Math.floor(sentiments.length / 2);
        const firstHalf = sentiments.slice(0, mid);
        const secondHalf = sentiments.slice(mid);
        const firstAvg =
            firstHalf.length === 0 ? 0 : firstHalf.reduce((s, x) => s + x, 0) / firstHalf.length;
        const secondAvg =
            secondHalf.length === 0 ? 0 : secondHalf.reduce((s, x) => s + x, 0) / secondHalf.length;
        const drift = secondAvg - firstAvg;
        if (Math.abs(drift) < 0.1) {
            trend = volatility > 0.3 ? 'oscillating' : 'stable';
        } else {
            trend = drift > 0 ? 'rising' : 'falling';
        }
    }
    return { points, averageSentiment: avg, volatility, trend };
}

export interface DebateAnalysis {
    fallacyStats: {
        type: string;
        count: number;
        severity: FallacyMatch['severity'];
        description: string;
    }[];
    totalFallacies: number;
    fallacyScoreByAgent: Record<string, number>;
    persuasion: PersuasionResult;
    tone: ToneAnalysis;
}

export function analyzeDebate(
    args: {
        agentId: string;
        content: string;
        confidence: number;
        round: number;
        parentId?: string;
    }[],
): DebateAnalysis {
    const fallacyMap = new Map<
        string,
        { type: string; count: number; severity: FallacyMatch['severity']; description: string }
    >();
    const fallacyScoreByAgent: Record<string, number> = {};
    for (const a of args) {
        const found = detectFallacies(a.content);
        for (const f of found) {
            const key = f.type;
            if (!fallacyMap.has(key)) {
                fallacyMap.set(key, {
                    type: key,
                    count: 0,
                    severity: f.severity,
                    description: f.description,
                });
            }
            fallacyMap.get(key)!.count++;
        }
        if (found.length > 0) {
            fallacyScoreByAgent[a.agentId] =
                (fallacyScoreByAgent[a.agentId] ?? 0) + fallacyScore(found);
        }
    }
    const fallacyStats = Array.from(fallacyMap.values()).sort((a, b) => b.count - a.count);
    return {
        fallacyStats,
        totalFallacies: fallacyStats.reduce((s, f) => s + f.count, 0),
        fallacyScoreByAgent,
        persuasion: computePersuasion(args),
        tone: analyzeTone(args),
    };
}

export const FALLACY_LABELS: Record<string, { ru: string; en: string }> = {
    ad_hominem: { ru: 'Ad hominem', en: 'Ad hominem' },
    straw_man: { ru: 'Соломенное чучело', en: 'Straw man' },
    false_dichotomy: { ru: 'Ложная дихотомия', en: 'False dichotomy' },
    appeal_to_authority: { ru: 'Апелляция к авторитету', en: 'Appeal to authority' },
    appeal_to_emotion: { ru: 'Апелляция к эмоциям', en: 'Appeal to emotion' },
    slippery_slope: { ru: 'Скользкий склон', en: 'Slippery slope' },
    hasty_generalization: { ru: 'Поспешное обобщение', en: 'Hasty generalization' },
    red_herring: { ru: 'Отвлекающий маневр', en: 'Red herring' },
    circular_reasoning: { ru: 'Порочный круг', en: 'Circular reasoning' },
    ad_populum: { ru: 'Аргумент к толпе', en: 'Ad populum' },
    no_true_scotsman: { ru: 'No true Scotsman', en: 'No true Scotsman' },
    tu_quoque: { ru: 'Tu quoque', en: 'Tu quoque' },
};
