import type {
    IRoleTeamService,
    RoleTeam,
    TeamTemplate,
    TeamExecution,
    RoleOutput,
    TeamMetrics,
    TeamAnalytics,
    TeamCompatibilityEntry,
} from '../contracts/role-team';
import type { IEventBus, IDatabaseService } from '../types/interfaces';
import type { ApiKey } from '../types/metrics-types';
import type { AdapterMessage } from '../contracts/provider-adapter';
import { EVENTS } from '../events/event-registry';
import { TEAM_TEMPLATES } from '../../data/team-template-definitions';
import { BucketStorageAdapter } from './storage-adapter';
import { SeededRng } from '../utils/seedable-rng';
import { rootLogger } from './logger-service';
const RTS_LOGGER = rootLogger.child('RoleTeamService');

const genId = () => crypto.randomUUID();
const genExecId = () => crypto.randomUUID();
let _rng = new SeededRng();

export function resetRoleTeamRng(seed?: number): void {
    _rng = new SeededRng(seed);
}

const TEAMS_STORAGE_KEY = 'role_teams_v1';
const EXECUTIONS_STORAGE_KEY = 'role_team_executions_v1';
const MAX_EXECUTIONS = 200;
const MAX_ABORT_TOKENS = 200;

const ROLE_LLM_TIMEOUT = 30000;

export interface RoleTeamServiceDeps {
    eventBus: IEventBus;
    database: IDatabaseService;
    keyService: {
        getKeys: () => ApiKey[];
    };
    adapterRegistry: {
        getAdapter: (provider: string) =>
            | {
                  sendMessage: (
                      messages: AdapterMessage[],
                      model: string,
                      apiKey: string,
                      signal?: AbortSignal,
                  ) => Promise<{ content: string; latency?: number }>;
              }
            | undefined;
    };
}

export class RoleTeamService implements IRoleTeamService {
    private teams = new Map<string, RoleTeam>();
    private executions = new Map<string, TeamExecution>();
    private analyticsCache = new Map<string, TeamAnalytics>();
    private abortTokens = new Set<string>();
    private deps: RoleTeamServiceDeps;

    constructor(deps: RoleTeamServiceDeps) {
        this.deps = deps;
    }

    async init(): Promise<void> {
        try {
            const savedTeams = await this.deps.database.getKv<RoleTeam[]>(TEAMS_STORAGE_KEY);
            if (savedTeams) {
                for (const t of savedTeams) this.teams.set(t.id, t);
            } else {
                const lsTeams = await migrateTeamsFromLocalStorage();
                if (lsTeams) {
                    for (const t of lsTeams) this.teams.set(t.id, t);
                    await this.deps.database.setKv(TEAMS_STORAGE_KEY, lsTeams);
                    await BucketStorageAdapter.UI.remove(TEAMS_STORAGE_KEY);
                }
            }
            const savedExecs =
                await this.deps.database.getKv<TeamExecution[]>(EXECUTIONS_STORAGE_KEY);
            if (savedExecs) {
                for (const e of savedExecs) this.executions.set(e.id, e);
            } else {
                const lsExecs = await migrateExecsFromLocalStorage();
                if (lsExecs) {
                    for (const e of lsExecs) this.executions.set(e.id, e);
                    await this.deps.database.setKv(EXECUTIONS_STORAGE_KEY, lsExecs);
                    await BucketStorageAdapter.UI.remove(EXECUTIONS_STORAGE_KEY);
                }
            }
        } catch {
            /* storage unavailable — start empty */
        }
    }

    private persistTeams(): void {
        this.deps.database
            .setKv(TEAMS_STORAGE_KEY, Array.from(this.teams.values()))
            .catch((e: unknown) => {
                RTS_LOGGER.warn('RoleTeamService', 'persistTeams failed', { error: e });
            });
    }

