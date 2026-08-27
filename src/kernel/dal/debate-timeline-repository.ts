import type { DatabaseService } from '../services/database-service';
import type { DebateTimelineEntry } from '../contracts/session-manager';

export class DebateTimelineRepository {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    async put(entry: DebateTimelineEntry): Promise<void> {
        await this.db.debateTimeline.put(entry);
    }

    async getBySessionId(sessionId: string): Promise<DebateTimelineEntry[]> {
        return this.db.debateTimeline.where('sessionId').equals(sessionId).sortBy('timestamp');
    }

    async deleteBySessionId(sessionId: string): Promise<void> {
        await this.db.debateTimeline.where('sessionId').equals(sessionId).delete();
    }

    async clear(): Promise<void> {
        await this.db.debateTimeline.clear();
    }
}
