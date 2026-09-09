/**
 * ParityRepository — DAL for GAP E.2/E.3 (Dexie v32, 2 tables).
 *
 *   - knowledgeSources: 'id, kind, createdAt'
 *   - trainGuides: 'id, role, createdAt'
 */
import type { DatabaseService } from '../services/database-service';
import type { KnowledgeSource, TrainGuide } from '../types/parity-types';

function clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
}

export class ParityRepository {
    constructor(private db: DatabaseService) {}

    // ── Knowledge ──
    async putSource(s: KnowledgeSource): Promise<void> {
        await this.db.knowledgeSources.put(clone(s));
    }

    async listSources(): Promise<KnowledgeSource[]> {
        const rows = await this.db.knowledgeSources.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    async deleteSource(id: string): Promise<void> {
        await this.db.knowledgeSources.delete(id);
    }

    // ── Training guides ──
    async putGuide(g: TrainGuide): Promise<void> {
        await this.db.trainGuides.put(clone(g));
    }

    async getGuideByRole(role: string): Promise<TrainGuide | null> {
        const rows = await this.db.trainGuides.where('role').equals(role).toArray();
        return rows.length > 0 ? clone(rows[0]!) : null;
    }

    async listGuides(): Promise<TrainGuide[]> {
        return (await this.db.trainGuides.toArray()).map(clone);
    }

    async deleteGuide(id: string): Promise<void> {
        await this.db.trainGuides.delete(id);
    }

    async clear(): Promise<void> {
        await this.db.trainGuides.clear();
        await this.db.knowledgeSources.clear();
    }
}
