import { EVENTS } from '../events/event-names';

const MAX_HANDOFFS = 200;
const HANDOFF_STORAGE_KEY = 'task_handoffs_v1';

export interface HandoffRequest {
    id: string;
    fromAgent: string;
    toAgent: string;
    description: string;
    context: string;
    expectedOutput?: string;
    deadline?: number;
    priority: 'critical' | 'high' | 'normal' | 'low';
    status: 'pending' | 'accepted' | 'completed' | 'failed' | 'cancelled';
    createdAt: number;
    completedAt?: number;
    result?: string;
}

export interface TaskHandoffServiceDeps {
    eventBus: {
        emit: (event: string, data?: unknown) => void;
    };
    database?: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    getLifecycleState?: (agentId: string) => string | undefined;
}

export class TaskHandoffService {
    private deps: TaskHandoffServiceDeps;
    private handoffs: Map<string, HandoffRequest> = new Map();
    private _initialized = false;

    constructor(deps: TaskHandoffServiceDeps) {
        this.deps = deps;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        if (!this.deps.database) return;
        try {
            const saved = await this.deps.database.getKv<HandoffRequest[]>(HANDOFF_STORAGE_KEY);
            if (saved && Array.isArray(saved)) {
                for (const h of saved) {
                    if (h && h.id) this.handoffs.set(h.id, h);
                }
            }
        } catch {
            /* persist unavailable */
        }
    }

    private async persist(): Promise<void> {
        if (!this.deps.database) return;
        try {
            const toSave = Array.from(this.handoffs.values()).slice(-MAX_HANDOFFS);
            await this.deps.database.setKv(HANDOFF_STORAGE_KEY, toSave);
        } catch {
            /* persist unavailable */
        }
    }

    async handoff(opts: {
        fromAgent: string;
        toAgent: string;
        description: string;
        context: string;
        expectedOutput?: string;
        deadline?: number;
        priority?: 'critical' | 'high' | 'normal' | 'low';
    }): Promise<HandoffRequest> {
        if (this.deps.getLifecycleState) {
            const exists = this.deps.getLifecycleState(opts.toAgent);
            if (!exists) {
                throw new Error(`Handoff target agent "${opts.toAgent}" does not exist`);
            }
        }
        const req: HandoffRequest = {
            id: `handoff-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
            fromAgent: opts.fromAgent,
            toAgent: opts.toAgent,
            description: opts.description,
            context: opts.context,
            expectedOutput: opts.expectedOutput,
            deadline: opts.deadline,
            priority: opts.priority || 'normal',
            status: 'pending',
            createdAt: Date.now(),
        };
        this.handoffs.set(req.id, req);
        if (this.handoffs.size > MAX_HANDOFFS) {
            let oldestKey: string | null = null;
            let oldestTime = Infinity;
            for (const [key, h] of this.handoffs) {
                if (h.createdAt < oldestTime) {
                    oldestTime = h.createdAt;
                    oldestKey = key;
                }
            }
            if (oldestKey) this.handoffs.delete(oldestKey);
        }
        await this.persist();
        this.deps.eventBus.emit(EVENTS.AGENT_HANDOFF_INITIATED, {
            id: req.id,
            fromAgent: req.fromAgent,
            toAgent: req.toAgent,
            description: req.description,
            priority: req.priority,
        });
        return req;
    }

    async accept(id: string) {
        const req = this.handoffs.get(id);
        if (req && req.status === 'pending') {
            req.status = 'accepted';
            await this.persist();
        }
    }

    async complete(id: string, result: string) {
        const req = this.handoffs.get(id);
        if (req) {
            req.status = 'completed';
            req.result = result;
            req.completedAt = Date.now();
            await this.persist();
        }
    }

    async fail(id: string, error: string) {
        const req = this.handoffs.get(id);
        if (req) {
            req.status = 'failed';
            req.result = error;
            req.completedAt = Date.now();
            await this.persist();
        }
    }

    async cancel(id: string) {
        const req = this.handoffs.get(id);
        if (req && (req.status === 'pending' || req.status === 'accepted')) {
            req.status = 'cancelled';
            await this.persist();
        }
    }

    getHandoffs(agentId?: string): HandoffRequest[] {
        const all = Array.from(this.handoffs.values());
        if (agentId) return all.filter((h) => h.fromAgent === agentId || h.toAgent === agentId);
        return all.sort((a, b) => b.createdAt - a.createdAt);
    }

    destroy(): void {
        this._initialized = false;
        this.handoffs.clear();
    }

    getPendingFor(agentId: string): HandoffRequest[] {
        return Array.from(this.handoffs.values())
            .filter((h) => h.toAgent === agentId && h.status === 'pending')
            .sort((a, b) => {
                const prio: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 };
                return (prio[a.priority] ?? 2) - (prio[b.priority] ?? 2);
            });
    }
}
