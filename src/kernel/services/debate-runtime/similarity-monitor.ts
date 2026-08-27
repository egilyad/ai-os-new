// ── SimilarityMonitor (P1.26) ─────────────────────────────────────────────
// Jaccard-based redundancy detection for agent arguments.
// No embedding API needed — pure token-set overlap, O(n*m) per check.

import type { ISimilarityMonitor, RedundancyRecord } from '../../contracts/debate-similarity';

export const DEFAULT_REDUNDANCY_THRESHOLD = 0.65;
export const DEFAULT_SLIDING_WINDOW = 3;
export const MIN_CONTENT_LENGTH = 30;

/** Tokenize text into a set of lowercased alphanumeric tokens. */
function tokenize(text: string): Set<string> {
    const tokens = text
        .toLowerCase()
        .replace(/<[^>]+>/g, ' ')
        .replace(/[^a-zа-яё0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 2);
    return new Set(tokens);
}

/** Jaccard similarity of two sets: |A ∩ B| / |A ∪ B|. Empty sets → 0. */
function jaccard(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 && b.size === 0) return 0;
    let intersection = 0;
    for (const t of a) {
        if (b.has(t)) intersection++;
    }
    const union = a.size + b.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

/** Simple content hash for dedup tracking (FNV-1a 32-bit, fast). */
function contentHash(content: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < content.length; i++) {
        hash ^= content.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16);
}

interface AgentHistory {
    /** Sliding window of recent arguments: content hash + tokens + round */
    turns: Array<{
        round: number;
        hash: string;
        tokens: Set<string>;
    }>;
}

export class SimilarityMonitor implements ISimilarityMonitor {
    private threshold: number;
    private history = new Map<string, AgentHistory>();
    /** Redundancy records indexed by `${agentId}:${round}` */
    private records = new Map<string, RedundancyRecord>();

    constructor(threshold = DEFAULT_REDUNDANCY_THRESHOLD) {
        this.threshold = threshold;
    }

    recordArgument(
        agentId: string,
        round: number,
        content: string,
        slidingWindow = DEFAULT_SLIDING_WINDOW,
    ): RedundancyRecord {
        if (content.length < MIN_CONTENT_LENGTH) {
            const record: RedundancyRecord = {
                agentId,
                round,
                similarityScore: 0,
                comparedWith: '',
                isRedundant: false,
            };
            this.records.set(`${agentId}:${round}`, record);
            return record;
        }

        let hist = this.history.get(agentId);
        if (!hist) {
            hist = { turns: [] };
            this.history.set(agentId, hist);
        }

        const currentTokens = tokenize(content);
        const currentHash = contentHash(content);

        // Compare against sliding window of prior turns
        let maxSimilarity = 0;
        let mostSimilarHash = '';
        for (const prior of hist.turns) {
            if (prior.hash === currentHash) {
                // Exact duplicate — guaranteed redundant
                maxSimilarity = 1;
                mostSimilarHash = prior.hash;
                break;
            }
            const sim = jaccard(currentTokens, prior.tokens);
            if (sim > maxSimilarity) {
                maxSimilarity = sim;
                mostSimilarHash = prior.hash;
            }
        }

        // Add current turn to history (maintain sliding window)
        hist.turns.push({
            round,
            hash: currentHash,
            tokens: currentTokens,
        });
        if (hist.turns.length > slidingWindow) {
            hist.turns = hist.turns.slice(-slidingWindow);
        }

        const isRedundant = maxSimilarity >= this.threshold;
        const record: RedundancyRecord = {
            agentId,
            round,
            similarityScore: maxSimilarity,
            comparedWith: mostSimilarHash,
            isRedundant,
        };
        this.records.set(`${agentId}:${round}`, record);
        return record;
    }

    getRedundancy(agentId: string, round: number): RedundancyRecord | undefined {
        return this.records.get(`${agentId}:${round}`);
    }

    clearSession(): void {
        this.history.clear();
        this.records.clear();
    }
}
