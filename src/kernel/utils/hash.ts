/**
 * Deterministic, dependency-free string hashing used to stabilise
 * visualisation output (node placement, edge curvature, hue selection).
 * Same input → same output, so graphs don't re-shuffle on every update.
 */

/** FNV-1a 32-bit hash → [0, 1). */
export function stableHash(input: string): number {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h / 4294967296;
}

/** Map a seed to an HSL hue (0..360). */
export function hashHue(input: string): number {
    return Math.floor(stableHash(input) * 360);
}

/** Stable pseudo-random within [min, max). */
export function hashRange(input: string, min: number, max: number): number {
    return min + stableHash(input) * (max - min);
}
