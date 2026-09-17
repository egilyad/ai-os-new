/**
 * Tool Loop Detector — AGEMS Phase 12.1
 * Sliding window (20) + hash dedup (threshold 4) + ping-pong detection
 */
export class ToolLoopDetector {
    private window: string[] = [];
    private seen = new Map<string, number>();
    private readonly WINDOW_SIZE = 20;
    private readonly DEDUP_THRESHOLD = 4;

    detect(tools: string[]): { loop: boolean; shouldBreak: boolean; reason?: string } {
        const key = tools.join('|');
        this.window.push(key);
        if (this.window.length > this.WINDOW_SIZE) this.window.shift();

        const count = (this.seen.get(key) ?? 0) + 1;
        this.seen.set(key, count);

        if (count >= this.DEDUP_THRESHOLD) {
            return { loop: true, shouldBreak: true, reason: `Hash dedup threshold ${this.DEDUP_THRESHOLD} for "${key}"` };
        }

        // Ping-pong A-B-A-B
        if (this.window.length >= 4) {
            const last4 = this.window.slice(-4);
            if (last4[0] === last4[2] && last4[1] === last4[3] && last4[0] !== last4[1]) {
                return { loop: true, shouldBreak: true, reason: `Ping-pong ${last4[0]} ↔ ${last4[1]}` };
            }
        }

        // Sliding window repetition: same tool repeated 5 times in window
        const lastTool = tools[tools.length - 1];
        if (lastTool) {
            const repeats = this.window.filter((k) => k === key).length;
            if (repeats >= 5) {
                return { loop: true, shouldBreak: false, reason: `Repeated tool "${lastTool}" x${repeats}` };
            }
        }

        return { loop: false, shouldBreak: false };
    }

    reset(): void {
        this.window = [];
        this.seen.clear();
    }
}
