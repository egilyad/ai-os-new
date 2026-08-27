import type { ISTopology, AgentLifecycleState, ISNode } from '../contracts/topology';
import type {
    IAgentResolver,
    ResolvedAgent,
    ResolvedAgentAvatar,
} from '../contracts/conversation/agent-resolver';
import type { NodeContext } from '../types/domain-types';
import { EVENTS } from '../events/event-names';
import { estimateTokens } from '../utils/tokenEstimate';
import { rootLogger } from './logger-service';
import { safeJsonParse } from '../../kernel/utils/safe-json';

const LOGGER = rootLogger.child('AgentService');

export interface AgentStats {
    calls: number;
    tokens: number;
    latency: number;
    errors: number;
    avgTokensPerCall: number;
    lastActive: number;
    estimatedCost: number;
}

export type GroupExecutionPattern = 'parallel' | 'sequential' | 'consensus' | 'pipeline' | 'debate';

export interface AgentGroup {
    id: string;
    name: string;
    agentIds: string[];
    description?: string;
    created: number;
    executionPattern?: GroupExecutionPattern;
    consensusThreshold?: number;
}

export interface AgentServiceDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        onSafe: <T>(event: string, cb: (data: T) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
    };
    orchestrator: {
        getActiveTopology: () => ISTopology | null;
        isNodeDisabled: (nodeId: string) => boolean;
        mount: (topology: ISTopology) => void;
        setNodeDisabled: (nodeId: string, disabled: boolean) => void;
        execute: (
            request: {
                requestId?: string;
                messages?: import('../../llm/core/types').ChatMessage[];
                output?: string;
                blackboard?: Record<string, unknown>;
                traceId?: string;
            },
            mode?: 'production' | 'simulation',
        ) => Promise<void>;
    };
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    pricingService: {
        calculateCost: (model: string, inputTokens: number, outputTokens: number) => number;
    };
}

const STATS_KEY = 'super_agents_agent_stats';
const GROUPS_KEY = 'super_agents_agent_groups';

export class AgentService implements IAgentResolver {
    private readonly MAX_AGENT_STATS = 500;
    private readonly MAX_CLONE_IDS = 200;
    private deps: AgentServiceDeps;
    private stats: Map<string, AgentStats> = new Map();
    private groups: AgentGroup[] = [];
    private lifecycleStates = new Map<string, AgentLifecycleState>();
    private unsubs: Array<() => void> = [];
    private _onUnload: (() => void) | null = null;

    public autoSpawnConfig = {
        enabled: true,
        maxAgents: 10,
        spawnThreshold: 1, // Number of agents that must be busy/idle to trigger
        terminateAfterMs: 300000, // 5 minutes
    };
    private autoCloneIds: Set<string> = new Set();

    constructor(deps: AgentServiceDeps) {
        this.deps = deps;
    }