    private persistExecutions(): void {
        this.deps.database
            .setKv(EXECUTIONS_STORAGE_KEY, Array.from(this.executions.values()))
            .catch((e: unknown) => {
                RTS_LOGGER.warn('RoleTeamService', 'persistExecutions failed', { error: e });
            });
    }

    private tryEmit(name: string, payload: Record<string, unknown>): void {
        try {
            this.deps.eventBus?.emit(name, payload);
        } catch {
            /* event emission is best-effort */
        }
    }

    listTeams(): RoleTeam[] {
        return Array.from(this.teams.values());
    }

    getTeam(id: string): RoleTeam | undefined {
        return this.teams.get(id);
    }

    createTeam(input: Omit<RoleTeam, 'id'>): RoleTeam {
        const now = Date.now();
        const team: RoleTeam = {
            ...input,
            id: genId(),
            metadata: {
                ...input.metadata,
                created: now,
                updated: now,
            },
        };
        this.teams.set(team.id, team);
        this.persistTeams();
        this.tryEmit(EVENTS.TEAM_CREATED, {
            id: team.id,
            name: team.name,
            domain: team.metadata?.domain || '',
            memberCount: team.roleIds.length,
        });
        return team;
    }

    updateTeam(id: string, patch: Partial<RoleTeam>): void {
        const existing = this.teams.get(id);
        if (!existing) return;
        this.teams.set(id, {
            ...existing,
            ...patch,
            metadata: { ...existing.metadata, ...patch.metadata, updated: Date.now() },
            executionConfig: { ...existing.executionConfig, ...patch.executionConfig },
        });
        this.persistTeams();
        this.tryEmit(EVENTS.TEAM_UPDATED, {
            id,
            name: patch.name,
            strategy: patch.coordinationStrategy,
        });
    }

    deleteTeam(id: string): void {
        const team = this.teams.get(id);
        this.teams.delete(id);
        this.analyticsCache.delete(id);
        if (team) {
            this.persistTeams();
            this.tryEmit(EVENTS.TEAM_DELETED, { id, name: team.name });
        }
    }

    getTemplates(): TeamTemplate[] {
        return TEAM_TEMPLATES;
    }

    createFromTemplate(templateId: string, overrides?: Partial<RoleTeam>): RoleTeam {
        const tpl = TEAM_TEMPLATES.find((t) => t.id === templateId);
        if (!tpl) throw new Error(`Template "${templateId}" not found`);
        const now = Date.now();
        const team: RoleTeam = {
            id: genId(),
            name: overrides?.name || tpl.name,
            description: overrides?.description || tpl.description,
            icon: overrides?.icon || tpl.icon,
            color: overrides?.color || tpl.color,
            roleIds: overrides?.roleIds || [...tpl.recommendedRoles],
            coordinationStrategy: overrides?.coordinationStrategy || tpl.defaultStrategy,
            metadata: {
                domain: overrides?.metadata?.domain || tpl.domain,
                created: now,
                updated: now,
                author: overrides?.metadata?.author,
                tags: overrides?.metadata?.tags || [],
                version: '1.0',
                isBuiltin: false,
                isTemplate: false,
            },
            executionConfig: overrides?.executionConfig || {
                maxRounds: 3,
                consensusThreshold: 0.7,
                parallelTimeout: 30000,
            },
            ...overrides,
        };
        this.teams.set(team.id, team);
        this.persistTeams();
        this.tryEmit(EVENTS.TEAM_CREATED, {
            id: team.id,
            name: team.name,
            domain: team.metadata?.domain || '',
            memberCount: team.roleIds.length,
        });
        return team;
    }

    // ════════════════════════════════════════════════
    // Execution Engine
    // ════════════════════════════════════════════════

