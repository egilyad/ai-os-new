import type {
    Role,
    RoleWithStats,
    RoleUpdateInput,
    RoleCreateInput,
    RoleCategory,
    RolePermission,
} from '../types/role-types';
import { DEFAULT_ROLE_PERMISSIONS } from '../types/role-types';
import type { ISTopology } from '../contracts/topology';
import type { RolesStore } from '../contracts/storage/roles-store';
import { EVENTS } from '../events/event-names';
import { BucketStorageAdapter } from '../storage-adapter-instance';
import type { RoleVersionService } from './role-version-service';
import { rootLogger } from './logger-service';
const LOGGER = rootLogger.child('RoleService');

export interface DailyUsage {
    invocations: number;
    errors: number;
    totalLatency: number;
}

export interface RoleUsageStats {
    invocations: number;
    errors: number;
    totalLatency: number;
    avgLatency: number;
    lastUsed: number;
    totalTokens: number;
    feedbackScore: number;
    feedbackCount: number;
    dailyStats: Record<string, DailyUsage>;
    toolUsage: Record<string, number>;
    temperatureLog: Array<{ temp: number; success: boolean; latency: number }>;
    hourlyDistribution: Record<number, number>;
}

export interface RoleServiceDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
        emitOnce: (event: string, key: string, data?: unknown) => boolean;
    };
    rolesStore: RolesStore;
    keyValue: {
        get: (
            id: string,
        ) => Promise<{ id: string; value: unknown; createdAt?: number } | undefined>;
        put: (item: { id: string; value: unknown; createdAt?: number }) => Promise<void>;
    };
    toolService: {
        getTools: () => Array<{ id: string }>;
    };
    orchestrator: {
        getActiveTopology: () => ISTopology | null;
        mount: (topology: ISTopology) => void;
    };
    roleVersionService?: RoleVersionService;
}

const NOW = Date.now();
const builtinMeta = (cat: RoleCategory) => ({ category: cat, created: NOW, updated: NOW });

