/**
 * Tool Loop Detector — AGEMS port, Phase 12.1.
 * Detects tool call loops (same tool called repeatedly, ping-pong patterns).
 */
export interface LoopDetectionResult {
    loop: boolean;
    shouldBreak: boolean;
    pattern?: string;
}

export class ToolLoopDetector {
    private windowSize: number;
    private hashDedupThreshold: number;
    private window: string[] = [];
    private seen = new Map<string, number>();

    constructor(windowSize = 20, hashDedupThreshold = 4) {
        this.windowSize = windowSize;
        this.hashDedupThreshold = hashDedupThreshold;
    }

    /**
     * Detect if a sequence of tool calls contains a loop.
     * @param tools - Array of tool call hashes/names
     * @returns Detection result
     */
    detect(tools: string[]): LoopDetectionResult {
        if (tools.length === 0) {
            return { loop: false, shouldBreak: false };
        }

        // Update sliding window
        for (const tool of tools) {
            this.window.push(tool);
            if (this.window.length > this.windowSize) {
                const removed = this.window.shift()!;
                const count = this.seen.get(removed) ?? 1;
                if (count <= 1) this.seen.delete(removed);
                else this.seen.set(removed, count - 1);
            }
            this.seen.set(tool, (this.seen.get(tool) ?? 0) + 1);
        }

        // Check for hash dedup: same tool called >= threshold times
        for (const [tool, count] of this.seen) {
            if (count >= this.hashDedupThreshold) {
                return {
                    loop: true,
                    shouldBreak: true,
                    pattern: `Tool "${tool}" called ${count} times (threshold: ${this.hashDedupThreshold})`,
                };
            }
        }

        // Check for ping-pong (A-B-A-B pattern)
        const pingPong = this.detectPingPong();
        if (pingPong) {
            return { loop: true, shouldBreak: true, pattern: pingPong };
        }

        return { loop: false, shouldBreak: false };
    }

    /**
     * Detect ping-pong pattern: A-B-A-B repeating.
     */
    private detectPingPong(): string | null {
        if (this.window.length < 4) return null;

        // Check last 4+ entries for alternating pattern
        const last = this.window.slice(-6);
        if (last.length < 4) return null;

        // Check if pattern alternates between two tools
        const a = last[0];
        const b = last[1];
        if (a === b) return null; // Not alternating

        let alternating = true;
        for (let i = 2; i < last.length; i++) {
            const expected = i % 2 === 0 ? a : b;
            if (last[i] !== expected) {
                alternating = false;
                break;
            }
        }

        if (alternating && last.length >= 4) {
            return `Ping-pong pattern detected: ${a} → ${b} → ${a} → ${b} (${last.length} iterations)`;
        }
        return null;
    }

    /**
     * Reset the detector state.
     */
    reset(): void {
        this.window = [];
        this.seen.clear();
    }

    /**
     * Get current window state.
     */
    getWindow(): string[] {
        return [...this.window];
    }
}
