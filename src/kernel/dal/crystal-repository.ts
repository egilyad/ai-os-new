/**
 * CrystalRepository — DAL wrapper for crystal knowledge units.
 *
 * Two Dexie tables:
 *   - crystals:        latest version per crystalId (primary key crystalId)
 *   - crystalVersions: full version history indexed by [crystalId+version]
 */
import type { DatabaseService } from '../services/database-service';
import type { Crystal, CrystalId } from '../types/crystal-types';

export class CrystalRepository {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    async put(crystal: Crystal): Promise<void> {
        await this.db.crystals.put(crystal);
        await this.db.crystalVersions.put(crystal);
    }

    async get(crystalId: CrystalId): Promise<Crystal | undefined> {
        return this.db.crystals.get(crystalId);
    }

    async getVersion(crystalId: CrystalId, version: number): Promise<Crystal | undefined> {
        return this.db.crystalVersions.get([crystalId, version]);
    }

    async getHistory(crystalId: CrystalId): Promise<Crystal[]> {
        return this.db.crystalVersions.where('crystalId').equals(crystalId).sortBy('version');
    }

    async list(): Promise<Crystal[]> {
        return this.db.crystals.toArray();
    }

    async delete(crystalId: CrystalId): Promise<void> {
        await this.db.crystals.delete(crystalId);
        await this.db.crystalVersions.where('crystalId').equals(crystalId).delete();
    }

    async clear(): Promise<void> {
        await this.db.crystals.clear();
        await this.db.crystalVersions.clear();
    }
}