    async executeTeam(teamId: string, task: string): Promise<TeamExecution> {
        const team = this.teams.get(teamId);
        if (!team) throw new Error(`Team "${teamId}" not found`);
        if (task.length < 2) throw new Error('Task must be at least 2 characters');

        const executionId = genExecId();
        const startedAt = Date.now();
        const roleOutputs: Record<string, RoleOutput> = {};
        for (const roleId of team.roleIds) {
            roleOutputs[roleId] = { roleId, status: 'pending' };
        }

        const execution: TeamExecution = {
            id: executionId,
            teamId,
            task,
            status: 'running',
            startedAt,
            roleOutputs,
        };

        this.executions.set(executionId, execution);
        // P1-20: evict oldest executions when over limit
        if (this.executions.size > MAX_EXECUTIONS) {
            const sorted = Array.from(this.executions.entries()).sort(
                ([, a], [, b]) => a.startedAt - b.startedAt,
            );
            const toRemove = sorted.slice(0, this.executions.size - MAX_EXECUTIONS);
            for (const [evictId] of toRemove) this.executions.delete(evictId);
        }
        this.tryEmit(EVENTS.TEAM_EXECUTION_STARTED, {
            teamId,
            task,
            strategy: team.coordinationStrategy,
            timestamp: startedAt,
        });

        try {
            switch (team.coordinationStrategy) {
                case 'parallel':
                    await this.executeParallel(execution, team);
                    break;
                case 'sequential':
                    await this.executeSequential(execution, team);
                    break;
                case 'pipeline':
                    await this.executePipeline(execution, team);
                    break;
                case 'debate':
                    await this.executeDebate(execution, team);
                    break;
                case 'consensus':
                    await this.executeConsensus(execution, team);
                    break;
                case 'hierarchical':
                    await this.executeHierarchical(execution, team);
                    break;
                case 'swarm':
                    await this.executeSwarm(execution, team);
                    break;
                case 'tournament':
                    await this.executeTournament(execution, team);
                    break;
                case 'round-robin':
                    await this.executeRoundRobin(execution, team);
                    break;
                case 'review':
                    await this.executeReview(execution, team);
                    break;
            }
        } catch {
            execution.status = 'failed';
        }

        if (execution.status !== 'failed' && !this.abortTokens.has(executionId)) {
            execution.status = 'completed';
            execution.completedAt = Date.now();
            execution.metrics = this.computeMetrics(execution);
            execution.synthesis = this.synthesizeTeamOutput(execution);
            this.tryEmit(EVENTS.TEAM_EXECUTION_COMPLETED, {
                teamId,
                duration: execution.metrics!.totalDuration,
                tokensUsed: execution.metrics!.totalTokens,
                successRate: execution.metrics!.successRate,
                synthesis: execution.synthesis,
            });
        } else if (execution.status === 'failed') {
            this.tryEmit(EVENTS.TEAM_EXECUTION_FAILED, {
                teamId,
                error: 'Execution failed',
                failedRoles: Object.entries(execution.roleOutputs)
                    .filter(([, o]) => o.status === 'failed')
                    .map(([r]) => r),
            });
        }

        const teamAnalytics = this.analyticsCache.get(teamId) || this.emptyAnalytics(teamId);
        teamAnalytics.totalExecutions++;
        if (execution.status === 'completed')
            teamAnalytics.successRate =
                (teamAnalytics.successRate * (teamAnalytics.totalExecutions - 1) + 1) /
                teamAnalytics.totalExecutions;
        this.analyticsCache.set(teamId, teamAnalytics);
        this.persistExecutions();

        return execution;
    }

    getExecution(executionId: string): TeamExecution | undefined {
        return this.executions.get(executionId);
    }

    abortExecution(executionId: string): void {
        this.abortTokens.add(executionId);
        if (this.abortTokens.size > MAX_ABORT_TOKENS) {
            const first = this.abortTokens.values().next().value;
            if (first !== undefined) this.abortTokens.delete(first);
        }
        const exec = this.executions.get(executionId);
        if (exec) {
            exec.status = 'aborted';
            exec.completedAt = Date.now();
            for (const output of Object.values(exec.roleOutputs)) {
                if (output.status === 'pending' || output.status === 'running') {
                    output.status = 'failed';
                    output.error = 'Aborted';
                }
            }
        }
        this.persistExecutions();
        this.tryEmit(EVENTS.TEAM_EXECUTION_FAILED, {
            teamId: exec?.teamId || '',
            error: 'Aborted by user',
            failedRoles: Object.entries(exec?.roleOutputs || {})
                .filter(([, o]) => o.status === 'failed')
                .map(([r]) => r),
        });
    }

