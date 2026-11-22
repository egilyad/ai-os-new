/**
 * Mission ledger (Magentic-One-style Task Ledger + Progress Ledger).
 *
 * Holds structured facts and tasks for a mission, reflects after each step
 * and advises a replan when several steps produce no new facts/progress.
 */
import type {
    IMissionLedgerService,
    LedgerSnapshot,
    LedgerTask,
} from '../../contracts/mission-ledger';

const STALL_LIMIT = 3;

interface LedgerState {
    goal: string;
    facts: LedgerSnapshot['facts'];
    tasks: LedgerTask[];
    stalls: number;
    lastProgressAt: number;
}

let seq = 0;

export class MissionLedgerService implements IMissionLedgerService {
    private ledgers = new Map<string, LedgerState>();

    async init(): Promise<void> {}

    async destroy(): Promise<void> {
        this.ledgers.clear();
    }

    start(goal: string): string {
        const id = `ledger-${Date.now()}-${++seq}`;
        this.ledgers.set(id, {
            goal,
            facts: [],
            tasks: [],
            stalls: 0,
            lastProgressAt: Date.now(),
        });
        return id;
    }

    get(missionId: string): LedgerSnapshot | undefined {
        const s = this.ledgers.get(missionId);
        if (!s) return undefined;
        const done = s.tasks.filter((t) => t.status === 'done').length;
        return {
            facts: [...s.facts],
            tasks: s.tasks.map((t) => ({ ...t })),
            stalls: s.stalls,
            progress: s.tasks.length === 0 ? 0 : done / s.tasks.length,
        };
    }

    addFact(missionId: string, text: string, sourceNodeId?: string): void {
        const s = this.ledgers.get(missionId);
        if (!s) return;
        s.facts.push({
            id: `fact-${Date.now()}-${s.facts.length}`,
            text,
            sourceNodeId,
            createdAt: Date.now(),
        });
        s.lastProgressAt = Date.now();
        s.stalls = 0;
    }

    setTasks(missionId: string, tasks: LedgerTask[]): void {
        const s = this.ledgers.get(missionId);
        if (!s) return;
        s.tasks = tasks.map((t) => ({ ...t }));
    }

    recordStep(missionId: string, nodeId: string, ok: boolean): boolean {
        const s = this.ledgers.get(missionId);
        if (!s) return false;
        const task = s.tasks.find((t) => t.id === nodeId);
        if (task) {
            task.status = ok ? 'done' : 'failed';
        }
        const progressed = ok || task !== undefined;
        if (progressed) {
            s.lastProgressAt = Date.now();
            s.stalls = 0;
            return false;
        }
        s.stalls += 1;
        return s.stalls >= STALL_LIMIT;
    }

    finish(missionId: string): void {
        this.ledgers.delete(missionId);
    }
}