const DEFAULT_ROLES: Role[] = [
    // ── Technical (6) ──────────────────────────────────────────────
    {
        id: 'r-architect',
        name: 'System Architect',
        description: 'Expert in high-level system design and architectural patterns.',
        systemPrompt:
            'You are a senior system architect. Focus on scalability, modularity, and clean code principles.',
        baseTemperature: 0.2,
        capabilities: ['code_interpreter'],
        permissions: DEFAULT_ROLE_PERMISSIONS.technical,
        metadata: builtinMeta('technical'),
        isBuiltin: true,
    },
    {
        id: 'r-security',
        name: 'Security Engineer',
        description: 'Specializes in threat modeling, vulnerability assessment, and secure design.',
        systemPrompt:
            'You are a security engineer. Identify threats, attack vectors, and security gaps. Prioritize defense-in-depth and least-privilege principles.',
        baseTemperature: 0.15,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.technical,
        metadata: builtinMeta('technical'),
        isBuiltin: true,
    },
    {
        id: 'r-devops',
        name: 'DevOps Engineer',
        description: 'Focuses on CI/CD, infrastructure automation, and operational reliability.',
        systemPrompt:
            'You are a DevOps engineer. Evaluate build pipelines, deployment strategies, and infrastructure as code. Prioritize reliability, observability, and reproducibility.',
        baseTemperature: 0.3,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.technical,
        metadata: builtinMeta('technical'),
        isBuiltin: true,
    },
    {
        id: 'r-database',
        name: 'Database Engineer',
        description: 'Expert in data modeling, storage engines, and query optimization.',
        systemPrompt:
            'You are a database engineer. Analyze data models, indexing strategies, and query performance. Focus on consistency, durability, and access patterns.',
        baseTemperature: 0.2,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.technical,
        metadata: builtinMeta('technical'),
        isBuiltin: true,
    },
    {
        id: 'r-network',
        name: 'Network Engineer',
        description: 'Specializes in network topology, protocols, and distributed communication.',
        systemPrompt:
            'You are a network engineer. Evaluate communication protocols, topology design, and data flow. Focus on latency, throughput, and fault tolerance.',
        baseTemperature: 0.2,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.technical,
        metadata: builtinMeta('technical'),
        isBuiltin: true,
    },
    {
        id: 'r-performance',
        name: 'Performance Engineer',
        description: 'Focuses on benchmarking, profiling, and optimization of systems.',
        systemPrompt:
            'You are a performance engineer. Identify bottlenecks, measure throughput and latency. Propose concrete optimizations backed by data.',
        baseTemperature: 0.25,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.technical,
        metadata: builtinMeta('technical'),
        isBuiltin: true,
    },

    // ── Analytical (5) ────────────────────────────────────────────
    {
        id: 'r-critic',
        name: 'Critical Auditor',
        description: 'Specializes in finding flaws, security risks, and edge cases.',
        systemPrompt:
            'You are a critical auditor. Find weaknesses in the provided input and suggest improvements. Leave no assumption unchecked.',
        baseTemperature: 0.1,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.analytical,
        metadata: builtinMeta('analytical'),
        isBuiltin: true,
    },
    {
        id: 'r-data-scientist',
        name: 'Data Scientist',
        description:
            'Expert in statistical analysis, machine learning, and data-driven decision making.',
        systemPrompt:
            'You are a data scientist. Base your analysis on statistical reasoning and empirical evidence. Distinguish correlation from causation. Quantify uncertainty.',
        baseTemperature: 0.3,
        capabilities: ['code_interpreter'],
        permissions: DEFAULT_ROLE_PERMISSIONS.analytical,
        metadata: builtinMeta('analytical'),
        isBuiltin: true,
    },
    {
        id: 'r-risk-analyst',
        name: 'Risk Analyst',
        description:
            'Identifies, assesses, and mitigates risks across technical and business domains.',
        systemPrompt:
            'You are a risk analyst. Categorize risks by probability and impact. Propose mitigation strategies. Be systematic — use frameworks like STRIDE, DREAD, or FAIR.',
        baseTemperature: 0.15,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.analytical,
        metadata: builtinMeta('analytical'),
        isBuiltin: true,
    },
    {
        id: 'r-researcher',
        name: 'Research Analyst',
        description:
            'Conducts thorough investigations, literature reviews, and evidence synthesis.',
        systemPrompt:
            'You are a research analyst. Gather and synthesize information from multiple sources. Evaluate evidence quality. Flag uncertainty and conflicting findings.',
        baseTemperature: 0.4,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.analytical,
        metadata: builtinMeta('analytical'),
        isBuiltin: true,
    },
    {
        id: 'r-quality',
        name: 'Quality Engineer',
        description:
            'Ensures software quality through testing strategy, coverage analysis, and process improvement.',
        systemPrompt:
            'You are a quality engineer. Design testing strategies, identify coverage gaps, and enforce quality gates. Consider unit, integration, e2e, and property-based testing.',
        baseTemperature: 0.2,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.analytical,
        metadata: builtinMeta('analytical'),
        isBuiltin: true,
    },

    // ── Creative (4) ──────────────────────────────────────────────
    {
        id: 'r-creative',
        name: 'Creative Visionary',
        description: 'Generates out-of-the-box ideas and creative solutions.',
        systemPrompt:
            'You are a creative visionary. Think outside the box. Provide innovative, non-standard perspectives. Challenge conventional wisdom.',
        baseTemperature: 0.8,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.creative,
        metadata: builtinMeta('creative'),
        isBuiltin: true,
    },
    {
        id: 'r-designer',
        name: 'Product Designer',
        description: 'Focuses on user experience, interaction design, and product thinking.',
        systemPrompt:
            'You are a product designer. Prioritize user needs, mental models, and interaction flows. Evaluate proposals for usability, accessibility, and aesthetic coherence.',
        baseTemperature: 0.6,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.creative,
        metadata: builtinMeta('creative'),
        isBuiltin: true,
    },
    {
        id: 'r-content',
        name: 'Content Strategist',
        description: 'Crafts messaging, documentation, and narrative structure.',
        systemPrompt:
            'You are a content strategist. Evaluate clarity, tone, and information architecture. Ensure messaging is consistent, accessible, and audience-appropriate.',
        baseTemperature: 0.6,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.creative,
        metadata: builtinMeta('creative'),
        isBuiltin: true,
    },
    {
        id: 'r-ux-researcher',
        name: 'UX Researcher',
        description:
            'Studies user behavior, conducts usability testing, and translates findings into design decisions.',
        systemPrompt:
            'You are a UX researcher. Base recommendations on user research methods — interviews, surveys, usability tests. Distinguish opinion from observed behavior.',
        baseTemperature: 0.35,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.creative,
        metadata: builtinMeta('creative'),
        isBuiltin: true,
    },

    // ── Management (3) ─────────────────────────────────────────────
    {
        id: 'r-pm',
        name: 'Project Manager',
        description: 'Plans, tracks, and drives project execution across teams.',
        systemPrompt:
            'You are a project manager. Break down work into milestones, identify dependencies, and track progress. Balance scope, time, and resources. Flag risks early.',
        baseTemperature: 0.3,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.management,
        metadata: builtinMeta('management'),
        isBuiltin: true,
    },
    {
        id: 'r-product-owner',
        name: 'Product Owner',
        description:
            'Defines vision, prioritizes backlog, and bridges business and technical teams.',
        systemPrompt:
            'You are a product owner. Define clear outcomes, prioritize by business value, and make scope trade-offs. Keep the team focused on the why behind each task.',
        baseTemperature: 0.4,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.management,
        metadata: builtinMeta('management'),
        isBuiltin: true,
    },
    {
        id: 'r-team-lead',
        name: 'Team Lead',
        description:
            'Mentors engineers, facilitates technical decisions, and ensures delivery quality.',
        systemPrompt:
            "You are a team lead. Support your team's growth, facilitate technical discussions, and ensure code quality. Balance velocity with maintainability.",
        baseTemperature: 0.35,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.management,
        metadata: builtinMeta('management'),
        isBuiltin: true,
    },

    // ── Specialized (2) ────────────────────────────────────────────
    {
        id: 'r-tech-writer',
        name: 'Technical Writer',
        description: 'Creates clear, accurate documentation for APIs, systems, and user guides.',
        systemPrompt:
            'You are a technical writer. Produce clear, accurate, and well-structured documentation. Know your audience — write for beginners, experts, or both. Use consistent terminology.',
        baseTemperature: 0.25,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.creative,
        metadata: builtinMeta('custom'),
        isBuiltin: true,
    },
    {
        id: 'r-ethics',
        name: 'Ethics Officer',
        description: 'Evaluates ethical implications, bias, and societal impact of AI systems.',
        systemPrompt:
            'You are an ethics officer. Evaluate proposals for fairness, accountability, transparency, and societal impact. Consider marginalized groups and long-term consequences.',
        baseTemperature: 0.5,
        capabilities: [],
        permissions: DEFAULT_ROLE_PERMISSIONS.analytical,
        metadata: builtinMeta('custom'),
        isBuiltin: true,
    },
];

