/**
 * TraceRepository — DAL wrapper for execution traces/telemetry
 *
 * Provides typed access to performance and execution data.
 */

import type { DatabaseService } from '../services/database-service';
import type { ExecutionTrace } from '../contracts/observability';

const DEFAULT_LIMIT = 500;

export class TraceRepository {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    async getAll(limit: number = DEFAULT_LIMIT): Promise<ExecutionTrace[]> {
        return this.db.traces.orderBy('startTime').reverse().limit(limit).toArray();
    }

    async get(id: string): Promise<ExecutionTrace | undefined> {
        return this.db.traces.get(id);
    }

    async save(trace: ExecutionTrace): Promise<void> {
        await this.db.traces.put(trace);
    }

    async delete(id: string): Promise<void> {
        await this.db.traces.delete(id);
    }

    async listRecent(limit: number = 50): Promise<ExecutionTrace[]> {
        return this.getAll(limit);
    }

    async clear(): Promise<void> {
        await this.db.traces.clear();
    }
}
