import type { DatabaseService } from '../services/database-service';
import type { DebateOverride } from '../contracts/session-manager';

export class DebateOverrideRepository {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    async put(override: DebateOverride): Promise<void> {
        await this.db.debateOverrides.put(override);
    }

    async getBySessionId(sessionId: string): Promise<DebateOverride[]> {
        return this.db.debateOverrides.where('sessionId').equals(sessionId).sortBy('appliedAt');
    }

    async deleteBySessionId(sessionId: string): Promise<void> {
        await this.db.debateOverrides.where('sessionId').equals(sessionId).delete();
    }

    async clear(): Promise<void> {
        await this.db.debateOverrides.clear();
    }
}
