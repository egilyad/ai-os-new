/**
 * ScenarioRepository — DAL wrapper for Conversation Director scenario persistence.
 *
 * Single Dexie table:
 *   - scenarios: conversation scenario records (id, status, version, createdAt)
 *
 * Mirrors the existing repository conventions (see WorkflowRepository).
 * The persisted model is `ConversationScenario` (defined in
 * `contracts/conversation`), reusing `TurnProposal` — no duplicate schema.
 */
import type { DatabaseService } from '../services/database-service';
import type { ConversationScenario, ScenarioStatus, TurnProposal } from '../contracts/conversation';
import { genId } from '../../utils/gen-id';

export class ScenarioRepository {
    constructor(private db: DatabaseService) {}

    async put(record: ConversationScenario): Promise<void> {
        await this.db.scenarios.put(record);
    }

    /** Create a brand-new scenario draft from admin-authored inputs. */
    async create(input: {
        name: string;
        description: string;
        topic?: string;
        participants: Array<{ id: string; role: string }>;
        turns: TurnProposal[];
    }): Promise<ConversationScenario> {
        const now = Date.now();
        const record: ConversationScenario = {
            id: genId('scenario'),
            name: input.name,
            description: input.description,
            topic: input.topic,
            version: 1,
            status: 'draft',
            participants: input.participants,
            turns: input.turns,
            createdAt: now,
            updatedAt: now,
        };
        await this.put(record);
        return record;
    }

    async save(record: ConversationScenario): Promise<void> {
        await this.put(record);
    }

    async get(id: string): Promise<ConversationScenario | undefined> {
        return this.db.scenarios.get(id);
    }

    async list(opts?: {
        status?: ScenarioStatus;
        limit?: number;
    }): Promise<ConversationScenario[]> {
        let rows = await this.db.scenarios.toArray();
        if (opts?.status) rows = rows.filter((r) => r.status === opts.status);
        rows.sort((a, b) => b.updatedAt - a.updatedAt);
        if (opts?.limit && rows.length > opts.limit) rows = rows.slice(0, opts.limit);
        return rows;
    }

    /** Archive (soft-delete) a scenario by flipping its status. */
    async archive(id: string): Promise<void> {
        const existing = await this.get(id);
        if (!existing) return;
        await this.put({ ...existing, status: 'archived', updatedAt: Date.now() });
    }

    /** Bump the version and updatedAt, returning the new record. */
    async bumpVersion(id: string): Promise<ConversationScenario | undefined> {
        const existing = await this.get(id);
        if (!existing) return undefined;
        const next: ConversationScenario = {
            ...existing,
            version: existing.version + 1,
            updatedAt: Date.now(),
        };
        await this.put(next);
        return next;
    }

    async delete(id: string): Promise<void> {
        await this.db.scenarios.delete(id);
    }

    /** Clone a scenario into a fresh draft (new id, status=draft, version=1, new timestamps). */
    async duplicate(id: string): Promise<ConversationScenario> {
        const existing = await this.get(id);
        if (!existing) {
            throw new Error(`ScenarioRepository: cannot duplicate missing scenario '${id}'`);
        }
        const now = Date.now();
        const copy: ConversationScenario = {
            ...existing,
            id: genId('scenario'),
            name: `${existing.name} (copy)`,
            status: 'draft',
            version: 1,
            createdAt: now,
            updatedAt: now,
        };
        await this.put(copy);
        return copy;
    }

    async clear(): Promise<void> {
        await this.db.scenarios.clear();
    }
}
