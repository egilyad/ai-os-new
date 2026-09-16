// ── InsightBus (P1.21) ──────────────────────────────────────────────
// Heuristic insight extractor: analyses arguments after each round
// for key contradictions, surprising claims, and foundational premises.
// Pure token-set approach — no LLM calls, no embeddings API.

import type { IInsightBus, Insight } from '../../contracts/debate-insight-bus';

export const MAX_ROUNDS_RETAINED = 3;
export const MAX_INSIGHTS_PER_ROUND = 3;
export const MIN_CONTENT_LENGTH = 40;

// ── Helpers ──────────────────────────────────────────────────────

function tokenize(text: string): Set<string> {
    return new Set(
        text
            .toLowerCase()
            .replace(/<[^>]+>/g, ' ')
            .replace(/[^a-zа-яё0-9\s-]/g, ' ')
            .split(/\s+/)
            .filter((t) => t.length > 2),
    );
}

function jaccard(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 && b.size === 0) return 0;
    let intersection = 0;
    for (const t of a) {
        if (b.has(t)) intersection++;
    }
    const u = a.size + b.size - intersection;
    return u === 0 ? 0 : intersection / u;
}

// Contrast-indicating words and bigrams for contradiction detection.
const CONTRAST_WORDS = new Set([
    'but',
    'however',
    'although',
    'nevertheless',
    'nonetheless',
    'yet',
    'while',
    'whereas',
    'contrary',
    'conversely',
    'однако',
    'но',
    'хотя',
    'тем не менее',
    'напротив',
    'в то время как',
    'в отличие от',
    'несмотря на',
]);

/**
 * Score how much an argument contrasts with another.
 * Looks for: (1) shared topic keywords AND (2) contrast words in the text.
 * Returns 0-1 score.
 */
function contrastScore(a: string, b: string): number {
    const aLow = a.toLowerCase();
    const bLow = b.toLowerCase();
    const aTokens = tokenize(a);
    const bTokens = tokenize(b);
    const topicOverlap = jaccard(aTokens, bTokens);
    if (topicOverlap < 0.05) return 0; // different topics — not a contradiction
    const hasContrastA = [...CONTRAST_WORDS].some((w) => aLow.includes(w));
    const hasContrastB = [...CONTRAST_WORDS].some((w) => bLow.includes(w));
    if (!hasContrastA && !hasContrastB) return 0;
    // Score combines topic overlap and presence of contrast markers
    return Math.min(1, topicOverlap * 0.6 + (hasContrastA && hasContrastB ? 0.4 : 0.25));
}

/**
 * Score how "surprising" an argument is — lexical novelty compared
 * to the accumulated debate corpus. High Jaccard distance = surprising.
 */
function surpriseScore(content: string, corpusTokens: Set<string>): number {
    if (corpusTokens.size === 0) return 0;
    const tokens = tokenize(content);
    const sim = jaccard(tokens, corpusTokens);
    // Too similar = not surprising; very different = surprising but valid
    return Math.max(0, Math.min(1, 1 - sim * 1.5));
}

/**
 * Score a claim as a "premise" — how foundational it is.
 * A premise is short, declarative, and makes a positive claim
 * (contains verbs like "is", "are", "must", "should", "will").
 */
function premiseScore(content: string): number {
    const tokens = tokenize(content);
    const size = tokens.size;
    if (size < 5 || size > 50) return 0; // too short or too long for a premise
    const hasDeclarative = /[.!?]\s*$/.test(content.trim());
    const hasAssertion =
        /\b(is|are|was|were|must|should|will|would|can|cannot|is not|isn't|are not|aren't)\b/i.test(
            content,
        );
    const hasAssertionRu = /\b(является|должен|следует|будет|может|не может|не является)\b/i.test(
        content,
    );
    if (!hasDeclarative) return 0.1;
    if (hasAssertion || hasAssertionRu) return 0.7 + Math.min(0.3, size / 100);
    return 0.3;
}

// ── Service ──────────────────────────────────────────────────────

export class InsightBus implements IInsightBus {
    private allInsights: Insight[] = [];
    private processedRounds = new Set<number>();
    /** Accumulated debate corpus tokens for surprise calculation. */
    private corpusTokens = new Set<string>();