export class RoleService {
    private deps: RoleServiceDeps;
    private roles: Role[] = [];
    private assignments: Map<string, string[]> = new Map();
    private usageStats: Map<string, RoleUsageStats> = new Map();
    private unsubs: Array<() => void> = [];
    private _initialized = false;

    constructor(deps: RoleServiceDeps) {
        this.deps = deps;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        this.setupListeners();
        await this.load();
    }

    destroy() {
        this._initialized = false;
        if (this.statsDebounceTimer) clearTimeout(this.statsDebounceTimer);
        this.unsubs.forEach((u) => u());
        this.assignments.clear();
        this.usageStats.clear();
    }

    private setupListeners() {
        this.unsubs.push(
            this.deps.eventBus.on(EVENTS.SYSTEM_TOPOLOGY_MOUNTED, (topology) => {
                this.syncAssignments(
                    topology as { nodes?: { id: string; config?: { roleId?: string } }[] },
                );
            }),
        );
    }

    private async load() {
        try {
            const count = await this.deps.rolesStore.count();
            if (count > 0) {
                this.roles = await this.deps.rolesStore.toArray();
            } else {
                this.roles = DEFAULT_ROLES;
                await this.deps.rolesStore.bulkAdd(this.roles);
            }
        } catch (e) {
            LOGGER.error('RoleService', 'Failed to load roles from Dexie', { error: e });
            this.roles = DEFAULT_ROLES;
        }

        const statsStored = await this.deps.keyValue.get('role_usage_stats');
        if (statsStored?.value) {
            try {
                this.usageStats = new Map(statsStored.value as Array<[string, RoleUsageStats]>);
            } catch (e) {
                LOGGER.warn('RoleService', 'Failed to parse stored role stats', { error: e });
            }
        }
        BucketStorageAdapter.removeItem('super_agents_role_stats');
    }

