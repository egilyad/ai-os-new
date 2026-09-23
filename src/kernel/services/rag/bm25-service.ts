/**
 * Bm25Service — in-memory BM25 (k1=1.2, b=0.75).
 *
 * No Dexie persistence (additive, no migration). Built per retrieveHybrid
 * from the current KnowledgeSource chunks. Deterministic, no network.
 * PROVIDER-PENDING: none — this is fully local.
 */

import type { IBM25Port } from '../../contracts/hybrid-retrieval';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Bm25');

function tokenize(s: string): string[] {
    return s.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 2);
}

interface Doc {
    id: string;
    tokens: string[];
    len: number;
    tf: Map<string, number>;
}

export class Bm25Service implements IBM25Port {
    private docs: Doc[] = [];
    private avgLen = 0;
    private df = new Map<string, number>();
    private N = 0;
    private readonly k1 = 1.2;
    private readonly b = 0.75;

    async init(): Promise<void> {
        LOGGER.info('Bm25', 'init', {});
    }

    async destroy(): Promise<void> {
        this.docs = [];
        this.df.clear();
        this.N = 0;
    }

    async build(chunks: Array<{ id: string; text: string }>): Promise<void> {
        const docs: Doc[] = [];
        const df = new Map<string, number>();
        let totalLen = 0;
        for (const { id, text } of chunks) {
            const tokens = tokenize(text);
            const tf = new Map<string, number>();
            for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
            // df: unique terms
            for (const u of new Set(tokens)) df.set(u, (df.get(u) ?? 0) + 1);
            docs.push({ id, tokens, len: tokens.length || 1, tf });
            totalLen += tokens.length || 1;
        }
        this.docs = docs;
        this.df = df;
        this.N = docs.length;
        this.avgLen = this.N > 0 ? totalLen / this.N : 1;
    }

    async search(query: string, limit: number): Promise<Array<{ id: string; score: number }>> {
        const qTokens = tokenize(query);
        if (qTokens.length === 0 || this.N === 0) return [];
        const qtf = new Map<string, number>();
        for (const t of qTokens) qtf.set(t, (qtf.get(t) ?? 0) + 1);

        const scored: Array<{ id: string; score: number }> = [];
        for (const d of this.docs) {
            let score = 0;
            for (const [term, _qCount] of qtf) {
                const tf = d.tf.get(term) ?? 0;
                if (tf === 0) continue;
                const df = this.df.get(term) ?? 0;
                const idf = Math.log((this.N - df + 0.5) / (df + 0.5) + 1);
                const denom = tf + this.k1 * (1 - this.b + this.b * (d.len / this.avgLen));
                score += idf * ((tf * (this.k1 + 1)) / denom);
            }
            if (score > 0) scored.push({ id: d.id, score });
        }
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, Math.max(1, limit));
    }
}
