// ── DPO Strategy Sampler (P1.10) ──────────────────────────────────
// Heuristic preference model that scores arguments by topic relevance,
// novelty vs existing arguments, and persuasiveness signal words.
// No actual DPO model — deterministic heuristic proxy.

import type { IDpoStrategySampler, PreferenceScore } from '../../contracts/debate-dpo-sampler';

// ── Persuasiveness signal patterns (Russian + English) ────────
const PERSUASIVE_PATTERNS = [
    // Evidence markers
    /\b(study|research|data|evidence|statistics|survey|analysis|meta-analysis|experiment|trial)\b/i,
    /\b(исследовани|данные|статистик|доказательств|эксперимент|анализ|опрос)\b/iu,
    // Logical connectors
    /\b(therefore|thus|hence|consequently|because|since|as a result|this implies|it follows that)\b/i,
    /\b(следовательно|поэтому|потому что|так как|в результате|отсюда следует|это означает)\b/iu,
    // Concrete specifics
    /\b(\d+%|\d+ percent|\d+ million|\d+ billion|\d+ years|\$\d+)\b/,
    // Certainty boosters
    /\b(clearly|undoubtedly|certainly|demonstrably|unquestionably|indisputably)\b/i,
    /\b(очевидно|несомненно|бесспорно|доказано|неопровержимо)\b/iu,
    // Ethical framing
    /\b(rights|justice|fairness|equality|moral|ethical|duty|obligation)\b/i,
    /\b(права|справедливость|равенство|мораль|этик|долг|обязанность)\b/iu,
];

function scorePersuasiveness(text: string): number {
    const matches = PERSUASIVE_PATTERNS.reduce((s, r) => s + (r.test(text) ? 1 : 0), 0);
    return Math.min(1, matches * 0.15);
}

function tokenize(text: string): Set<string> {
    return new Set(
        text
            .toLowerCase()
            .split(/[^a-zа-яё0-9]+/)
            .filter((w) => w.length > 2),
    );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
    let intersection = 0;
    for (const w of a) {
        if (b.has(w)) intersection++;
    }
    const union = new Set([...a, ...b]);
    return union.size === 0 ? 0 : intersection / union.size;
}

function scoreRelevance(text: string, topic: string): number {
    const topicTokens = tokenize(topic);
    if (topicTokens.size === 0) return 0.5;
    const textTokens = tokenize(text);
    const sim = jaccardSimilarity(topicTokens, textTokens);
    // Boost if topic key terms appear in text
    const keyTermHits = Array.from(topicTokens).filter((t) =>
        text.toLowerCase().includes(t),
    ).length;
    const keyTermRatio = keyTermHits / Math.max(1, topicTokens.size);
    return Math.min(1, sim * 0.5 + keyTermRatio * 0.5);
}

function scoreNovelty(text: string, existingArgs: string[]): number {
    if (existingArgs.length === 0) return 1;
    const textTokens = tokenize(text);
    const maxSimilarity = existingArgs.reduce((s, arg) => {
        const sim = jaccardSimilarity(textTokens, tokenize(arg));
        return Math.max(s, sim);
    }, 0);
    return 1 - maxSimilarity;
}

export class DpoStrategySampler implements IDpoStrategySampler {
    scorePreference(text: string, topic: string, existingArgs: string[]): PreferenceScore {
        const relevance = scoreRelevance(text, topic);
        const novelty = scoreNovelty(text, existingArgs);
        const persuasiveness = scorePersuasiveness(text);
        const overall = relevance * 0.35 + novelty * 0.35 + persuasiveness * 0.3;
        return {
            relevance: Math.round(relevance * 100) / 100,
            novelty: Math.round(novelty * 100) / 100,
            persuasiveness: Math.round(persuasiveness * 100) / 100,
            overall: Math.round(overall * 100) / 100,
        };
    }

    rankByPreference(
        args: Array<{ text: string; agentId: string }>,
        topic: string,
        topK: number,
    ): Array<{ text: string; agentId: string; score: PreferenceScore }> {
        // Collect all existing texts for novelty computation
        const allTexts = args.map((a) => a.text);

        const scored = args.map((a) => ({
            ...a,
            score: this.scorePreference(
                a.text,
                topic,
                allTexts.filter((t) => t !== a.text),
            ),
        }));

        // Sort by overall preference descending
        scored.sort((a, b) => b.score.overall - a.score.overall);

        // Diversify: pick top-1, then pick next candidates that are
        // sufficiently different from already-selected ones
        const selected: typeof scored = [];
        const seenTokens = new Set<string>();

        for (const candidate of scored) {
            if (selected.length >= topK) break;
            const candidateTokens = tokenize(candidate.text);
            // Check diversity vs already selected
            const maxOverlap = selected.reduce((s, sel) => {
                const overlap = jaccardSimilarity(candidateTokens, tokenize(sel.text));
                return Math.max(s, overlap);
            }, 0);
            if (maxOverlap < 0.6 || selected.length === 0) {
                selected.push(candidate);
                for (const t of candidateTokens) seenTokens.add(t);
            }
        }

        return selected;
    }
}