    private async persist() {
        try {
            await this.deps.rolesStore.bulkPut(this.roles);
        } catch (e) {
            LOGGER.error('RoleService', 'Failed to persist roles', { error: e });
        }
    }

    private statsDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    private saveStats() {
        if (this.statsDebounceTimer) clearTimeout(this.statsDebounceTimer);
        this.statsDebounceTimer = setTimeout(() => {
            this.deps.keyValue
                .put({ id: 'role_usage_stats', value: [...this.usageStats] })
                .catch((e) =>
                    LOGGER.warn('RoleService', 'Failed to persist role stats', { error: e }),
                );
            this.statsDebounceTimer = null;
        }, 2000);
    }

    getAllRoles(): Role[] {
        return [...this.roles];
    }

    getRole(id: string): Role | undefined {
        return this.roles.find((r) => r.id === id);
    }

    getRolesByCategory(category: RoleCategory): Role[] {
        return this.roles.filter((r) => r.metadata.category === category);
    }

    getBuiltinRoles(): Role[] {
        return this.roles.filter((r) => r.isBuiltin);
    }

    getCustomRoles(): Role[] {
        return this.roles.filter((r) => !r.isBuiltin);
    }

    async addRole(input: RoleCreateInput): Promise<Role> {
        const newRole: Role = {
            ...input,
            id: `r-${crypto.randomUUID()}`,
            permissions:
                input.permissions || DEFAULT_ROLE_PERMISSIONS[input.metadata?.category || 'custom'],
            metadata: {
                category: input.metadata?.category || 'custom',
                created: Date.now(),
                updated: Date.now(),
                tags: input.metadata?.tags,
                author: input.metadata?.author,
            },
        };
        this.roles.push(newRole);
        await this.persist();
        this.deps.eventBus.emit(EVENTS.ROLES_UPDATED, this.roles);
        this.deps.eventBus.emitOnce(EVENTS.ROLE_CREATED, newRole.id, newRole);
        return newRole;
    }

    async updateRole(id: string, updates: RoleUpdateInput) {
        const oldRole = this.roles.find((r) => r.id === id);
        this.roles = this.roles.map((r) =>
            r.id === id
                ? {
                      ...r,
                      ...updates,
                      metadata: { ...r.metadata, ...(updates.metadata || {}), updated: Date.now() },
                  }
                : r,
        );
        const updated = this.roles.find((r) => r.id === id);
        await this.persist();
        this.deps.eventBus.emit(EVENTS.ROLES_UPDATED, this.roles);
        if (updated) {
            this.deps.eventBus.emitOnce(EVENTS.ROLE_UPDATED, updated.id, updated);
            this.deps.roleVersionService?.recordChange(updated, 'Updated via editor');
            if (oldRole && oldRole.parentRoleId !== updated.parentRoleId) {
                this.deps.roleVersionService?.recordChange(
                    updated,
                    `Parent changed to ${updated.parentRoleId || 'none'}`,
                );
            }
        }
    }

