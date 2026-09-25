import { getDexieDb } from './database-service';
import type { AgentRepository } from '../types/agems-agent';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('AgentRepository');

export class AgentRepositoryService {
    async link(agentId: string, repoUrl: string, branch: string, isDefault = false): Promise<AgentRepository> {
        const existing = await getDexieDb().agentRepositories
            .where('agentId')
            .equals(agentId)
            .toArray();
        const record: AgentRepository = {
            agentId,
            repositoryId: `repo-${crypto.randomUUID()}`,
            repoUrl,
            branch,
            isDefault: isDefault || existing.length === 0,
            createdAt: Date.now(),
        };
        if (isDefault && existing.length > 0) {
            for (const r of existing) {
                await getDexieDb().agentRepositories.update(r.id!, { isDefault: false });
            }
        }
        const id = await getDexieDb().agentRepositories.add(record as never);
        record.id = id;
        LOGGER.info('AgentRepository', 'linked', { agentId, repoUrl, branch });
        return record;
    }

    async listByAgent(agentId: string): Promise<AgentRepository[]> {
        return (await getDexieDb().agentRepositories
            .where('agentId')
            .equals(agentId)
            .sortBy('isDefault') as unknown as AgentRepository[]).reverse();
    }

    async getDefault(agentId: string): Promise<AgentRepository | undefined> {
        const all = await this.listByAgent(agentId);
        return all.find((r) => r.isDefault);
    }

    async unlink(repositoryId: string): Promise<void> {
        await getDexieDb().agentRepositories.delete(repositoryId as never);
    }
}

export const agentRepositoryService = new AgentRepositoryService();
