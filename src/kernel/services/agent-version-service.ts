import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('AgentVersion');

export interface AgentVersion {
    id: string;
    agentId: string;
    config: Record<string, unknown>;
    timestamp: number;
    message?: string;
}

export interface AgentVersionServiceDeps {
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    eventBus?: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
    };
}

const VERSIONS_KEY_PREFIX = 'agent_versions_';

export class AgentVersionService {
    private deps: AgentVersionServiceDeps;
    private cache: Map<string, AgentVersion[]> = new Map();
    private unsubs: Array<() => void> = [];

    constructor(deps: AgentVersionServiceDeps) {
        this.deps = deps;
    }

    start(): void {
        if (!this.deps.eventBus) return;
        this.unsubs.push(
            this.deps.eventBus.on(EVENTS.SYSTEM_NODE_REMOVED, async (...args: unknown[]) => {
                const data = args[0] as { id?: string } | undefined;
                if (data?.id)
                    await this.clearVersions(data.id).catch((e) =>
                        LOGGER.error('AgentVersion', 'clearVersions failed', { error: e }),
                    );
            }),
        );
    }

    async saveVersion(
        agentId: string,
        config: Record<string, unknown>,
        message?: string,
    ): Promise<AgentVersion> {
        let versions = this.cache.get(agentId);
        if (!versions) {
            const saved = await this.deps.database.getKv<AgentVersion[]>(
                VERSIONS_KEY_PREFIX + agentId,
            );
            versions = saved || [];
            this.cache.set(agentId, versions);
        }
        const ver: AgentVersion = {
            id: `ver-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
            agentId,
            config: { ...config },
            timestamp: Date.now(),
            message,
        };
        versions.push(ver);
        if (versions.length > 20) versions.shift();
        await this.deps.database.setKv(VERSIONS_KEY_PREFIX + agentId, versions);
        return ver;
    }

    async getVersions(agentId: string): Promise<AgentVersion[]> {
        const cached = this.cache.get(agentId);
        if (cached) return [...cached];
        const saved = await this.deps.database.getKv<AgentVersion[]>(VERSIONS_KEY_PREFIX + agentId);
        const versions = saved || [];
        this.cache.set(agentId, versions);
        return [...versions];
    }

    async rollback(agentId: string, versionId: string): Promise<Record<string, unknown> | null> {
        const versions = await this.getVersions(agentId);
        const ver = versions.find((v) => v.id === versionId);
        return ver ? { ...ver.config } : null;
    }

    diff(
        current: Record<string, unknown>,
        target: Record<string, unknown>,
    ): { key: string; from: unknown; to: unknown }[] {
        const diffs: { key: string; from: unknown; to: unknown }[] = [];
        const allKeys = new Set([...Object.keys(current), ...Object.keys(target)]);
        for (const key of allKeys) {
            if (!(key in current)) diffs.push({ key, from: undefined, to: target[key] });
            else if (!(key in target)) diffs.push({ key, from: current[key], to: undefined });
            else if (JSON.stringify(current[key]) !== JSON.stringify(target[key])) {
                diffs.push({ key, from: current[key], to: target[key] });
            }
        }
        return diffs;
    }

    async clearVersions(agentId: string) {
        this.cache.delete(agentId);
        await this.deps.database.setKv(VERSIONS_KEY_PREFIX + agentId, []);
    }

    destroy(): void {
        for (const u of this.unsubs) u();
        this.unsubs = [];
        this.cache.clear();
    }
}