    async deleteRole(id: string): Promise<void> {
        const role = this.roles.find((r) => r.id === id);
        if (role?.isBuiltin) return;
        this.roles = this.roles.filter((r) => r.id !== id);
        this.assignments.delete(id);
        this.usageStats.delete(id);

        // SI-51: Clear parentRoleId on child roles referencing the deleted role
        for (const r of this.roles) {
            if (r.parentRoleId === id) {
                r.parentRoleId = undefined;
            }
        }

        const topology = this.deps.orchestrator.getActiveTopology();
        if (topology) {
            const updatedNodes = topology.nodes.map((n) =>
                n.config?.roleId === id ? { ...n, config: { ...n.config, roleId: undefined } } : n,
            );
            if (updatedNodes.some((n, i) => n !== topology.nodes[i])) {
                this.deps.orchestrator.mount({ ...topology, nodes: updatedNodes });
            }
        }
        await this.persist();
        this.deps.eventBus.emitOnce(EVENTS.ROLE_DELETED, id, { id, name: role?.name });
        this.deps.eventBus.emit(EVENTS.ROLES_UPDATED, this.roles);
    }

    async duplicateRole(id: string): Promise<Role | null> {
        const source = this.getRole(id);
        if (!source) return null;
        const clone: Role = {
            ...source,
            id: `r-${crypto.randomUUID()}`,
            name: `${source.name} (Copy)`,
            isBuiltin: false,
            metadata: { ...source.metadata, created: Date.now(), updated: Date.now() },
        };
        this.roles.push(clone);
        await this.persist();
        this.deps.eventBus.emit(EVENTS.ROLES_UPDATED, this.roles);
        return clone;
    }

    getRolesWithStats(): RoleWithStats[] {
        return this.roles.map((r) => ({
            ...r,
            usageStats: {
                totalCalls: this.usageStats.get(r.id)?.invocations || 0,
                totalTokens: this.usageStats.get(r.id)?.totalTokens || 0,
                avgLatency: this.usageStats.get(r.id)?.avgLatency || 0,
                lastUsed: this.usageStats.get(r.id)?.lastUsed || null,
                assignedNodes: this.assignments.get(r.id) || [],
            },
        }));
    }

    syncAssignments(topology: { nodes?: { id: string; config?: { roleId?: string } }[] }) {
        this.assignments.clear();
        if (!topology?.nodes) return;
        for (const node of topology.nodes) {
            const roleId = node.config?.roleId;
            if (roleId) {
                const existing = this.assignments.get(roleId) || [];
                existing.push(node.id);
                this.assignments.set(roleId, existing);
            }
        }
    }

    assignNodeToRole(nodeId: string, roleId: string) {
        const existing = this.assignments.get(roleId) || [];
        if (!existing.includes(nodeId)) {
            existing.push(nodeId);
            this.assignments.set(roleId, existing);
            this.deps.eventBus.emitOnce(EVENTS.ROLE_ASSIGNED, `${roleId}:${nodeId}`, {
                roleId,
                nodeId,
            });
        }
    }

    unassignNodeFromRole(nodeId: string, roleId: string) {
        const existing = this.assignments.get(roleId) || [];
        const filtered = existing.filter((n) => n !== nodeId);
        if (filtered.length !== existing.length) {
            this.assignments.set(roleId, filtered);
            this.deps.eventBus.emitOnce(EVENTS.ROLE_UNASSIGNED, `${roleId}:${nodeId}`, {
                roleId,
                nodeId,
            });
        }
    }

    getRoleForNode(nodeId: string): Role | null {
        for (const [roleId, nodeIds] of this.assignments) {
            if (nodeIds.includes(nodeId)) {
                return this.getRole(roleId) || null;
            }
        }
        return null;
    }

    getAgentsByRole(roleId: string): string[] {
        return this.assignments.get(roleId) || [];
    }

