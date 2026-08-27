export function getFNVEmbedding(text: string, dims = 128): number[] {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const vec = new Array(dims).fill(0);
    for (const word of words) {
        for (let d = 0; d < dims; d++) {
            const seed = `${d}:${word}`;
            let h = 0x811c9dc5;
            for (let i = 0; i < seed.length; i++) {
                h ^= seed.charCodeAt(i);
                h = (h * 0x01000193) >>> 0;
            }
            vec[d] += ((h >>> 17) & 1) === 0 ? 1 : -1;
        }
    }
    const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
        for (let d = 0; d < dims; d++) vec[d] /= magnitude;
    }
    return vec;
}

export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!;
    return dot;
}
