/**
 * GeneratorRepository — DAL wrapper for knowledge-generator job persistence.
 *
 * One Dexie table:
 *   - genJobs: generation job rows (id, status, trigger.kind, createdAt)
 */
import type { DatabaseService } from '../services/database-service';
import type {
    GenerationJobId,
    GenerationJobRecord,
    GenerationStatus,
    GenerationTrigger,
} from '../types/generator-types';

export class GeneratorRepository {
    constructor(private db: DatabaseService) {}

    async putJob(job: GenerationJobRecord): Promise<void> {
        await this.db.genJobs.put(job);
    }

    async getJob(id: GenerationJobId): Promise<GenerationJobRecord | undefined> {
        return this.db.genJobs.get(id);
    }

    async listJobs(opts?: {
        status?: GenerationStatus;
        triggerKind?: GenerationTrigger['kind'];
        limit?: number;
    }): Promise<GenerationJobRecord[]> {
        let rows = await this.db.genJobs.toArray();
        if (opts?.status) rows = rows.filter((r) => r.status === opts.status);
        if (opts?.triggerKind) rows = rows.filter((r) => r.trigger.kind === opts.triggerKind);
        rows.sort((a, b) => b.createdAt - a.createdAt);
        if (opts?.limit && rows.length > opts.limit) rows = rows.slice(0, opts.limit);
        return rows;
    }

    async delete(id: GenerationJobId): Promise<void> {
        await this.db.genJobs.delete(id);
    }

    async clear(): Promise<void> {
        await this.db.genJobs.clear();
    }
}