    validateRole(roleId: string): { valid: boolean; missingTools: string[] } {
        const role = this.getRole(roleId);
        if (!role) return { valid: false, missingTools: [] };
        const missingTools: string[] = [];
        const availableTools = this.deps.toolService.getTools();
        for (const cap of role.capabilities || []) {
            const toolExists = availableTools.some((t) => t.id === cap);
            if (!toolExists) missingTools.push(cap);
        }
        return { valid: missingTools.length === 0, missingTools };
    }

    recordRoleUsage(
        roleId: string,
        success: boolean,
        latency: number,
        tokens = 0,
        tool?: string,
        temperature?: number,
    ) {
        const now = Date.now();
        const stats = this.usageStats.get(roleId) || {
            invocations: 0,
            errors: 0,
            totalLatency: 0,
            avgLatency: 0,
            lastUsed: 0,
            totalTokens: 0,
            feedbackScore: 0,
            feedbackCount: 0,
            dailyStats: {},
            toolUsage: {},
            temperatureLog: [],
            hourlyDistribution: {},
        };
        stats.invocations++;
        if (!success) stats.errors++;
        stats.totalLatency += latency;
        stats.avgLatency = stats.totalLatency / stats.invocations;
        stats.lastUsed = now;
        stats.totalTokens += tokens;

        const dayKey = new Date(now).toISOString().slice(0, 10);
        const day = stats.dailyStats[dayKey] || { invocations: 0, errors: 0, totalLatency: 0 };
        day.invocations++;
        if (!success) day.errors++;
        day.totalLatency += latency;
        stats.dailyStats[dayKey] = day;

        const dailyKeys = Object.keys(stats.dailyStats);
        if (dailyKeys.length > 90) {
            dailyKeys.sort();
            const toRemove = dailyKeys.slice(0, dailyKeys.length - 90);
            for (const k of toRemove) delete stats.dailyStats[k];
        }

        if (tool) {
            stats.toolUsage[tool] = (stats.toolUsage[tool] || 0) + 1;
        }
        if (temperature !== undefined) {
            stats.temperatureLog.push({ temp: temperature, success, latency });
            if (stats.temperatureLog.length > 500)
                stats.temperatureLog = stats.temperatureLog.slice(-500);
        }
        const hour = new Date(now).getHours();
        stats.hourlyDistribution[hour] = (stats.hourlyDistribution[hour] || 0) + 1;

        this.usageStats.set(roleId, stats);
        this.saveStats();
    }

    recordRoleFeedback(roleId: string, positive: boolean) {
        const stats = this.usageStats.get(roleId);
        if (!stats) return;
        stats.feedbackScore += positive ? 1 : -1;
        stats.feedbackCount++;
        this.saveStats();
    }

    getRetirementCandidates(
        daysThreshold = 90,
    ): Array<{ id: string; name: string; lastUsed: number; daysInactive: number }> {
        const now = Date.now();
        return this.roles
            .filter((r) => !r.isBuiltin)
            .map((r) => {
                const s = this.usageStats.get(r.id);
                const lastUsed = s?.lastUsed || r.metadata.created;
                return {
                    id: r.id,
                    name: r.name,
                    lastUsed,
                    daysInactive: Math.floor((now - lastUsed) / 86400000),
                };
            })
            .filter((c) => c.daysInactive >= daysThreshold);
    }

    async promoteToBuiltin(roleId: string): Promise<boolean> {
        const role = this.getRole(roleId);
        if (!role || role.isBuiltin) return false;
        role.isBuiltin = true;
        role.metadata = { ...role.metadata, updated: Date.now() };
        await this.persist();
        this.deps.eventBus.emit(EVENTS.ROLES_UPDATED, this.roles);
        return true;
    }

