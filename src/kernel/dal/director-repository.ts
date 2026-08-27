/**
 * DirectorRepository — DAL wrapper for Conversation Director run-history
 * persistence (Q7).
 *
 * Single Dexie table:
 *   - directorSessions: live ConversationSession run records
 *     (id, scenarioId, status, createdAt, updatedAt)
 *
 * Each launch of a scenario produces a distinct session (distinct id), and
 * operator checkpoints are stored inside the session record. This lets the
 * Director panel show past runs and their captured checkpoints after reload.
 *
 * The persisted model is `ConversationSession` (defined in
 * `contracts/conversation/session`) — no duplicate schema.
 */
import type { DatabaseService } from '../services/database-service';
import type { ConversationSession, SessionStatus } from '../contracts/conversation/session';

export class DirectorRepository {
    constructor(private db: DatabaseService) {}

    async put(record: ConversationSession): Promise<void> {
        await this.db.directorSessions.put(record);
    }

    async get(id: string): Promise<ConversationSession | undefined> {
        return this.db.directorSessions.get(id);
    }

    async list(opts?: {
        scenarioId?: string;
        status?: SessionStatus;
        limit?: number;
    }): Promise<ConversationSession[]> {
        let rows = await this.db.directorSessions.toArray();
        if (opts?.scenarioId) rows = rows.filter((r) => r.scenarioId === opts.scenarioId);
        if (opts?.status) rows = rows.filter((r) => r.status === opts.status);
        rows.sort((a, b) => b.updatedAt - a.updatedAt);
        if (opts?.limit && rows.length > opts.limit) rows = rows.slice(0, opts.limit);
        return rows;
    }

    async delete(id: string): Promise<void> {
        await this.db.directorSessions.delete(id);
    }

    async clear(): Promise<void> {
        await this.db.directorSessions.clear();
    }
}
