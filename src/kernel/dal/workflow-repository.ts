/**
 * WorkflowRepository — DAL wrapper for Builder Agent workflow persistence.
 *
 * Single Dexie table:
 *   - workflows: workflow records (id, status, version, createdAt)
 */
import type { DatabaseService } from '../services/database-service';
import type { FlowId, WorkflowRecord, WorkflowStatus } from '../types/builder-types';

export class WorkflowRepository {
    constructor(private db: DatabaseService) {}

    async put(record: WorkflowRecord): Promise<void> {
        await this.db.workflows.put(record);
    }

    async get(id: FlowId): Promise<WorkflowRecord | undefined> {
        return this.db.workflows.get(id);
    }

    async list(opts?: { status?: WorkflowStatus; limit?: number }): Promise<WorkflowRecord[]> {
        let rows = await this.db.workflows.toArray();
        if (opts?.status) rows = rows.filter((r) => r.status === opts.status);
        rows.sort((a, b) => b.createdAt - a.createdAt);
        if (opts?.limit && rows.length > opts.limit) rows = rows.slice(0, opts.limit);
        return rows;
    }

    async delete(id: FlowId): Promise<void> {
        await this.db.workflows.delete(id);
    }

    async clear(): Promise<void> {
        await this.db.workflows.clear();
    }
}
