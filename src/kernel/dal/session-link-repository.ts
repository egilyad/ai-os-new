import type { DatabaseService } from '../services/database-service';
import type { SessionLink } from '../contracts/session-manager';

export class SessionLinkRepository {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    async put(link: SessionLink): Promise<void> {
        await this.db.sessionLinks.put(link);
    }

    async getByFromId(fromId: string): Promise<SessionLink[]> {
        return this.db.sessionLinks.where('fromId').equals(fromId).toArray();
    }

    async getByToId(toId: string): Promise<SessionLink[]> {
        return this.db.sessionLinks.where('toId').equals(toId).toArray();
    }

    async getByEitherId(id: string): Promise<SessionLink[]> {
        const [from, to] = await Promise.all([this.getByFromId(id), this.getByToId(id)]);
        return [...from, ...to];
    }

    async deleteByFromId(fromId: string): Promise<void> {
        await this.db.sessionLinks.where('fromId').equals(fromId).delete();
    }

    async deleteByToId(toId: string): Promise<void> {
        await this.db.sessionLinks.where('toId').equals(toId).delete();
    }

    async deleteByEitherId(id: string): Promise<void> {
        await Promise.all([this.deleteByFromId(id), this.deleteByToId(id)]);
    }

    async clear(): Promise<void> {
        await this.db.sessionLinks.clear();
    }
}
