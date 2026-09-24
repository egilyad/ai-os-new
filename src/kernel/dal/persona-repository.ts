/**
 * PersonaRepository — DAL for Wave 4 (Persona & Context).
 *
 * Dexie v26 tables:
 *   - ltMemories: 'id, ownerId, tier, createdAt'
 *   - memoryLinks: 'id, fromId, toId, createdAt'
 *   - personaProfiles: 'id, ownerId, createdAt'
 *   - personaDepths: 'id, ownerId, createdAt'
 *   - sharedContexts: 'id, createdAt'
 *   - contextEntries: 'id, contextId, kind, createdAt'
 *   - goals: 'id, ownerId, status, createdAt'
 */
import type { DatabaseService } from '../services/database-service';
import type {
    ContextEntry,
    Goal,
    LongTermMemory,
    MemoryLink,
    PersonProfile,
    PersonaDepth,
    SharedContext,
    VoiceProfile,
} from '../types/persona-types';

export type VoiceProfileRecord = VoiceProfile;

export class PersonaRepository {
    constructor(private db: DatabaseService) {}

    // ── Long-term memories ──
    async putMemory(m: LongTermMemory): Promise<void> {
        await this.db.ltMemories.put({ ...m });
    }

    async getMemory(id: string): Promise<LongTermMemory | null> {
        const r = await this.db.ltMemories.get(id);
        return r ? { ...r } : null;
    }

    async listMemories(ownerId: string): Promise<LongTermMemory[]> {
        const rows = await this.db.ltMemories.where('ownerId').equals(ownerId).toArray();
        rows.sort((a, b) => b.updatedAt - a.updatedAt);
        return rows.map((r) => ({ ...r }));
    }

    async deleteMemory(id: string): Promise<void> {
        const links = await this.db.memoryLinks.toArray();
        await Promise.all(
            links
                .filter((l) => l.fromId === id || l.toId === id)
                .map((l) => this.db.memoryLinks.delete(l.id)),
        );
        await this.db.ltMemories.delete(id);
    }

    async putLink(l: MemoryLink): Promise<void> {
        await this.db.memoryLinks.put({ ...l });
    }

    async listLinks(): Promise<MemoryLink[]> {
        const rows = await this.db.memoryLinks.toArray();
        return rows.map((r) => ({ ...r }));
    }

    // ── Person / voice / depth ──
    async putPerson(p: PersonProfile): Promise<void> {
        await this.db.personaProfiles.put({ ...p });
    }

    async getPersonByOwner(ownerId: string): Promise<PersonProfile | null> {
        const rows = await this.db.personaProfiles.where('ownerId').equals(ownerId).toArray();
        return rows.length > 0 ? { ...rows[0]! } : null;
    }

    async putVoice(v: VoiceProfile): Promise<void> {
        await this.db.voices.put({ ...v });
    }

    async getVoice(personId: string): Promise<VoiceProfile | null> {
        const rows = await this.db.voices.where('personId').equals(personId).toArray();
        return rows.length > 0 ? { ...rows[0]! } : null;
    }

    async putDepth(d: PersonaDepth): Promise<void> {
        await this.db.personaDepths.put({ ...d });
    }

    async getDepth(ownerId: string): Promise<PersonaDepth | null> {
        const rows = await this.db.personaDepths.where('ownerId').equals(ownerId).toArray();
        return rows.length > 0 ? { ...rows[0]! } : null;
    }

    // ── Shared contexts ──
    async putContext(c: SharedContext): Promise<void> {
        await this.db.sharedContexts.put({ ...c });
    }

    async getContext(id: string): Promise<SharedContext | null> {
        const r = await this.db.sharedContexts.get(id);
        return r ? { ...r } : null;
    }

    async listContexts(): Promise<SharedContext[]> {
        const rows = await this.db.sharedContexts.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map((r) => ({ ...r }));
    }

    async putEntry(e: ContextEntry): Promise<void> {
        await this.db.contextEntries.put({ ...e });
    }

    async listEntries(contextId: string): Promise<ContextEntry[]> {
        const rows = await this.db.contextEntries.where('contextId').equals(contextId).toArray();
        rows.sort((a, b) => a.createdAt - b.createdAt);
        return rows.map((r) => ({ ...r }));
    }

    // ── Goals ──
    async putGoal(g: Goal): Promise<void> {
        await this.db.goals.put({ ...g });
    }

    async getGoal(id: string): Promise<Goal | null> {
        const r = await this.db.goals.get(id);
        return r ? { ...r } : null;
    }

    async listGoals(): Promise<Goal[]> {
        const rows = await this.db.goals.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map((r) => ({ ...r }));
    }

    async clear(): Promise<void> {
        await this.db.goals.clear();
        await this.db.contextEntries.clear();
        await this.db.sharedContexts.clear();
        await this.db.personaDepths.clear();
        await this.db.voices.clear();
        await this.db.personaProfiles.clear();
        await this.db.memoryLinks.clear();
        await this.db.ltMemories.clear();
    }
}
