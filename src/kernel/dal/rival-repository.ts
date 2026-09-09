/**
 * RivalRepository — DAL for Phase F (Dexie v33, 5 tables).
 *
 *   - agentLoops: 'id, kind, status, createdAt'
 *   - groupChats: 'id, status, createdAt'
 *   - memoryBlocks: 'id, ownerId, section, createdAt'
 *   - runQueue: 'id, status, createdAt'
 *   - threads: 'id, graphId, createdAt'
 */
import type { DatabaseService } from '../services/database-service';
import type {
    AgentLoop,
    GroupChat,
    MemoryBlock,
    QueuedRun,
} from '../types/rival-types';

function clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
}

export class RivalRepository {
    constructor(private db: DatabaseService) {}

    // ── Loops ──
    async putLoop(l: AgentLoop): Promise<void> {
        await this.db.agentLoops.put(clone(l));
    }

    async getLoop(id: string): Promise<AgentLoop | null> {
        const r = await this.db.agentLoops.get(id);
        return r ? clone(r) : null;
    }

    async listLoops(): Promise<AgentLoop[]> {
        const rows = await this.db.agentLoops.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    // ── Group chats ──
    async putChat(c: GroupChat): Promise<void> {
        await this.db.groupChats.put(clone(c));
    }

    async getChat(id: string): Promise<GroupChat | null> {
        const r = await this.db.groupChats.get(id);
        return r ? clone(r) : null;
    }

    async listChats(): Promise<GroupChat[]> {
        const rows = await this.db.groupChats.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    // ── Memory blocks ──
    async putBlock(b: MemoryBlock): Promise<void> {
        await this.db.memoryBlocks.put(clone(b));
    }

    async listBlocks(): Promise<MemoryBlock[]> {
        return (await this.db.memoryBlocks.toArray()).map(clone);
    }

    // ── Run queue ──
    async putQueued(q: QueuedRun): Promise<void> {
        await this.db.runQueue.put(clone(q));
    }

    async getQueued(id: string): Promise<QueuedRun | null> {
        const r = await this.db.runQueue.get(id);
        return r ? clone(r) : null;
    }

    async listQueued(): Promise<QueuedRun[]> {
        const rows = await this.db.runQueue.toArray();
        rows.sort((a, b) => a.createdAt - b.createdAt);
        return rows.map(clone);
    }

    async clear(): Promise<void> {
        await this.db.runQueue.clear();
        await this.db.memoryBlocks.clear();
        await this.db.groupChats.clear();
        await this.db.agentLoops.clear();
    }
}
