import type { DatabaseService } from '../services/database-service';
import type { Junction, JunctionId } from '../types/junction-types';

/**
 * JunctionRepository — DAL wrapper for cross-domain junction persistence.
 */
export class JunctionRepository {
    constructor(private db: DatabaseService) {}

    async put(junction: Junction): Promise<void> {
        await this.db.junctions.put(junction);
    }

    async get(id: JunctionId): Promise<Junction | undefined> {
        return this.db.junctions.get(id);
    }

    async list(): Promise<Junction[]> {
        return this.db.junctions.toArray();
    }

    async delete(id: JunctionId): Promise<void> {
        await this.db.junctions.delete(id);
    }

    async clear(): Promise<void> {
        await this.db.junctions.clear();
    }
}
