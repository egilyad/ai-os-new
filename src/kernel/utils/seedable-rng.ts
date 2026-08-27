export class SeededRng {
    private state: number;

    constructor(seed?: number) {
        this.state = seed ?? Date.now();
    }

    /** Returns a float in [0, 1). Mulberry32 algorithm — fast, deterministic, good distribution. */
    next(): number {
        this.state |= 0;
        this.state = (this.state + 0x6d2b79f5) | 0;
        let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /** Returns an integer in [min, max] inclusive. */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /** Picks a random element from an array. */
    pick<T>(arr: T[]): T {
        return arr[Math.floor(this.next() * arr.length)]!;
    }

    /** Returns true with given probability (0..1). */
    chance(probability: number): boolean {
        return this.next() < probability;
    }

    /** Creates a new RNG instance with a derived seed (for parallel computations). */
    fork(): SeededRng {
        return new SeededRng(this.nextInt(1, 2147483647));
    }
}