    getEloLeaderboard(): Array<{
        id: string;
        name: string;
        category: string;
        elo: number;
        invocations: number;
        successRate: number;
    }> {
        return this.roles
            .map((r) => {
                const s = this.usageStats.get(r.id);
                if (!s || s.invocations === 0) return null;
                const successRate =
                    s.invocations > 0 ? (s.invocations - s.errors) / s.invocations : 0;
                const avgLatencyWeight = Math.max(0, 1 - (s.avgLatency || 0) / 10000);
                const feedbackScore =
                    s.feedbackCount > 0 ? (s.feedbackScore / s.feedbackCount + 1) / 2 : 0.5;
                const stalenessWeight = Math.min(1, (Date.now() - s.lastUsed) / (30 * 86400000));
                const elo = Math.round(
                    successRate * 400 +
                        avgLatencyWeight * 200 +
                        feedbackScore * 200 +
                        (1 - stalenessWeight) * 200,
                );
                return {
                    id: r.id,
                    name: r.name,
                    category: r.metadata.category,
                    elo,
                    invocations: s.invocations,
                    successRate: Math.round(successRate * 100),
                };
            })
            .filter((e): e is NonNullable<typeof e> => e !== null)
            .sort((a, b) => b.elo - a.elo);
    }

    getFatigueAnalysis(): Array<{
        id: string;
        name: string;
        recentRate: number;
        overallRate: number;
        decline: number;
        status: 'healthy' | 'fatigued' | 'critical';
    }> {
        const now = Date.now();
        return this.roles
            .map((r) => {
                const s = this.usageStats.get(r.id);
                if (!s || s.invocations < 10) return null;
                const overallRate =
                    s.invocations > 0 ? (s.invocations - s.errors) / s.invocations : 0;
                const recentDays = Object.entries(s.dailyStats)
                    .filter(([day]) => {
                        const diff = (now - new Date(day).getTime()) / 86400000;
                        return diff <= 7;
                    })
                    .reduce(
                        (acc, [, d]) => ({
                            invocations: acc.invocations + d.invocations,
                            errors: acc.errors + d.errors,
                        }),
                        { invocations: 0, errors: 0 },
                    );
                const recentRate =
                    recentDays.invocations > 0
                        ? (recentDays.invocations - recentDays.errors) / recentDays.invocations
                        : overallRate;
                const decline = overallRate - recentRate;
                return {
                    id: r.id,
                    name: r.name,
                    recentRate: Math.round(recentRate * 100),
                    overallRate: Math.round(overallRate * 100),
                    decline: Math.round(decline * 100),
                    status:
                        decline > 0.2
                            ? ('critical' as const)
                            : decline > 0.1
                              ? ('fatigued' as const)
                              : ('healthy' as const),
                };
            })
            .filter((e): e is NonNullable<typeof e> => e !== null)
            .filter((e) => e.status !== 'healthy')
            .sort((a, b) => b.decline - a.decline);
    }

    getRoleStats(roleId: string): RoleUsageStats | null {
        return this.usageStats.get(roleId) || null;
    }

    getAllStats(): Record<string, RoleUsageStats> {
        return Object.fromEntries(this.usageStats);
    }

    getEffectivePermissions(roleId: string): RolePermission[] {
        const visited = new Set<string>();
        const perms: RolePermission[] = [];
        const denied: RolePermission[] = [];
        let currentId: string | undefined = roleId;
        while (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const role = this.getRole(currentId);
            if (!role) break;
            for (const p of role.permissions) {
                const perm = p as RolePermission;
                if (!perms.includes(perm)) perms.push(perm);
            }
            for (const d of role.deniedPermissions ?? []) {
                const perm = d as RolePermission;
                if (!denied.includes(perm)) denied.push(perm);
            }
            currentId = role.parentRoleId;
        }
        return perms.filter((p) => !denied.includes(p));
    }

    getInheritanceChain(roleId: string): Role[] {
        const chain: Role[] = [];
        const visited = new Set<string>();
        let currentId: string | undefined = roleId;
        while (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const role = this.getRole(currentId);
            if (!role) break;
            chain.push(role);
            currentId = role.parentRoleId;
        }
        return chain;
    }

    resetStats(roleId: string) {
        this.usageStats.delete(roleId);
        this.saveStats();
    }

    resetAllStats() {
        this.usageStats.clear();
        this.saveStats();
    }
}
