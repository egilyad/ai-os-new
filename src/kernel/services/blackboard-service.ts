import { EVENTS } from '../events/event-names';

export interface BlackboardEntry {
    key: string;
    value: unknown;
    author: string;
    timestamp: number;
    ttl?: number;
    visibility: 'public' | 'group' | 'private';
}

export interface BlackboardServiceDeps {
    eventBus: {
        onSafe: <T>(event: string, cb: (data: T) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
    };
}

export class BlackboardService {
    private static MAX_ENTRIES = 5000;
    private deps: BlackboardServiceDeps;
    private entries: Map<string, BlackboardEntry> = new Map();
    private subscribers: Array<(entry: BlackboardEntry) => void> = [];
    private cleanupTimer: ReturnType<typeof setInterval> | null = null;

    constructor(deps: BlackboardServiceDeps) {
        this.deps = deps;
    }

    init() {
        this.cleanupTimer = setInterval(() => this.evictExpired(), 30000);
    }

    destroy() {
        if (this.cleanupTimer) clearInterval(this.cleanupTimer);
        this.subscribers.length = 0;
        this.entries.clear();
    }

    post(
        agentId: string,
        key: string,
        value: unknown,
        opts?: { ttl?: number; visibility?: 'public' | 'group' | 'private' },
    ) {
        const entry: BlackboardEntry = {
            key,
            value,
            author: agentId,
            timestamp: Date.now(),
            ttl: opts?.ttl,
            visibility: opts?.visibility || 'public',
        };
        this.entries.set(key, entry);
        if (this.entries.size > BlackboardService.MAX_ENTRIES) {
            const oldest = this.entries.keys().next().value;
            if (oldest !== undefined) this.entries.delete(oldest);
        }
        this.deps.eventBus.emit(EVENTS.AGENT_BLACKBOARD_UPDATED, { agentId: agentId, key, value });
    }

    read(agentId?: string, visibility?: 'public' | 'group' | 'private'): BlackboardEntry[] {
        const all = Array.from(this.entries.values());
        return all
            .filter((e) => {
                if (visibility && e.visibility !== visibility) return false;
                if (e.visibility === 'public') return true;
                if (e.visibility === 'private' && agentId && e.author === agentId) return true;
                if (e.visibility === 'group') return true;
                return false;
            })
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    get(key: string): BlackboardEntry | undefined {
        return this.entries.get(key);
    }

    delete(key: string) {
        this.entries.delete(key);
    }

    subscribe(cb: (entry: BlackboardEntry) => void): () => void {
        this.subscribers.push(cb);
        return () => {
            const idx = this.subscribers.indexOf(cb);
            if (idx >= 0) this.subscribers.splice(idx, 1);
        };
    }

    private evictExpired() {
        const now = Date.now();
        for (const [key, entry] of this.entries) {
            if (entry.ttl && now - entry.timestamp > entry.ttl) {
                this.entries.delete(key);
            }
        }
    }
}
