import type { DebateArgument } from '../../contracts/debate-types';

const SYNONYM_GROUPS: string[][] = [
    [
        'argue',
        'argues',
        'argued',
        'arguing',
        'argument',
        'claim',
        'claims',
        'assert',
        'asserts',
        'assertion',
        'contend',
        'contends',
        'contention',
    ],
    [
        'agree',
        'agrees',
        'agreed',
        'agreeing',
        'concur',
        'concurs',
        'concurred',
        'concurring',
        'support',
        'supports',
        'supported',
    ],
    [
        'disagree',
        'disagrees',
        'disagreed',
        'disagreeing',
        'oppose',
        'opposes',
        'opposed',
        'opposing',
        'reject',
        'rejects',
        'rejected',
        'refute',
        'refutes',
        'refuted',
    ],
    ['important', 'significant', 'crucial', 'critical', 'vital', 'key', 'essential', 'paramount'],
    ['problem', 'issue', 'concern', 'challenge', 'difficulty', 'drawback', 'downside'],
    ['benefit', 'advantage', 'pro', 'strength', 'upside', 'merit', 'positive'],
    [
        'show',
        'shows',
        'shown',
        'demonstrate',
        'demonstrates',
        'demonstrated',
        'indicate',
        'indicates',
        'indicated',
        'suggest',
        'suggests',
        'suggested',
    ],
    [
        'cause',
        'causes',
        'caused',
        'leading',
        'leads',
        'lead',
        'result',
        'results',
        'resulted',
        'contribute',
        'contributes',
        'contributed',
    ],
    ['therefore', 'thus', 'hence', 'consequently', 'accordingly', 'as a result', 'so'],
    ['however', 'nevertheless', 'nonetheless', 'on the other hand', 'conversely', 'yet', 'but'],
    ['many', 'numerous', 'countless', 'multiple', 'several', 'various', 'myriad'],
    ['важный', 'значительный', 'существенный', 'ключевой', 'критический'],
    ['проблема', 'вопрос', 'трудность', 'сложность', 'недостаток'],
    ['преимущество', 'польза', 'достоинство', 'сильная сторона'],
    ['показывать', 'демонстрировать', 'указывать', 'свидетельствовать'],
    ['причина', 'вызывать', 'приводить к', 'результат', 'способствовать'],
    ['поэтому', 'следовательно', 'таким образом', 'отсюда'],
    ['однако', 'тем не менее', 'с другой стороны', 'но', 'в то же время'],
    ['думаю', 'полагаю', 'считаю', 'убежден', 'уверен', 'кажется мне'],
    ['факт', 'факты', 'данные', 'сведения', 'информация'],
    ['нужно', 'необходимо', 'следует', 'требуется', 'важно'],
    ['всегда', 'никогда', 'постоянно', 'все время', 'каждый раз'],
    ['возможно', 'вероятно', 'наверное', 'может быть', 'пожалуй'],
    ['очевидно', 'бесспорно', 'несомненно', 'неоспоримо', 'безусловно'],
    ['доказывать', 'доказать', 'доказательство', 'подтверждать', 'обосновывать', 'аргументировать'],
    ['соглашаться', 'согласиться', 'поддерживать', 'одобрять', 'принимать'],
    ['отвергать', 'отрицать', 'опровергать', 'оспаривать', 'возражать'],
];

export function normalizeSynonyms(word: string): string {
    for (const group of SYNONYM_GROUPS) {
        if (group.includes(word)) return group[0]!;
    }
    return word;
}

function getBigrams(tokens: string[]): Set<string> {
    const bigrams = new Set<string>();
    for (let i = 0; i < tokens.length - 1; i++) {
        bigrams.add(`${tokens[i]} ${tokens[i + 1]}`);
    }
    return bigrams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 && b.size === 0) return 1;
    const intersection = new Set([...a].filter((x) => b.has(x)));
    const union = new Set([...a, ...b]);
    return intersection.size / union.size;
}

export function isDuplicateArgument(
    content: string,
    existingArgs: DebateArgument[],
    threshold = 0.6,
): { isDuplicate: boolean; match: DebateArgument | null } {
    const norm = content
        .toLowerCase()
        .replace(/[^a-zа-яё0-9\s]/g, '')
        .trim();
    if (!norm) return { isDuplicate: false, match: null };
    const tokens = norm.split(/\s+/).filter(Boolean);
    const words = new Set(tokens);
    const bigrams = getBigrams(tokens);
    if (words.size === 0 && bigrams.size === 0) return { isDuplicate: false, match: null };

    for (const existing of existingArgs) {
        if (existing.duplicateOf) continue;
        const existingNorm = existing.content
            .toLowerCase()
            .replace(/[^a-zа-яё0-9\s]/g, '')
            .trim();
        if (!existingNorm) continue;
        const existingTokens = existingNorm.split(/\s+/).filter(Boolean);
        const existingWords = new Set(existingTokens);
        const existingBigrams = getBigrams(existingTokens);
        if (existingWords.size === 0) continue;

        // Word Jaccard
        const wordSim = jaccardSimilarity(words, existingWords);

        // Synonym-normalized Jaccard
        const synWords = new Set(tokens.map(normalizeSynonyms));
        const synExistingWords = new Set(existingTokens.map(normalizeSynonyms));
        const synSim = jaccardSimilarity(synWords, synExistingWords);

        // Bigram overlap
        const bigramSim =
            bigrams.size > 0 && existingBigrams.size > 0
                ? jaccardSimilarity(bigrams, existingBigrams)
                : 0;

        // Combined score: word Jaccard + synonym boost + bigram boost
        const combined = wordSim * 0.5 + synSim * 0.3 + bigramSim * 0.2;
        if (combined > threshold) return { isDuplicate: true, match: existing };
    }
    return { isDuplicate: false, match: null };
}