    private _initialized = false;

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        this.setupListeners();
        await this.load();
        await this.loadGroups();
        if (typeof window !== 'undefined') {
            this._onUnload = () => {
                this.deps.database.setKv(STATS_KEY, Object.fromEntries(this.stats));
                this.deps.database.setKv(GROUPS_KEY, this.groups);
            };
            window.addEventListener('beforeunload', this._onUnload);
        }
    }

    destroy() {
        this._initialized = false;
        this.unsubs.forEach((u) => u());
        if (this.persistDebounceTimer) {
            clearTimeout(this.persistDebounceTimer);
            this.persistDebounceTimer = null;
        }
        if (this._onUnload && typeof window !== 'undefined') {
            window.removeEventListener('beforeunload', this._onUnload);
            this._onUnload = null;
        }
        this.deps.database
            .setKv(STATS_KEY, Object.fromEntries(this.stats))
            .catch((e) =>
                LOGGER.error('AgentService', 'Failed to flush stats on destroy:', { error: e }),
            );
        this.deps.database
            .setKv(GROUPS_KEY, this.groups)
            .catch((e) =>
                LOGGER.error('AgentService', 'Failed to flush groups on destroy:', { error: e }),
            );
    }

    private async load() {
        try {
            const parsed = await this.deps.database.getKv<Record<string, AgentStats>>(STATS_KEY);
            if (parsed) {
                for (const [nodeId, s] of Object.entries(parsed)) {
                    this.stats.set(nodeId, s);
                    this._trimStats();
                }
            }
        } catch (e) {
            LOGGER.error('AgentService', 'Failed to load stats', { error: e });
        }
    }

    private async loadGroups() {
        try {
            const parsed = await this.deps.database.getKv<AgentGroup[]>(GROUPS_KEY);
            if (parsed) this.groups = parsed;
        } catch (e) {
            LOGGER.error('AgentService', 'Failed to load groups', { error: e });
        }
    }

    private persistDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    private persist() {
        if (this.persistDebounceTimer) clearTimeout(this.persistDebounceTimer);
        this.persistDebounceTimer = setTimeout(() => {
            this.deps.database
                .setKv(STATS_KEY, Object.fromEntries(this.stats))
                .catch((e) =>
                    LOGGER.error('AgentService', 'Failed to persist stats:', { error: e }),
                );
            this.deps.database
                .setKv(GROUPS_KEY, this.groups)
                .catch((e) =>
                    LOGGER.error('AgentService', 'Failed to persist groups:', { error: e }),
                );
            this.persistDebounceTimer = null;
        }, 2000);
    }

    private setupListeners() {
        this.unsubs.push(
            this.deps.eventBus.onSafe<{
                nodeId: string;
                duration?: number;
                status?: string;
                output?: string;
                provider?: string;
                model?: string;
            }>(EVENTS.COGNITIVE_STEP_COMPLETED, (d) => {
                if (!d.nodeId) return;
                const cur = this.stats.get(d.nodeId) || this.emptyStats();
                const tokens = d.output ? estimateTokens(d.output) : 0;
                const actualModel = d.model || 'gpt-4o-mini';
                const cost = this.deps.pricingService.calculateCost(
                    actualModel,
                    Math.round(tokens * 0.3),
                    tokens,
                );
                const newCalls = cur.calls + 1;
                this.stats.set(d.nodeId, {
                    calls: newCalls,
                    tokens: cur.tokens + tokens,
                    latency: d.duration
                        ? Math.round((cur.latency * cur.calls + d.duration) / newCalls)
                        : cur.latency,
                    errors: d.status === 'error' ? cur.errors + 1 : cur.errors,
                    avgTokensPerCall: Math.round(
                        (cur.avgTokensPerCall * cur.calls + tokens) / newCalls,
                    ),
                    lastActive: Date.now(),
                    estimatedCost: cur.estimatedCost + cost,
                });
                this._trimStats();
                this.persist();
            }),
            this.deps.eventBus.onSafe<{
                requestId?: string;
                provider?: string;
                tokens?: number;
                model?: string;
                fullContent?: string;
                keyId?: string;
                latency?: number;
            }>(EVENTS.STREAM_END, (d) => {
                if (!d.requestId) return;
                // H-52: prefix stats key to avoid collision with agent-level stats from COGNITIVE_STEP_COMPLETED
                const statsKey = d.keyId ? `key:${d.keyId}` : `provider:${d.provider || 'unknown'}`;
                const cur = this.stats.get(statsKey) || this.emptyStats();
                const tokens = d.tokens || estimateTokens(d.fullContent || '');
                const cost = this.deps.pricingService.calculateCost(
                    d.model || 'gpt-4o-mini',
                    Math.round(tokens * 0.3),
                    tokens,
                );
                cur.calls++;
                if (d.tokens) cur.tokens += d.tokens;
                cur.estimatedCost += cost;
                if (d.latency)
                    cur.latency = Math.round(
                        (cur.latency * (cur.calls - 1) + d.latency) / cur.calls,
                    );
                cur.avgTokensPerCall = Math.round(
                    (cur.avgTokensPerCall * (cur.calls - 1) + tokens) / cur.calls,
                );
                cur.lastActive = Date.now();
                this.stats.set(statsKey, cur);
                this._trimStats();
                this.persist();
            }),
            this.deps.eventBus.onSafe<{
                id: string;
                from: AgentLifecycleState;
                to: AgentLifecycleState;
            }>(EVENTS.AGENT_LIFECYCLE_CHANGE, (d) => {
                this.lifecycleStates.set(d.id, d.to);
            }),
            this.deps.eventBus.onSafe<{ id: string }>(EVENTS.AGENT_HEALTH_CHANGE, () => {
                if (this.autoSpawnConfig.enabled) this.evaluateAutoSpawn();
            }),
        );
    }

    private _trimStats(): void {
        while (this.stats.size > this.MAX_AGENT_STATS) {
            const key = this.stats.keys().next().value;
            if (key !== undefined) this.stats.delete(key as string);
            else break;
        }
    }

    private _trimCloneIds(): void {
        if (this.autoCloneIds.size > this.MAX_CLONE_IDS) {
            const toDelete = [...this.autoCloneIds].slice(
                0,
                this.autoCloneIds.size - this.MAX_CLONE_IDS,
            );
            for (const id of toDelete) this.autoCloneIds.delete(id);
        }
    }

    private emptyStats(): AgentStats {
        return {
            calls: 0,
            tokens: 0,
            latency: 0,
            errors: 0,
            avgTokensPerCall: 0,
            lastActive: 0,
            estimatedCost: 0,
        };
    }

    getStats(nodeId: string): AgentStats {
        return this.stats.get(nodeId) || this.emptyStats();
    }

    getAllStats(): Record<string, AgentStats> {
        return Object.fromEntries(this.stats);
    }

    getTopAgents(
        limit = 5,
        sortBy: 'calls' | 'tokens' | 'latency' = 'calls',
    ): Array<{ id: string; name: string; stats: AgentStats }> {
        const agents = this.getAgents();
        return agents
            .sort((a, b) => (b.stats[sortBy] || 0) - (a.stats[sortBy] || 0))
            .slice(0, limit);
    }

    getAgents(): Array<{
        id: string;
        name: string;
        role: string;
        status: string;
        stats: AgentStats;
    }> {
        const top = this.deps.orchestrator.getActiveTopology();
        if (!top) return [];
        return top.nodes
            .filter((n) => n.type === 'agent' || n.type === 'router')
            .map((n) => ({
                id: n.id,
                name: n.label,
                role:
                    n.type === 'router'
                        ? 'Semantic Router'
                        : (n.config.roleName as string) || 'Autonomous Agent',
                status: this.deps.orchestrator.isNodeDisabled(n.id)
                    ? 'paused'
                    : this.getLifecycleState(n.id),
                stats: this.getStats(n.id),
            }));
    }

    /**
     * Resolve a participantId to a real agent from the active topology.
     * Used by the Conversation Director's execution engine so a turn is
     * actually spoken by the named agent (persona + pinned model) rather than
     * just carrying its id as metadata.
     */
    resolveAgent(id: string): ResolvedAgent | null {
        const top = this.deps.orchestrator.getActiveTopology();
        if (!top) return null;
        const node = top.nodes.find(
            (n) => n.id === id && (n.type === 'agent' || n.type === 'router'),
        );
        if (!node) return null;
        const cfg = (node.config ?? {}) as Record<string, unknown>;
        const systemPrompt =
            typeof cfg.systemPrompt === 'string' && cfg.systemPrompt.trim().length > 0
                ? cfg.systemPrompt
                : typeof cfg.prompt === 'string'
                  ? cfg.prompt
                  : undefined;
        const rawModel = typeof cfg.model === 'string' ? cfg.model : '';
        const model =
            rawModel && rawModel !== 'auto' && rawModel !== 'default' ? rawModel : undefined;
        const baseRoleName =
            node.type === 'router'
                ? 'Semantic Router'
                : (cfg.roleName as string) || 'Autonomous Agent';
        const asStringArray = (v: unknown): string[] =>
            Array.isArray(v) ? v.map((x) => String(x)).filter((s) => s.length > 0) : [];
        const avatarCfg = (cfg.avatar ?? cfg.avatarOverride) as ResolvedAgentAvatar | undefined;
        const avatar: ResolvedAgentAvatar | undefined =
            avatarCfg && typeof avatarCfg === 'object'
                ? {
                      emoji: typeof avatarCfg.emoji === 'string' ? avatarCfg.emoji : undefined,
                      color: typeof avatarCfg.color === 'string' ? avatarCfg.color : undefined,
                      url: typeof avatarCfg.url === 'string' ? avatarCfg.url : undefined,
                  }
                : undefined;
        return {
            id: node.id,
            name: node.label,
            role: baseRoleName,
            systemPrompt,
            model,
            displayName:
                typeof cfg.displayName === 'string' && cfg.displayName.trim().length > 0
                    ? cfg.displayName
                    : node.label,
            firstName: typeof cfg.firstName === 'string' ? cfg.firstName : undefined,
            lastName: typeof cfg.lastName === 'string' ? cfg.lastName : undefined,
            baseRole:
                typeof cfg.baseRole === 'string' && cfg.baseRole.trim().length > 0
                    ? cfg.baseRole
                    : baseRoleName,
            specializations: asStringArray(cfg.specializations),
            lensIds: asStringArray(cfg.lensIds),
            provider: typeof cfg.provider === 'string' && cfg.provider ? cfg.provider : undefined,
            avatar,
        };
    }

    spawnAgent(name: string, roleId?: string, config?: Record<string, unknown>) {
        const top = this.deps.orchestrator.getActiveTopology();
        if (!top) {
            LOGGER.warn(
                'AgentService',
                'spawnAgent failed: no active topology. Try mounting a topology first.',
            );
            return null;
        }
        const newId = `agent-${crypto.randomUUID()}`;
        this.transitionLifecycle(newId, undefined, 'initializing');
        top.nodes.push({
            id: newId,
            type: 'agent',
            label: name,
            lifecycle: 'initializing',
            config: {
                roleId,
                roleName: 'General Assistant',
                prompt: 'You are a helpful AI assistant.',
                model: 'auto',
                tools: [],
                temperature: 0.7,
                ...config,
            },
        });
        const entry = top.nodes.find((n) => n.type === 'router' || n.id === 'entry');
        if (entry)
            top.edges.push({
                id: `edge-${crypto.randomUUID()}`,
                from: entry.id,
                to: newId,
                trigger: 'on_success',
            });
        this.deps.orchestrator.mount({ ...top });
        this.transitionLifecycle(newId, 'initializing', 'ready');
        this.deps.eventBus.emit(EVENTS.SYSTEM_NODE_SPAWN, { nodeId: newId, type: name });
        return newId;
    }

    updateAgent(agentId: string, updates: Record<string, unknown>) {
        const top = this.deps.orchestrator.getActiveTopology();
        if (!top) throw new Error('No active topology');
        const node = top.nodes.find((n) => n.id === agentId);
        if (!node) throw new Error(`Agent ${agentId} not found`);
        const { label, ...configUpdates } = updates;
        node.config = { ...node.config, ...configUpdates };
        if (label) node.label = label as string;
        this.deps.orchestrator.mount({ ...top });
    }

    deleteAgent(agentId: string) {
        const top = this.deps.orchestrator.getActiveTopology();
        if (!top) return;
        top.nodes = top.nodes.filter((n) => n.id !== agentId);
        top.edges = top.edges.filter((e) => e.from !== agentId && e.to !== agentId);
        this.deps.orchestrator.mount({ ...top });
        this.transitionLifecycle(agentId, this.lifecycleStates.get(agentId), 'terminated');
        this.lifecycleStates.delete(agentId);
        for (const group of this.groups) {
            group.agentIds = group.agentIds.filter((id) => id !== agentId);
        }
        this.persist();
        this.deps.eventBus.emit(EVENTS.SYSTEM_NODE_REMOVED, { id: agentId });
        this.stats.delete(agentId);
        this.autoCloneIds.delete(agentId);
    }

    toggleAgent(id: string) {
        const current = this.lifecycleStates.get(id) || 'ready';
        if (current === 'paused') {
            this.transitionLifecycle(id, 'paused', 'ready');
            this.deps.orchestrator.setNodeDisabled(id, false);
        } else {
            this.transitionLifecycle(id, current === 'ready' ? 'ready' : current, 'paused');
            this.deps.orchestrator.setNodeDisabled(id, true);
        }
    }

    pauseAllAgents() {
        const top = this.deps.orchestrator.getActiveTopology();
        if (!top) return;
        top.nodes
            .filter((n) => n.type === 'agent' || n.type === 'router')
            .forEach((n) => {
                this.transitionLifecycle(n.id, this.lifecycleStates.get(n.id) || 'ready', 'paused');
                this.deps.orchestrator.setNodeDisabled(n.id, true);
            });
    }

    resumeAllAgents() {
        const top = this.deps.orchestrator.getActiveTopology();
        if (!top) return;
        top.nodes
            .filter((n) => n.type === 'agent' || n.type === 'router')
            .forEach((n) => {
                this.transitionLifecycle(n.id, this.lifecycleStates.get(n.id) || 'paused', 'ready');
                this.deps.orchestrator.setNodeDisabled(n.id, false);
            });
    }

    async restartAgent(agentId: string, signal?: AbortSignal): Promise<void> {
        const current = this.lifecycleStates.get(agentId) || 'ready';
        this.transitionLifecycle(agentId, current, 'initializing');
        this.stats.set(agentId, this.emptyStats());
        this._trimStats();
        this.deps.orchestrator.setNodeDisabled(agentId, false);
        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(resolve, 500);
            signal?.addEventListener(
                'abort',
                () => {
                    clearTimeout(timer);
                    reject(new DOMException('Aborted', 'AbortError'));
                },
                { once: true },
            );
        }).catch((err) =>
            LOGGER.debug('AgentService', 'restartAgent delayed promise', { error: String(err) }),
        );
        if (!this.lifecycleStates.has(agentId)) return;
        this.transitionLifecycle(agentId, 'initializing', 'ready');
        this.deps.eventBus.emit(EVENTS.AGENT_RESTARTED, { id: agentId });
    }

    exportAgents() {
        const top = this.deps.orchestrator.getActiveTopology();
        if (!top) return JSON.stringify([]);
        const agents = top.nodes
            .filter((n) => n.type === 'agent' || n.type === 'router')
            .map((n) => ({
                id: n.id,
                type: n.type,
                label: n.label,
                config: n.config,
            }));
        return JSON.stringify(agents, null, 2);
    }

    importAgents(jsonData: string) {
        try {
            const imported = safeJsonParse(jsonData);
            if (!Array.isArray(imported)) throw new Error('Invalid format');
            const top = this.deps.orchestrator.getActiveTopology();
            if (!top) return 0;
            const ALLOWED_NODE_TYPES = ['agent', 'router', 'tool', 'input', 'output'];
            const ALLOWED_CONFIG_KEYS = [
                'roleName',
                'roleId',
                'prompt',
                'tools',
                'temperature',
                'model',
                'capabilities',
            ];
            let count = 0;
            for (const item of imported) {
                if (typeof item.id !== 'string' || typeof item.type !== 'string') continue;
                if (!ALLOWED_NODE_TYPES.includes(item.type)) continue;
                const sanitizedConfig: Record<string, unknown> = {};
                if (item.config && typeof item.config === 'object') {
                    for (const key of ALLOWED_CONFIG_KEYS) {
                        if (key in item.config)
                            sanitizedConfig[key] = (item.config as Record<string, unknown>)[key];
                    }
                }
                const exists = top.nodes.some((n) => n.id === item.id);
                if (!exists) {
                    top.nodes.push({
                        id: item.id,
                        type: item.type,
                        label: item.label ?? '',
                        config: sanitizedConfig,
                    });
                    count++;
                }
            }
            this.deps.orchestrator.mount({ ...top });
            return count;
        } catch (e) {
            LOGGER.error('AgentService', 'Failed to import agents', { error: e });
            throw new Error('Failed to import agents', { cause: e });
        }
    }

    resetStats(nodeId: string) {
        this.stats.set(nodeId, this.emptyStats());
        this._trimStats();
        this.persist();
    }

    resetAllStats() {
        this.stats.clear();
        this.persist();
    }

    getLifecycleState(agentId: string): AgentLifecycleState {
        return this.lifecycleStates.get(agentId) || 'ready';
    }

    setLifecycleState(agentId: string, state: AgentLifecycleState) {
        this.transitionLifecycle(agentId, this.lifecycleStates.get(agentId), state);
    }

    private transitionLifecycle(
        id: string,
        from: AgentLifecycleState | undefined,
        to: AgentLifecycleState,
    ) {
        if (from === to) return;
        this.lifecycleStates.set(id, to);
        this.deps.eventBus.emit(EVENTS.AGENT_LIFECYCLE_CHANGE, {
            id,
            from: from || 'initializing',
            to,
        });

        if (this.autoSpawnConfig.enabled && (to === 'busy' || to === 'idle')) {
            this.evaluateAutoSpawn();
        }
    }

    private evaluateAutoSpawn() {
        const top = this.deps.orchestrator.getActiveTopology();
        if (!top) return;

        const agents = top.nodes.filter((n) => n.type === 'agent' || n.type === 'router');
        const agentCount = agents.length;

        let busyCount = 0;
        let idleCount = 0;
        const idleAgents: { id: string; lastActive: number }[] = [];

        for (const a of agents) {
            const state = this.getLifecycleState(a.id);
            if (state === 'busy') busyCount++;
            else if (state === 'idle') {
                idleCount++;
                const stats = this.stats.get(a.id);
                if (stats) idleAgents.push({ id: a.id, lastActive: stats.lastActive });
            }
        }

        if (
            busyCount >= this.autoSpawnConfig.spawnThreshold &&
            busyCount === agentCount &&
            agentCount < this.autoSpawnConfig.maxAgents
        ) {
            const sourceAgent = agents.find((n) => !this.autoCloneIds.has(n.id)) || agents[0];
            if (sourceAgent) {
                const newId = this.spawnAgent(
                    `${sourceAgent.label} (Auto-clone)`,
                    undefined,
                    structuredClone(sourceAgent.config),
                );
                if (newId) {
                    this.autoCloneIds.add(newId);
                    this._trimCloneIds();
                }
            }
        }

        if (idleCount > this.autoSpawnConfig.spawnThreshold) {
            const now = Date.now();
            for (const idle of idleAgents) {
                if (now - idle.lastActive > this.autoSpawnConfig.terminateAfterMs) {
                    const node = agents.find((n) => n.id === idle.id);
                    if (node && this.autoCloneIds.has(node.id)) {
                        this.deleteAgent(idle.id);
                    }
                }
            }
        }
    }

    createGroup(
        name: string,
        agentIds: string[],
        description?: string,
        executionPattern?: GroupExecutionPattern,
        consensusThreshold?: number,
    ): AgentGroup {
        const group: AgentGroup = {
            id: `group-${crypto.randomUUID()}`,
            name,
            agentIds,
            description,
            created: Date.now(),
            executionPattern,
            consensusThreshold,
        };
        this.groups.push(group);
        this.persist();
        return group;
    }

    async executeGroup(groupId: string, input: string): Promise<string[]> {
        const group = this.groups.find((g) => g.id === groupId);
        if (!group || group.agentIds.length === 0) return [];
        const pattern = group.executionPattern || 'parallel';

        const top = this.deps.orchestrator.getActiveTopology();
        if (!top) return [];

        if (pattern === 'sequential' || pattern === 'pipeline') {
            const results: string[] = [];
            let pipelineOutput = input;
            for (const agentId of group.agentIds) {
                const node = top.nodes.find((n) => n.id === agentId);
                if (!node || this.deps.orchestrator.isNodeDisabled(agentId)) continue;
                const ctx: NodeContext = {
                    traceId: `group-${groupId}-${Date.now()}`,
                    history: [],
                    blackboard: {},
                    output: pipelineOutput,
                    targetNodeId: agentId,
                };
                try {
                    await this.deps.orchestrator.execute(ctx, 'production');
                    // Use blackboard output if available, otherwise keep previous
                    pipelineOutput = (ctx.blackboard?.lastOutput as string) || pipelineOutput;
                    results.push(`[${node.label}] completed`);
                } catch (e) {
                    LOGGER.warn('AgentService', `Node ${node.label} failed`, { error: e });
                    results.push(`[${node.label}] error`);
                }
            }
            return results;
        }

        const nodes = group.agentIds
            .map((id) => top.nodes.find((n) => n.id === id))
            .filter((n): n is ISNode => !!n && !this.deps.orchestrator.isNodeDisabled(n.id));

        if (nodes.length === 0) return [];

        const baseCtx: NodeContext = {
            traceId: `group-${groupId}-${Date.now()}`,
            history: [],
            blackboard: {},
            output: input,
            targetNodeId: '',
        };

        if (pattern === 'consensus' || pattern === 'debate') {
            const outputs = await Promise.allSettled(
                nodes.map((n) =>
                    this.executeSingleNode(n, { ...baseCtx, traceId: `group-${groupId}-${n.id}` }),
                ),
            );
            const results: string[] = outputs.map((r, i) =>
                r.status === 'fulfilled' ? r.value : `[${nodes[i]!.label}] error`,
            );
            if (pattern === 'consensus') {
                const threshold = group.consensusThreshold || 0.5;
                const succeeded = outputs.filter((r) => r.status === 'fulfilled').length;
                const agreement = succeeded / results.length;
                return agreement >= threshold ? results : ['[consensus] No agreement reached'];
            }
            return results;
        }

        const results = await Promise.allSettled(
            nodes.map((n) =>
                this.executeSingleNode(n, { ...baseCtx, traceId: `group-${groupId}-${n.id}` }),
            ),
        );
        return results.map((r, i) =>
            r.status === 'fulfilled' ? r.value : `[${nodes[i]!.label}] error`,
        );
    }

    private async executeSingleNode(node: ISNode, ctx: NodeContext): Promise<string> {
        try {
            await this.deps.orchestrator.execute(ctx, 'production');
            const stats = this.stats.get(node.id);
            return stats
                ? `[${node.label}] completed (${stats.calls} calls)`
                : `[${node.label}] no output`;
        } catch {
            return `[${node.label}] error`;
        }
    }

    deleteGroup(id: string) {
        this.groups = this.groups.filter((g) => g.id !== id);
        this.persist();
    }

    getGroups(): AgentGroup[] {
        return [...this.groups];
    }

    addToGroup(groupId: string, agentId: string) {
        const group = this.groups.find((g) => g.id === groupId);
        if (group && !group.agentIds.includes(agentId)) {
            group.agentIds.push(agentId);
            this.persist();
        }
    }

    removeFromGroup(groupId: string, agentId: string) {
        const group = this.groups.find((g) => g.id === groupId);
        if (group) {
            group.agentIds = group.agentIds.filter((id) => id !== agentId);
            this.persist();
        }
    }
}
