import { getDexieDb } from './dexie-schema';
import type { AgentConfigRevision, AgemsAgentCore } from '../types/agems-agent';

export class AgentConfigRevisionService {
    async saveRevision(agentId: string, snapshot: AgemsAgentCore, changeset: Record<string, { old: unknown; new: unknown }>, changedBy: string, note?: string): Promise<AgentConfigRevision> {
        const existing = (await getDexieDb().agentConfigRevisions.where('agentId').equals(agentId).toArray()) as unknown as AgentConfigRevision[];
        const version = (existing.reduce((m, r) => Math.max(m, r.version), 0) || 0) + 1;
        const rev: AgentConfigRevision = {
            agentId,
            version,
            changeset,
            snapshot,
            changedBy,
            changeNote: note,
            createdAt: Date.now(),
        };
        const id = (await getDexieDb().agentConfigRevisions.add(rev as never)) as unknown as number;
        return { ...rev, id };
    }

    async list(agentId: string): Promise<AgentConfigRevision[]> {
        return (await getDexieDb().agentConfigRevisions.where('agentId').equals(agentId).sortBy('version')).reverse() as unknown as AgentConfigRevision[];
    }

    async get(agentId: string, version: number): Promise<AgentConfigRevision | undefined> {
        const rows = (await getDexieDb().agentConfigRevisions.where('[agentId+version]').equals([agentId, version]).toArray()) as unknown as AgentConfigRevision[];
        return rows[0];
    }

    async rollback(agentId: string, version: number): Promise<AgemsAgentCore | null> {
        const rev = await this.get(agentId, version);
        return rev?.snapshot ?? null;
    }
}

export const agentConfigRevisionService = new AgentConfigRevisionService();