    getExecutionHistory(teamId: string): TeamExecution[] {
        return Array.from(this.executions.values())
            .filter((e) => e.teamId === teamId)
            .sort((a, b) => b.startedAt - a.startedAt);
    }

    getTeamAnalytics(teamId: string): TeamAnalytics {
        const cached = this.analyticsCache.get(teamId);
        if (cached) return cached;
        const teamExecs = this.getExecutionHistory(teamId);
        if (teamExecs.length === 0) return this.emptyAnalytics(teamId);
        const completed = teamExecs.filter((e) => e.status === 'completed');
        const totalCost = completed.reduce((s, e) => s + (e.metrics?.totalCost || 0), 0);
        const totalDuration = completed.reduce((s, e) => s + (e.metrics?.totalDuration || 0), 0);
        const contribution: Record<string, number> = {};
        for (const exec of completed) {
            for (const [roleId, output] of Object.entries(exec.roleOutputs)) {
                if (output.tokens)
                    contribution[roleId] = (contribution[roleId] || 0) + output.tokens;
            }
        }
        const analytics: TeamAnalytics = {
            teamId,
            totalExecutions: teamExecs.length,
            successRate: completed.length / Math.max(1, teamExecs.length),
            avgDuration: totalDuration / Math.max(1, completed.length),
            avgCost: totalCost / Math.max(1, completed.length),
            perRoleContribution: contribution,
        };
        this.analyticsCache.set(teamId, analytics);
        return analytics;
    }

    getCompatibilityMatrix(): TeamCompatibilityEntry[] {
        const compatibilityPairs: TeamCompatibilityEntry[] = [];
        const allTeams = Array.from(this.teams.values());
        for (let i = 0; i < allTeams.length; i++) {
            for (let j = i + 1; j < allTeams.length; j++) {
                const teamA = allTeams[i]!;
                const teamB = allTeams[j]!;
                const commonRoles = teamA.roleIds.filter((r) => teamB.roleIds.includes(r));
                const overlapRatio =
                    commonRoles.length / Math.max(teamA.roleIds.length, teamB.roleIds.length);
                let score: number;
                let synergyLabel: 'synergy' | 'neutral' | 'conflict';
                if (teamA.metadata.domain === teamB.metadata.domain) {
                    score = 0.7 + overlapRatio * 0.3;
                    synergyLabel = overlapRatio > 0.3 ? 'synergy' : 'neutral';
                } else {
                    score = 0.3 + (1 - overlapRatio) * 0.4;
                    synergyLabel = overlapRatio > 0.5 ? 'conflict' : 'neutral';
                }
                compatibilityPairs.push({
                    roleA: teamA.id,
                    roleB: teamB.id,
                    score: Math.round(score * 100) / 100,
                    synergyLabel,
                    note:
                        commonRoles.length > 0
                            ? `Shared roles: ${commonRoles.join(', ')}`
                            : undefined,
                });
            }
        }
        return compatibilityPairs;
    }

    synthesizeTeamOutput(execution: TeamExecution): string {
        const completed = Object.values(execution.roleOutputs).filter(
            (o) => o.status === 'completed' && o.output,
        );
        if (completed.length === 0) return 'No outputs to synthesize.';
        if (completed.length === 1) return completed[0]!.output || '';

        const team = this.teams.get(execution.teamId);
        const strategy = team?.coordinationStrategy || 'unknown';
        const lines: string[] = ['## Synthesis', ''];
        lines.push(`Task: ${execution.task}`);
        lines.push(`Strategy: ${strategy}`);
        lines.push(
            `Roles completed: ${completed.length}/${Object.keys(execution.roleOutputs).length}`,
        );
        lines.push('');
        for (const output of completed) {
            lines.push(`### ${output.roleId}`);
            lines.push(output.output || '(no output)');
            lines.push('');
        }
        return lines.join('\n');
    }

