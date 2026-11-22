/**
 * Mid-reply steering (AgentScope-inspired, E2).
 *
 * Queues short operator hints and drains them into a single prompt block that
 * can be injected at the next model call. Complements middleware's hook state.
 */
import type { ISteeringService, SteeringHint } from '../../contracts/steering';

let seq = 0;

export class SteeringService implements ISteeringService {
    private hints: SteeringHint[] = [];

    push(hint: Omit<SteeringHint, 'id' | 'createdAt'>): SteeringHint {
        const full: SteeringHint = {
            ...hint,
            id: `hint-${Date.now()}-${++seq}`,
            createdAt: Date.now(),
        };
        this.hints.push(full);
        this.hints.sort((a, b) => {
            const order = { high: 0, normal: 1, low: 2 };
            return order[a.priority] - order[b.priority] || a.createdAt - b.createdAt;
        });
        return full;
    }

    drain(max = 5): string | null {
        const batch = this.hints.slice(0, max);
        if (batch.length === 0) return null;
        const consumedIds = new Set(batch.map((h) => h.id));
        this.hints = this.hints.filter((h) => !consumedIds.has(h.id));
        return [
            '<steering-hints>',
            ...batch.map((h) => `- [${h.priority}] ${h.text}`),
            '</steering-hints>',
        ].join('\n');
    }

    pending(): SteeringHint[] {
        return [...this.hints];
    }

    clear(): void {
        this.hints = [];
    }
}
