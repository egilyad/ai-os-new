/**
 * percentile — linear-interpolated percentile over a sorted, non-empty array.
 *
 * W6-034: the naive `sorted[floor(len * p)]` is off-by-one for small arrays
 * (p50 of 2 samples returns the max). Using `(len-1) * p` with interpolation
 * gives unbiased estimates across all sizes.
 */
export function percentile(sorted: readonly number[], p: number): number {
    if (sorted.length === 0) return 0;
    const clamped = Math.max(0, Math.min(1, p));
    const idx = (sorted.length - 1) * clamped;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo]!;
    return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo);
}
