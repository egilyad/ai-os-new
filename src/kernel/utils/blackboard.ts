/**
 * P3-2: a minimal shared blackboard (global workspace) for multi-agent
 * coordination. Agents post observations to named keys and read from them.
 * Every post is recorded in an undo stack, so the board can be rolled back —
 * the primitive also underpins the P3-4 auto-repair/rollback flow.
 */
export class Blackboard {
    private readonly data = new Map<string, unknown>();
    private readonly undo: Array<{ key: string; prev: unknown }> = [];

    post(key: string, value: unknown): void {
        this.undo.push({ key, prev: this.data.get(key) });
        this.data.set(key, value);
    }

    read<T>(key: string): T | undefined {
        return this.data.get(key) as T | undefined;
    }

    has(key: string): boolean {
        return this.data.has(key);
    }

    keys(): string[] {
        return [...this.data.keys()];
    }

    get size(): number {
        return this.data.size;
    }

    /** Undo the last post (restores previous value; undefined clears it). */
    rollback(): boolean {
        const last = this.undo.pop();
        if (!last) return false;
        if (last.prev === undefined) this.data.delete(last.key);
        else this.data.set(last.key, last.prev);
        return true;
    }

    clear(): void {
        this.data.clear();
        this.undo.length = 0;
    }
}