    // ════════════════════════════════════════════════
    // Private — LLM helpers
    // ════════════════════════════════════════════════

    private pickProviderAndKey(): { provider: string; key: string; model: string } | undefined {
        const keys = this.deps.keyService.getKeys().filter((k) => k.status === 'active');
        if (keys.length === 0) return undefined;
        const key = keys[_rng.nextInt(0, keys.length - 1)]!;
        const adapter = this.deps.adapterRegistry.getAdapter(key.provider);
        if (!adapter) return undefined;
        const providerDefaults: Record<string, string> = {
            gemini: 'gemini-3.1-flash-lite',
            groq: 'llama-3.3-70b-versatile',
            openrouter: 'meta-llama/llama-3.1-8b-instruct',
            nvidia: 'meta/llama-3.1-8b-instruct',
        };
        return {
            provider: key.provider,
            key: key.key,
            model: providerDefaults[key.provider] || 'gpt-3.5-turbo',
        };
    }

    private async callRoleLLM(
        systemPrompt: string,
        task: string,
        _executionId: string,
    ): Promise<RoleOutput> {
        const startedAt = Date.now();
        const pk = this.pickProviderAndKey();
        if (!pk) {
            return {
                roleId: 'unknown',
                status: 'failed',
                error: 'No active API keys available',
                startedAt,
                completedAt: Date.now(),
            };
        }
        const adapter = this.deps.adapterRegistry.getAdapter(pk.provider);
        if (!adapter) {
            return {
                roleId: 'unknown',
                status: 'failed',
                error: `No adapter for provider ${pk.provider}`,
                startedAt,
                completedAt: Date.now(),
            };
        }
        const controller = new AbortController();
        const timer = setTimeout(
            () => controller.abort(new DOMException('Role LLM timeout', 'AbortError')),
            ROLE_LLM_TIMEOUT,
        );
        try {
            const result = await adapter.sendMessage(
                [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: task },
                ],
                pk.model,
                pk.key,
                controller.signal,
            );
            return {
                roleId: 'unknown',
                status: 'completed',
                output: result.content,
                latency: result.latency || Date.now() - startedAt,
                tokens: 0,
                cost: 0,
                startedAt,
                completedAt: Date.now(),
            };
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return {
                roleId: 'unknown',
                status: 'failed',
                error: msg,
                startedAt,
                completedAt: Date.now(),
            };
        } finally {
            clearTimeout(timer);
        }
    }

    private async callRoleWithId(
        roleId: string,
        systemPrompt: string,
        task: string,
        executionId: string,
    ): Promise<RoleOutput> {
        const result = await this.callRoleLLM(systemPrompt, task, executionId);
        result.roleId = roleId;
        return result;
    }

    private checkAborted(executionId: string): boolean {
        return this.abortTokens.has(executionId);
    }

    // ════════════════════════════════════════════════
    // Private — Strategy implementations
    // ════════════════════════════════════════════════

    private async executeParallel(execution: TeamExecution, team: RoleTeam): Promise<void> {
        const roles = [...team.roleIds];
        const results = await Promise.allSettled(
            roles.map((roleId) =>
                this.callRoleWithId(
                    roleId,
                    `You are ${roleId} in a parallel team. Analyze the task independently and provide your best output.`,
                    execution.task,
                    execution.id,
                ),
            ),
        );
        for (let i = 0; i < roles.length; i++) {
            if (this.checkAborted(execution.id)) return;
            const settled = results[i]!;
            if (settled.status === 'fulfilled') {
                execution.roleOutputs[roles[i]!] = (
                    settled as PromiseFulfilledResult<RoleOutput>
                ).value;
            } else {
                execution.roleOutputs[roles[i]!] = {
                    roleId: roles[i]!,
                    status: 'failed',
                    error:
                        ((settled as PromiseRejectedResult).reason as Error)?.message ||
                        'Execution failed',
                };
            }
        }
    }

    private async executeSequential(execution: TeamExecution, team: RoleTeam): Promise<void> {
        let context = '';
        for (const roleId of team.roleIds) {
            if (this.checkAborted(execution.id)) return;
            execution.currentRoleId = roleId;
            const systemPrompt = `You are ${roleId} in a sequential team. Previous work:\n${context || '(none yet)'}\n\nBuild upon the previous output.`;
            execution.roleOutputs[roleId] = await this.callRoleWithId(
                roleId,
                systemPrompt,
                execution.task,
                execution.id,
            );
            context = execution.roleOutputs[roleId].output || '';
        }
        execution.currentRoleId = undefined;
    }

    private async executePipeline(execution: TeamExecution, team: RoleTeam): Promise<void> {
        let pipelineInput = execution.task;
        for (const roleId of team.roleIds) {
            if (this.checkAborted(execution.id)) return;
            execution.currentRoleId = roleId;
            const systemPrompt = `You are ${roleId} in a pipeline. Your input:\n${pipelineInput}\n\nProcess this input and pass the result to the next stage. Be concise and focused.`;
            execution.roleOutputs[roleId] = await this.callRoleWithId(
                roleId,
                systemPrompt,
                execution.task,
                execution.id,
            );
            pipelineInput = execution.roleOutputs[roleId].output || pipelineInput;
        }
        execution.currentRoleId = undefined;
    }

    private async executeDebate(execution: TeamExecution, team: RoleTeam): Promise<void> {
        const maxRounds = team.executionConfig.maxRounds || 3;
        const debateLog: string[] = [execution.task];
        for (let round = 0; round < maxRounds; round++) {
            if (this.checkAborted(execution.id)) return;
            for (const roleId of team.roleIds) {
                execution.currentRoleId = roleId;
                const context = `Debate round ${round + 1}/${maxRounds}\nRecent discussion:\n${debateLog.slice(-5).join('\n')}`;
                const systemPrompt = `You are ${roleId} in a team debate. ${context}\n\nArgue your position persuasively based on the discussion so far.`;
                execution.roleOutputs[roleId] = await this.callRoleWithId(
                    roleId,
                    systemPrompt,
                    execution.task,
                    execution.id,
                );
                if (execution.roleOutputs[roleId].output) {
                    debateLog.push(
                        `[${roleId}]: ${execution.roleOutputs[roleId].output?.slice(0, 200)}`,
                    );
                }
            }
        }
        execution.currentRoleId = undefined;
    }

    private async executeConsensus(execution: TeamExecution, team: RoleTeam): Promise<void> {
        const threshold = team.executionConfig.consensusThreshold || 0.7;
        const votes: Array<{ roleId: string; approve: boolean; reasoning: string }> = [];
        for (const roleId of team.roleIds) {
            if (this.checkAborted(execution.id)) return;
            execution.roleOutputs[roleId] = await this.callRoleWithId(
                roleId,
                `You are ${roleId}. Review the task and decide: APPROVE or REJECT. Start your response with "APPROVE:" or "REJECT:" then provide your reasoning.`,
                execution.task,
                execution.id,
            );
            const output = execution.roleOutputs[roleId].output || '';
            const approves = output.toUpperCase().startsWith('APPROVE');
            votes.push({ roleId, approve: approves, reasoning: output.slice(0, 200) });
        }
        const votesFor = votes.filter((v) => v.approve).length;
        const consensus = votesFor / team.roleIds.length >= threshold;
        execution.synthesis = `Consensus ${consensus ? 'REACHED' : 'NOT REACHED'} — ${votesFor}/${team.roleIds.length} approved (threshold: ${threshold})\n\n${votes.map((v) => `[${v.roleId}]: ${v.approve ? '✅' : '❌'} ${v.reasoning}`).join('\n')}`;
    }

    private async executeHierarchical(execution: TeamExecution, team: RoleTeam): Promise<void> {
        const leaderId = team.leaderRoleId || team.roleIds[0]!;
        const subRoles = team.roleIds.filter((r) => r !== leaderId);
        execution.currentRoleId = leaderId;
        execution.roleOutputs[leaderId] = await this.callRoleWithId(
            leaderId,
            `You are the team leader (${leaderId}). Delegate sub-tasks to: ${subRoles.join(', ')}. Provide clear directives for each sub-role.`,
            execution.task,
            execution.id,
        );
        const leaderDirectives = execution.roleOutputs[leaderId].output || '';
        execution.currentRoleId = undefined;
        for (const roleId of subRoles) {
            if (this.checkAborted(execution.id)) return;
            execution.currentRoleId = roleId;
            execution.roleOutputs[roleId] = await this.callRoleWithId(
                roleId,
                `You are ${roleId}. Leader's directives:\n${leaderDirectives.slice(0, 500)}\n\nExecute your assigned sub-task.`,
                execution.task,
                execution.id,
            );
        }
        execution.currentRoleId = undefined;
    }

    private async executeSwarm(execution: TeamExecution, team: RoleTeam): Promise<void> {
        const maxMessages = team.executionConfig.maxRounds || 5;
        const messages: string[] = [execution.task];
        for (let i = 0; i < maxMessages; i++) {
            if (this.checkAborted(execution.id)) return;
            for (const roleId of team.roleIds) {
                execution.currentRoleId = roleId;
                const context = messages.slice(-3).join('\n');
                const systemPrompt = `You are ${roleId} in a free-form swarm discussion (message ${i + 1}/${maxMessages}). Recent conversation:\n${context}\n\nContribute your perspective based on the discussion.`;
                execution.roleOutputs[roleId] = await this.callRoleWithId(
                    roleId,
                    systemPrompt,
                    execution.task,
                    execution.id,
                );
                if (execution.roleOutputs[roleId].output) {
                    messages.push(
                        `[${roleId}]: ${execution.roleOutputs[roleId].output?.slice(0, 200)}`,
                    );
                }
            }
        }
        execution.currentRoleId = undefined;
    }

    private async executeTournament(execution: TeamExecution, team: RoleTeam): Promise<void> {
        const roles = [...team.roleIds];
        let round = 1;
        let bracket: Array<{ id: string }> = roles.map((id) => ({ id }));
        const scores = new Map<string, number>();
        for (const id of roles) scores.set(id, 0);
        while (bracket.length > 1) {
            if (this.checkAborted(execution.id)) return;
            const nextBracket: Array<{ id: string }> = [];
            for (let i = 0; i < bracket.length; i += 2) {
                if (i + 1 >= bracket.length) {
                    nextBracket.push(bracket[i]!);
                    break;
                }
                const a = bracket[i]!;
                const b = bracket[i + 1]!;
                execution.roleOutputs[a.id] = await this.callRoleWithId(
                    a.id,
                    `Tournament Round ${round}: You are competing against ${b.id}. Make your best case.`,
                    execution.task,
                    execution.id,
                );
                execution.roleOutputs[b.id] = await this.callRoleWithId(
                    b.id,
                    `Tournament Round ${round}: You are competing against ${a.id}. Make your best case.`,
                    execution.task,
                    execution.id,
                );
                const outputA = execution.roleOutputs[a.id]!.output || '';
                const outputB = execution.roleOutputs[b.id]!.output || '';
                const winner = outputA.length >= outputB.length ? a : b;
                scores.set(winner.id, (scores.get(winner.id) || 0) + 1);
                nextBracket.push(winner);
            }
            bracket = nextBracket;
            round++;
        }
        if (bracket.length === 1) {
            execution.synthesis = `🏆 Tournament winner: ${bracket[0]!.id} (${scores.get(bracket[0]!.id) || 0} wins)`;
        }
    }

    private async executeRoundRobin(execution: TeamExecution, team: RoleTeam): Promise<void> {
        const rounds = team.executionConfig.maxRounds || 3;
        for (let r = 0; r < rounds; r++) {
            if (this.checkAborted(execution.id)) return;
            for (const roleId of team.roleIds) {
                execution.currentRoleId = roleId;
                execution.roleOutputs[roleId] = await this.callRoleWithId(
                    roleId,
                    `You are ${roleId} in a round-robin team (Round ${r + 1}/${rounds}). Take your turn and contribute.`,
                    execution.task,
                    execution.id,
                );
            }
        }
        execution.currentRoleId = undefined;
    }

    private async executeReview(execution: TeamExecution, team: RoleTeam): Promise<void> {
        if (team.roleIds.length < 2) {
            execution.roleOutputs[team.roleIds[0]!] = await this.callRoleWithId(
                team.roleIds[0]!,
                `You are ${team.roleIds[0]}. Produce a thorough analysis.`,
                execution.task,
                execution.id,
            );
            return;
        }
        const authorId = team.roleIds[0]!;
        const reviewerIds = team.roleIds.slice(1);
        execution.currentRoleId = authorId;
        execution.roleOutputs[authorId] = await this.callRoleWithId(
            authorId,
            `You are ${authorId}. Produce a first draft or analysis.`,
            execution.task,
            execution.id,
        );
        const draft = execution.roleOutputs[authorId].output || '';
        for (const reviewerId of reviewerIds) {
            if (this.checkAborted(execution.id)) return;
            execution.currentRoleId = reviewerId;
            execution.roleOutputs[reviewerId] = await this.callRoleWithId(
                reviewerId,
                `You are ${reviewerId}. Review this draft and provide constructive feedback:\n\n${draft.slice(0, 1000)}`,
                execution.task,
                execution.id,
            );
        }
        execution.currentRoleId = authorId;
        execution.roleOutputs[authorId] = await this.callRoleWithId(
            authorId,
            `You are ${authorId}. Revise your work based on ${reviewerIds.length} reviews. Previous draft:\n${draft.slice(0, 500)}`,
            execution.task,
            execution.id,
        );
        execution.currentRoleId = undefined;
    }

    private computeMetrics(execution: TeamExecution): TeamMetrics {
        const outputs = Object.values(execution.roleOutputs);
        const completed = outputs.filter((o) => o.status === 'completed');
        const durations = completed.map((o) => (o.completedAt || 0) - (o.startedAt || 0));
        return {
            totalDuration: durations.reduce((s, d) => s + d, 0),
            totalCost: completed.reduce((s, o) => s + (o.cost || 0), 0),
            totalTokens: completed.reduce((s, o) => s + (o.tokens || 0), 0),
            roleCount: outputs.length,
            successRate: completed.length / Math.max(1, outputs.length),
        };
    }

    private emptyAnalytics(teamId: string): TeamAnalytics {
        return {
            teamId,
            totalExecutions: 0,
            successRate: 0,
            avgDuration: 0,
            avgCost: 0,
            perRoleContribution: {},
        };
    }

    /** P1-20: clean up abort tokens and maps on shutdown */
    destroy(): void {
        this.abortTokens.clear();
        this.executions.clear();
        this.analyticsCache.clear();
    }
}

async function migrateTeamsFromLocalStorage(): Promise<RoleTeam[] | null> {
    try {
        const raw = await BucketStorageAdapter.UI.get<RoleTeam[]>('role_teams_v1');
        if (raw && Array.isArray(raw) && raw.length > 0) return raw;
    } catch {
        /* ignore */
    }
    return null;
}

async function migrateExecsFromLocalStorage(): Promise<TeamExecution[] | null> {
    try {
        const raw = await BucketStorageAdapter.UI.get<TeamExecution[]>('role_team_executions_v1');
        if (raw && Array.isArray(raw) && raw.length > 0) return raw;
    } catch {
        /* ignore */
    }
    return null;
}
