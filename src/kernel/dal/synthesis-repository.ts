/**
 * SynthesisRepository — DAL wrapper for synthesis session persistence.
 *
 * Two Dexie tables:
 *   - synthSessions:     synthesis header rows (id, status, question, ...)
 *   - synthPerspectives: one row per role×lens perspective
 */
import type { DatabaseService } from '../services/database-service';
import type {
    SynthesisId,
    SynthesisPerspectiveRecord,
    SynthesisSessionRecord,
} from '../types/synthesis-types';

export class SynthesisRepository {
    constructor(private db: DatabaseService) {}

    async putSession(session: SynthesisSessionRecord): Promise<void> {
        await this.db.synthSessions.put(session);
    }

    async getSession(id: SynthesisId): Promise<SynthesisSessionRecord | undefined> {
        return this.db.synthSessions.get(id);
    }

    async listSessions(opts?: {
        status?: string;
        limit?: number;
    }): Promise<SynthesisSessionRecord[]> {
        let rows = await this.db.synthSessions.toArray();
        if (opts?.status) rows = rows.filter((r) => r.status === opts.status);
        rows.sort((a, b) => b.createdAt - a.createdAt);
        if (opts?.limit && rows.length > opts.limit) rows = rows.slice(0, opts.limit);
        return rows;
    }

    async putPerspective(perspective: SynthesisPerspectiveRecord): Promise<void> {
        await this.db.synthPerspectives.put(perspective);
    }

    async getPerspectives(synthesisId: SynthesisId): Promise<SynthesisPerspectiveRecord[]> {
        return this.db.synthPerspectives.where('synthesisId').equals(synthesisId).sortBy('id');
    }

    async delete(id: SynthesisId): Promise<void> {
        await this.db.synthSessions.delete(id);
        await this.db.synthPerspectives.where('synthesisId').equals(id).delete();
    }

    async clear(): Promise<void> {
        await this.db.synthSessions.clear();
        await this.db.synthPerspectives.clear();
    }
}
