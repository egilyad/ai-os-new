import type { AgentConfigRevision, AgemsAgentCore } from '../types/agems-agent';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('AgentConfigRevisionService');

export interface AgentConfigRevisionDeps {
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    eventBus?: {
        emit: (event: string, data?: unknown) => void;
    };
}

const REVISIONS_KEY_PREFIX = 'super_agents_agent_revisions_';

export class AgentConfigRevisionService {
    private deps: AgentConfigRevisionDeps;

    constructor(deps: AgentConfigRevisionDeps) {
        this.deps = deps;
    }

    private getKey(agentId: string): string {
        return `${REVISIONS_KEY_PREFIX}${agentId}`;
    }

    async getRevisions(agentId: string): Promise<AgentConfigRevision[]> {
        try {
            const res = await this.deps.database.getKv<AgentConfigRevision[]>(this.getKey(agentId));
            return res || [];
        } catch (e) {
            LOGGER.error('AgentConfigRevisionService', `Failed to get revisions for agent ${agentId}`, { error: e });
            return [];
        }
    }

    async getRevision(agentId: string, version: number): Promise<AgentConfigRevision | null> {
        const revisions = await this.getRevisions(agentId);
        return revisions.find((r) => r.version === version) || null;
    }

    async saveRevision(
        agentId: string,
        snapshot: AgemsAgentCore,
        changeset: Record<string, { old: unknown; new: unknown }>,
        changedBy = 'user',
        changeNote?: string,
    ): Promise<AgentConfigRevision> {
        const revisions = await this.getRevisions(agentId);
        const version = (revisions.length > 0 ? Math.max(...revisions.map((r) => r.version)) : 0) + 1;
        const revision: AgentConfigRevision = {
            id: Date.now(),
            agentId,
            version,
            changeset,
            snapshot,
            changedBy,
            changeNote,
            createdAt: Date.now(),
        };

        revisions.push(revision);
        await this.deps.database.setKv(this.getKey(agentId), revisions);
        this.deps.eventBus?.emit('agent:configRevisionSaved', { agentId, version });
        return revision;
    }

    async rollback(agentId: string, version: number): Promise<AgemsAgentCore | null> {
        const target = await this.getRevision(agentId, version);
        if (!target) {
            LOGGER.warn('AgentConfigRevisionService', `Rollback target version ${version} not found for agent ${agentId}`);
            return null;
        }

        this.deps.eventBus?.emit('agent:configRollback', { agentId, version });
        return target.snapshot;
    }
}
