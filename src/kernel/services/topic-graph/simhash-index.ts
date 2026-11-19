/**
 * SimHash 64-bit index for approximate duplicate detection.
 *
 * Used by Topic Graph's ingestion pipeline to cut the per-claim dedupe
 * comparison from a full O(N) jaccard/cosine pass over every existing claim
 * to a cheap pre-filter: candidate claims are selected by SimHash Hamming
 * distance and only those go through the expensive similarity metrics.
 *
 * A strict bucketing index (8 blocks, 5 matching blocks) guarantees recall
 * only for Hamming distance <= 3, which is unrealistically tight for morphologically
 * rich Russian text: adding a clause easily moves a paraphrase 6-12 bits away.
 * We therefore use a fast linear popcount screening with a configurable
 * threshold (default 12) — still orders of magnitude cheaper than tokenizing
 * and comparing every pair, and it does not silently lose true duplicates.
 * Very short texts (<= 5 tokens) are kept in a flat list and always returned.
 */

export interface SimHashIndexEntry<T> {
    key: string;
    hash: bigint;
    data: T;
}

const SHORT_MAX_TOKENS = 5;
const DEFAULT_MAX_HAMMING = 12;

const TOKEN_RE = /[a-zа-яё0-9]+/giu;

export function tokenizeSimple(text: string): string[] {
    const m = text.toLowerCase().match(TOKEN_RE);
    return m ?? [];
}

/** FNV-1a 64-bit over a string. */
export function fnv1a64(input: string): bigint {
    const bytes = new TextEncoder().encode(input);
    let hash = 0xcbf29ce484222325n;
    const prime = 0x100000001b3n;
    for (const b of bytes) {
        hash ^= BigInt(b);
        hash = (hash * prime) & 0xffffffffffffffffn;
    }
    return hash;
}

/** Compute the 64-bit SimHash of a text (term-frequency weighted). */
export function simhash64(text: string): bigint {
    const tokens = tokenizeSimple(text);
    if (tokens.length === 0) return 0n;
    const freqs = new Map<string, number>();
    for (const t of tokens) freqs.set(t, (freqs.get(t) ?? 0) + 1);
    let hash = 0n;
    for (let bit = 0; bit < 64; bit++) {
        let sum = 0;
        const mask = 1n << BigInt(bit);
        for (const [token, freq] of freqs) {
            const th = fnv1a64(token);
            if ((th & mask) !== 0n) sum += freq;
            else sum -= freq;
        }
        if (sum > 0) hash |= mask;
    }
    return hash;
}

/** Number of differing bits between two 64-bit hashes. */
export function hammingDistance(a: bigint, b: bigint): number {
    let x = a ^ b;
    let count = 0;
    while (x !== 0n) {
        x &= x - 1n;
        count++;
    }
    return count;
}

/**
 * Incremental SimHash index: linear popcount screening with a configurable
 * Hamming threshold, plus a flat list for very short texts.
 */
export class SimHashIndex<T> {
    private entries: SimHashIndexEntry<T>[] = [];
    private shortEntries: SimHashIndexEntry<T>[] = [];
    private maxHamming: number;

    constructor(maxHamming = DEFAULT_MAX_HAMMING) {
        this.maxHamming = Math.max(1, maxHamming);
    }

    add(key: string, data: T): void {
        const hash = simhash64(key);
        if (tokenizeSimple(key).length <= SHORT_MAX_TOKENS) {
            this.shortEntries.push({ key, hash, data });
            return;
        }
        this.entries.push({ key, hash, data });
    }

    get size(): number {
        return this.entries.length + this.shortEntries.length;
    }

    query(hash: bigint): SimHashIndexEntry<T>[] {
        const found: SimHashIndexEntry<T>[] = [...this.shortEntries];
        for (const entry of this.entries) {
            if (hammingDistance(entry.hash, hash) <= this.maxHamming) found.push(entry);
        }
        return found;
    }

    queryText(text: string): SimHashIndexEntry<T>[] {
        return this.query(simhash64(text));
    }

    clear(): void {
        this.entries = [];
        this.shortEntries = [];
    }
}

/** Convenience predicate. */
export function isNearDuplicate(hashA: bigint, hashB: bigint, maxDistance = 12): boolean {
    return hammingDistance(hashA, hashB) <= maxDistance;
}
