import type { ClaimGraph, Contradiction } from './types';
import { getUnresolvedClaims } from './claim-graph';

let _contradictionCounter = 0;

function nextContradictionId(): string {
    _contradictionCounter = (_contradictionCounter + 1) >>> 0;
    return `x${Date.now().toString(36)}-${_contradictionCounter}-${crypto.randomUUID().slice(0, 6)}`;
}

const AGREEMENT_MARKERS =
    /\b(agree|supports?|concur|endorse|affirm|similar|consistent|align|corroborate|поддерживаю|согласен|солидарен|верно|именно|действительно|соглашусь|поддержива|разделяю)\b/iu;

const DISAGREEMENT_MARKERS =
    /\b(disagree|oppose|reject|refute|contradict|conflict|however|but\s+rather|conversely|on\s+the\s+contrary|не\s+согласен|возражаю|опровергаю|противоречит|однако|напротив|ошибаетесь|заблуждаетесь|нельзя\s+согласиться|сомнительно|неверно|некорректно|упускаете|игнорируете)\b/iu;

const STOPWORDS = new Set([
    'the',
    'a',
    'an',
    'of',
    'in',
    'to',
    'for',
    'on',
    'and',
    'or',
    'but',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'has',
    'have',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'can',
    'shall',
    'with',
    'from',
    'by',
    'at',
    'as',
    'it',
    'its',
    'this',
    'that',
    'these',
    'those',
    'not',
    'no',
    'nor',
    'so',
    'if',
    'then',
    'than',
    'too',
    'very',
    'just',
    'about',
    'also',
    'more',
    'some',
    'any',
    'each',
    'every',
    'all',
    'both',
    'few',
    'many',
    'much',
    'и',
    'в',
    'во',
    'не',
    'что',
    'он',
    'на',
    'я',
    'с',
    'со',
    'как',
    'а',
    'то',
    'все',
    'она',
    'так',
    'его',
    'но',
    'да',
    'ты',
    'к',
    'у',
    'же',
    'вы',
    'за',
    'бы',
    'по',
    'только',
    'ее',
    'мне',
    'было',
    'вот',
    'от',
    'меня',
    'еще',
    'нет',
    'о',
    'из',
    'ему',
    'теперь',
    'когда',
    'даже',
    'вдруг',
    'ли',
    'уже',
    'или',
    'ни',
    'быть',
    'был',
    'него',
    'до',
    'вас',
    'нибудь',
    'опять',
    'ой',
    'это',
    'эти',
    'эта',
    'этот',
    'их',
    'нему',
    'нам',
    'наш',
    'ваш',
    'об',
    'чем',
    'чтобы',
    'который',
    'которая',
    'которые',
    'которое',
]);

function extractContentWords(text: string): Set<string> {
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);
    return new Set(words.filter((w) => w.length >= 4 && !STOPWORDS.has(w)));
}

function getBigrams(tokens: string[]): Set<string> {
    const bigrams = new Set<string>();
    for (let i = 0; i < tokens.length - 1; i++) {
        bigrams.add(`${tokens[i]} ${tokens[i + 1]}`);
    }
    return bigrams;
}

function jaccardSet<T>(a: Set<T>, b: Set<T>): number {
    if (a.size === 0 && b.size === 0) return 0;
    const intersection = new Set([...a].filter((x) => b.has(x)));
    const union = new Set([...a, ...b]);
    return intersection.size / union.size;
}

/**
 * Detect contradictions between unresolved claims.
 *
 * Key improvements over baseline:
 * - Only compares claims from the last 2 rounds (older claims settled)
 * - Content-word topic overlap guard — claims about different topics never contradict
 * - Lower high-overlap threshold (0.45) to filter agreement/parroting
 * - Bigram topic alignment — zero bigram overlap → different topics → skip
 */
export function detectContradictions(graph: ClaimGraph): Contradiction[] {
    const allUnresolved = getUnresolvedClaims(graph);
    if (allUnresolved.length < 2) return [];

    const currentMaxRound = Math.max(...allUnresolved.map((c) => c.round));
    const recentRoundThreshold = Math.max(0, currentMaxRound - 1);

    // Only compare claims from the last 2 rounds — older claims settled
    const recent = allUnresolved.filter((c) => c.round >= recentRoundThreshold);
    if (recent.length < 2) return [];

    const contradictions: Contradiction[] = [];

    for (let i = 0; i < recent.length; i++) {
        for (let j = i + 1; j < recent.length; j++) {
            const a = recent[i]!;
            const b = recent[j]!;
            if (a.speaker === b.speaker) continue;

            const aLower = a.text.toLowerCase();
            const bLower = b.text.toLowerCase();

            // Normalized text overlap
            const aNorm = aLower.replace(/[^a-zа-яё0-9\s]/g, '').trim();
            const bNorm = bLower.replace(/[^a-zа-яё0-9\s]/g, '').trim();
            if (aNorm.length < 50 || bNorm.length < 50) continue;

            const aTokens = aNorm.split(/\s+/).filter(Boolean);
            const bTokens = bNorm.split(/\s+/).filter(Boolean);

            const aWords = new Set(aTokens);
            const bWords = new Set(bTokens);
            const overlap = jaccardSet(aWords, bWords);

            // High overlap = agreement/parroting, NOT contradiction
            if (overlap > 0.45) continue;

            // Content-word topic alignment check
            const aContent = extractContentWords(aNorm);
            const bContent = extractContentWords(bNorm);
            if (aContent.size < 2 || bContent.size < 2) continue;
            const topicOverlap = jaccardSet(aContent, bContent);

            // Claims about completely different topics cannot contradict
            if (topicOverlap < 0.15) continue;

            // Bigram alignment — zero bigram overlap = different topic
            const aBigrams = getBigrams(aTokens);
            const bBigrams = getBigrams(bTokens);
            const bigramOverlap = jaccardSet(aBigrams, bBigrams);
            if (aBigrams.size > 0 && bBigrams.size > 0 && bigramOverlap === 0) continue;

            // Moderate overlap: require explicit disagreement markers
            if (overlap > 0.15 && overlap <= 0.45) {
                const aHasDisagreement = DISAGREEMENT_MARKERS.test(aLower);
                const bHasDisagreement = DISAGREEMENT_MARKERS.test(bLower);
                const anyDisagreementMarker = aHasDisagreement || bHasDisagreement;

                const aHasAgreement = AGREEMENT_MARKERS.test(aLower);
                const bHasAgreement = AGREEMENT_MARKERS.test(bLower);

                // Both expressing agreement with no disagreement = not contradiction
                if (aHasAgreement && bHasAgreement && !anyDisagreementMarker) continue;

                // No disagreement markers from either speaker = probably agreement
                if (!anyDisagreementMarker) continue;
            }

            contradictions.push({
                id: nextContradictionId(),
                claimA: a.id,
                claimB: b.id,
                severity: overlap,
                status: 'open',
                lastCheckedAt: Date.now(),
            });
        }
    }

    return contradictions;
}

export function resolveContradiction(
    existing: Contradiction[],
    contradictionId: string,
): Contradiction[] {
    return existing.map((c) =>
        c.id === contradictionId
            ? { ...c, status: 'resolved' as const, lastCheckedAt: Date.now() }
            : c,
    );
}

export function hasOpenContradictions(contradictions: Contradiction[]): boolean {
    return contradictions.some((c) => c.status === 'open');
}
