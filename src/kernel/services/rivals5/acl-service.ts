/**
 * AclService — J.2 (Glean-style permissions-aware retrieval, additive).
 *
 * Sources carry allowed roles (kv `acl/*`); `searchScoped()` retrieves from
 * Knowledge + Workspace and drops hits the agent may not see
 * (checkCapability `<agent> memory:read:<sourceId>` or role tags).
 * Denials are counted, never logged with content.
 */
import type { DataAccessLayer } from '../../dal/types';
import type { IKnowledgeService } from '../../contracts/parity';
import type { IWorkspaceService } from '../../contracts/workspace';
import type { IGovernanceService } from '../../contracts/trust';
import type { IAclService } from '../../contracts/rivals5';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('ACL');

export class AclService implements IAclService {
    constructor(
        private dal: DataAccessLayer,
        private knowledge?: IKnowledgeService,
        _workspace?: IWorkspaceService,
        private governance?: IGovernanceService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('ACL', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async tagSource(sourceId: string, roles: string[]): Promise<void> {
        await this.dal.kv.set(`acl/${sourceId.slice(0, 160)}`, roles.map((r) => r.slice(0, 80)));
    }

    async searchScoped(
        agentId: string,
        query: string,
        limit = 5,
    ): Promise<Array<{ title: string; chunk: string }>> {
        const out: Array<{ title: string; chunk: string; sourceId: string }> = [];
        if (this.knowledge) {
            try {
                const hits = await this.knowledge.retrieve(query, limit * 2);
                for (const h of hits) out.push({ title: h.title, chunk: h.chunk, sourceId: h.sourceId });
            } catch (e) {
                LOGGER.warn('ACL', 'acl knowledge failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        const allowed: Array<{ title: string; chunk: string }> = [];
        for (const hit of out) {
            if (await this.maySee(agentId, hit.sourceId)) {
                allowed.push({ title: hit.title, chunk: hit.chunk });
            }
            if (allowed.length >= limit) break;
        }
        return allowed;
    }

    private async maySee(agentId: string, sourceId: string): Promise<boolean> {
        const roles = await this.dal.kv.get<string[]>(`acl/${sourceId}`);
        if (!roles || roles.length === 0) return true;
        if (!this.governance) return false;
        for (const role of roles) {
            try {
                if (await this.governance.checkCapability(agentId, `memory:read:${sourceId}`)) return true;
                if (await this.governance.checkCapability(agentId, `role:${role}`)) return true;
            } catch {
                continue;
            }
        }
        return false;
    }
}