    ingestRound(
        round: number,
        allArguments: Array<{ agentId: string; content: string; agentName?: string }>,
    ): void {
        if (this.processedRounds.has(round)) return;
        this.processedRounds.add(round);

        const texts = allArguments
            .map((a) => a.content)
            .filter((c) => c.length >= MIN_CONTENT_LENGTH);
        if (texts.length < 2) return;

        // Accumulate tokens for corpus
        for (const t of texts) {
            const tokens = tokenize(t);
            for (const tok of tokens) this.corpusTokens.add(tok);
        }

        const candidates: Insight[] = [];

        // 1. Contradiction detection: pairwise comparison of same-round arguments
        for (let i = 0; i < allArguments.length; i++) {
            for (let j = i + 1; j < allArguments.length; j++) {
                if (allArguments[i]!.agentId === allArguments[j]!.agentId) continue;
                const cs = contrastScore(allArguments[i]!.content, allArguments[j]!.content);
                if (cs >= 0.4) {
                    const quote =
                        cs >= 0.6
                            ? allArguments[i]!.content.slice(0, 120)
                            : allArguments[j]!.content.slice(0, 120);
                    candidates.push({
                        type: 'contradiction',
                        text: `Contradiction between ${allArguments[i]!.agentName || allArguments[i]!.agentId} and ${allArguments[j]!.agentName || allArguments[j]!.agentId}`,
                        quote: quote.trim(),
                        round,
                        significance: Math.min(1, cs * 1.2),
                    });
                }
            }
        }

        // 2. Surprise detection: lexical novelty
        for (const arg of allArguments) {
            if (arg.content.length < MIN_CONTENT_LENGTH) continue;
            const ss = surpriseScore(arg.content, this.corpusTokens);
            if (ss >= 0.6) {
                candidates.push({
                    type: 'surprise',
                    text: `Unexpected perspective from ${arg.agentName || arg.agentId}`,
                    quote: arg.content.slice(0, 120).trim(),
                    round,
                    significance: ss,
                });
            }
        }

        // 3. Premise detection: foundational declarative claims
        for (const arg of allArguments) {
            if (arg.content.length < MIN_CONTENT_LENGTH) continue;
            // Split into sentences
            const sentences = arg.content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
            for (const sentence of sentences) {
                const ps = premiseScore(sentence);
                if (ps >= 0.5) {
                    candidates.push({
                        type: 'premise',
                        text: `Foundational claim by ${arg.agentName || arg.agentId}`,
                        quote: sentence.trim().slice(0, 150),
                        round,
                        significance: ps,
                    });
                }
            }
        }

        // Sort by significance descending, take top MAX_INSIGHTS_PER_ROUND
        candidates.sort((a, b) => b.significance - a.significance);
        const top = candidates.slice(0, MAX_INSIGHTS_PER_ROUND);
        this.allInsights.push(...top);

        // Prune: keep only last MAX_ROUNDS_RETAINED rounds of insights
        const keepFromRound = round - MAX_ROUNDS_RETAINED + 1;
        this.allInsights = this.allInsights.filter((i) => i.round >= keepFromRound);
    }

    getFormattedInsights(language?: string): string {
        if (this.allInsights.length === 0) return '';
        const isRu = language === 'Russian';
        const lines: string[] = [];
        if (isRu) {
            lines.push('### 💡 Ключевые инсайты из последних раундов');
        } else {
            lines.push('### 💡 Key Insights from Recent Rounds');
        }
        for (const ins of this.allInsights.slice(0, 6)) {
            const label =
                ins.type === 'contradiction'
                    ? isRu
                        ? '🔴 Противоречие'
                        : '🔴 Contradiction'
                    : ins.type === 'surprise'
                      ? isRu
                          ? '🟡 Неожиданный аргумент'
                          : '🟡 Surprising argument'
                      : isRu
                        ? '🟢 Исходная посылка'
                        : '🟢 Foundational premise';
            const sig = (ins.significance * 100).toFixed(0);
            lines.push(`- ${label} (sig: ${sig}%): ${ins.text}`);
            lines.push(`  "${ins.quote.slice(0, 100)}"`);
        }
        return `\n\n${lines.join('\n')}`;
    }

    getActiveInsights(): Insight[] {
        return [...this.allInsights];
    }

    clearSession(): void {
        this.allInsights = [];
        this.processedRounds.clear();
        this.corpusTokens.clear();
    }
}
