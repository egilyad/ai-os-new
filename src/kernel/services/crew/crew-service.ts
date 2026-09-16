/**
 * CrewService — Wave 1.1 / 1.2 / 1.4.
 *
 * CrewAI-style teams: AgentRole + Task + Crew + Process (sequential/hierarchical).
 * - Persistence: CrewRepository (Dexie `crews` + `crewTasks`), local-first.
 * - Communication: EventBus only (`crew:*`, `task:*`).
 * - Execution: via injected ICrewTaskExecutor (default deterministic echo).
 *   Real LLM wiring comes in later waves; the service never imports LLM code.
 */
import type { IEventBus } from '../../types/interfaces';
import type { CrewRepository } from '../../dal/crew-repository';
import type {
    AgentCard,
    AgentRole,
    CreateCrewInput,
    CreateRoleInput,
    CreateTaskInput,
    CrewRunResult,
    ICrewService,
    ICrewTaskExecutor,
} from '../../contracts/crew';
import type { Crew, CrewTask } from '../../types/crew-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import { CREW_TEMPLATES, getCrewTemplate } from './crew-templates';

const LOGGER = rootLogger.child('CrewService');

export interface CrewServiceDeps {
    repository: CrewRepository;
    eventBus: IEventBus;
    executor?: ICrewTaskExecutor;
}

/** Default executor — deterministic, no network. Used until LLM wiring lands. */
class EchoExecutor implements ICrewTaskExecutor {
    async execute(input: {
        crew: Crew;
        task: CrewTask;
        role: AgentRole;
        context: string;
    }): Promise<string> {
        const ctx = input.context ? `\nContext:\n${input.context.slice(0, 2000)}` : '';
        return (
            `[${input.role.name} / ${input.role.role}] completed: ${input.task.description}\n` +
            `Expected: ${input.task.expectedOutput}${ctx}`
        );
    }
}

function now(): number {
    return Date.now();
}

function newRoleId(): string {
    return genId('role');
}

export class CrewService implements ICrewService {
    private repo: CrewRepository;
    private events: IEventBus;
    private executor: ICrewTaskExecutor;
    private aborted = new Set<string>();

    constructor(deps: CrewServiceDeps) {
        this.repo = deps.repository;
        this.events = deps.eventBus;
        this.executor = deps.executor ?? new EchoExecutor();
    }

    async init(): Promise<void> {
        LOGGER.info('CrewService', 'init', {});
    }

    async destroy(): Promise<void> {
        this.aborted.clear();
    }

    /** GAP E.1 — swap the deterministic executor for the real LLM bridge. */
    setExecutor(executor: ICrewTaskExecutor): void {
        this.executor = executor;
    }

    // ── CRUD ──
    async createCrew(input: CreateCrewInput): Promise<Crew> {
        const t = now();
        const crewId = genId('crew');
        const roles: AgentRole[] = (input.roles ?? []).map((r) => ({
            id: newRoleId(),
            name: r.name,
            role: r.role,
            goal: r.goal,
            backstory: r.backstory,
            agentId: r.agentId,
            tools: r.tools ? [...r.tools] : undefined,
            allowDelegation: r.allowDelegation ?? true,
            maxIter: r.maxIter,
            createdAt: t,
            updatedAt: t,
        }));
        // Resolve `__role:N__` placeholders used by templates/forge.
        const roleIndex = new Map(roles.map((r, i) => [`__role:${i}__`, r.id]));
        const crew: Crew = {
            id: crewId,
            name: input.name,
            description: input.description,
            process: input.process ?? 'sequential',
            managerId: input.managerId,
            roles,
            taskIds: [],
            status: 'draft',
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putCrew(crew);

        const taskIds: string[] = [];
        for (const taskInput of input.tasks ?? []) {
            const resolvedAssignee =
                roleIndex.get(taskInput.assigneeId) ?? taskInput.assigneeId;
            const task: CrewTask = {
                id: genId('task'),
                crewId,
                description: taskInput.description,
                expectedOutput: taskInput.expectedOutput,
                assigneeId: resolvedAssignee,
                outputSchema: taskInput.outputSchema,
                status: 'pending',
                dependsOn: taskInput.dependsOn ? [...taskInput.dependsOn] : undefined,
                contextTaskIds: taskInput.contextTaskIds ? [...taskInput.contextTaskIds] : undefined,
                humanInput: taskInput.humanInput,
                createdAt: now(),
                updatedAt: now(),
            };
            await this.repo.putTask(task);
            taskIds.push(task.id);
        }
        crew.taskIds = taskIds;
        crew.status = taskIds.length > 0 ? 'ready' : 'draft';
        crew.updatedAt = now();
        await this.repo.putCrew(crew);

        this.events.emit(EVENTS.CREW_CREATED, {
            crewId: crew.id,
            name: crew.name,
            process: crew.process,
            roleCount: crew.roles.length,
            taskCount: crew.taskIds.length,
        });
        return crew;
    }

    async getCrew(id: string): Promise<Crew | null> {
        return this.repo.getCrew(id);
    }

    async listCrews(): Promise<Crew[]> {
        return this.repo.listCrews();
    }

    async deleteCrew(id: string): Promise<void> {
        await this.repo.deleteCrew(id);
        this.events.emit(EVENTS.CREW_DELETED, { crewId: id });
    }

    async addRole(crewId: string, input: CreateRoleInput): Promise<AgentRole> {
        const crew = await this.repo.getCrew(crewId);
        if (!crew) throw new Error(`Crew not found: ${crewId}`);
        const t = now();
        const role: AgentRole = {
            id: newRoleId(),
            name: input.name,
            role: input.role,
            goal: input.goal,
            backstory: input.backstory,
            agentId: input.agentId,
            tools: input.tools ? [...input.tools] : undefined,
            allowDelegation: input.allowDelegation ?? true,
            maxIter: input.maxIter,
            createdAt: t,
            updatedAt: t,
        };
        crew.roles.push(role);
        crew.updatedAt = t;
        await this.repo.putCrew(crew);
        return role;
    }

    async removeRole(crewId: string, roleId: string): Promise<void> {
        const crew = await this.repo.getCrew(crewId);
        if (!crew) throw new Error(`Crew not found: ${crewId}`);
        crew.roles = crew.roles.filter((r) => r.id !== roleId);
        crew.updatedAt = now();
        await this.repo.putCrew(crew);
    }

    async addTask(crewId: string, input: CreateTaskInput): Promise<CrewTask> {
        const crew = await this.repo.getCrew(crewId);
        if (!crew) throw new Error(`Crew not found: ${crewId}`);
        const t = now();
        const task: CrewTask = {
            id: genId('task'),
            crewId,
            description: input.description,
            expectedOutput: input.expectedOutput,
            assigneeId: input.assigneeId,
            outputSchema: input.outputSchema,
            status: 'pending',
            dependsOn: input.dependsOn ? [...input.dependsOn] : undefined,
            contextTaskIds: input.contextTaskIds ? [...input.contextTaskIds] : undefined,
            humanInput: input.humanInput,
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putTask(task);
        crew.taskIds.push(task.id);
        if (crew.status === 'draft') crew.status = 'ready';
        crew.updatedAt = t;
        await this.repo.putCrew(crew);
        return task;
    }

    async listTasks(crewId: string): Promise<CrewTask[]> {
        return this.repo.listTasks(crewId);
    }

    async getTask(taskId: string): Promise<CrewTask | null> {
        return this.repo.getTask(taskId);
    }

    // ── Run ──
    async startCrew(crewId: string): Promise<CrewRunResult> {
        const crew = await this.repo.getCrew(crewId);
        if (!crew) throw new Error(`Crew not found: ${crewId}`);
        const tasks = await this.repo.listTasks(crewId);
        if (tasks.length === 0) throw new Error(`Crew ${crewId} has no tasks`);

        this.aborted.delete(crewId);
        const startedAt = now();
        crew.status = 'running';
        crew.updatedAt = startedAt;
        await this.repo.putCrew(crew);
        this.events.emit(EVENTS.CREW_STARTED, { crewId, taskCount: tasks.length });
        return this.drive(crewId, startedAt, {}, '');
    }

    /** GAP E.3 — resume a paused crew (human inputs submitted). */
    async resumeCrew(crewId: string): Promise<CrewRunResult> {
        const crew = await this.repo.getCrew(crewId);
        if (!crew) throw new Error(`Crew not found: ${crewId}`);
        if (crew.status !== 'paused') throw new Error(`Crew ${crewId} is ${crew.status} (not paused)`);
        const tasks = await this.repo.listTasks(crewId);
        const outputs: Record<string, string> = {};
        let context = '';
        for (const t of tasks) {
            if (t.status === 'completed' && t.output) {
                outputs[t.id] = t.output;
                const role = crew.roles.find((r) => r.id === t.assigneeId);
                context += `\n--- ${role?.name ?? t.assigneeId}: ${t.description}\n${t.output}\n`;
            }
        }
        crew.status = 'running';
        crew.updatedAt = now();
        await this.repo.putCrew(crew);
        return this.drive(crewId, crew.createdAt, outputs, context);
    }

    /** GAP E.3 — human submits the output for an `awaiting_human` task. */
    async submitHumanTask(crewId: string, taskId: string, output: string): Promise<CrewRunResult> {
        const task = await this.repo.getTask(taskId);
        if (!task || task.crewId !== crewId) throw new Error(`Task not found: ${taskId}`);
        if (task.status !== 'awaiting_human') throw new Error(`Task ${taskId} is ${task.status} (not awaiting human)`);
        task.status = 'completed';
        task.output = output.slice(0, 12000);
        task.completedAt = now();
        task.updatedAt = now();
        await this.repo.putTask(task);
        this.events.emit(EVENTS.TASK_COMPLETED, { crewId, taskId: task.id });
        return this.resumeCrew(crewId);
    }

    /** GAP E.3 — reset tasks for replay/test (CrewAI `replay` analogue). */
    async resetTasks(crewId: string, fromTaskId?: string): Promise<void> {
        const crew = await this.repo.getCrew(crewId);
        if (!crew) throw new Error(`Crew not found: ${crewId}`);
        const tasks = await this.repo.listTasks(crewId);
        const ordered = this.orderTasks(crew, tasks);
        let reset = !fromTaskId;
        for (const t of ordered) {
            if (fromTaskId && t.id === fromTaskId) reset = true;
            if (!reset) continue;
            t.status = 'pending';
            t.output = undefined;
            t.error = undefined;
            t.startedAt = undefined;
            t.completedAt = undefined;
            t.updatedAt = now();
            await this.repo.putTask(t);
        }
        crew.status = 'ready';
        crew.currentTaskId = undefined;
        crew.updatedAt = now();
        await this.repo.putCrew(crew);
    }

    private async drive(
        crewId: string,
        startedAt: number,
        outputs: Record<string, string>,
        context: string,
    ): Promise<CrewRunResult> {
        let crew = (await this.repo.getCrew(crewId)) as Crew;
        const ordered = this.orderTasks(crew, await this.repo.listTasks(crewId));

        for (const task of ordered) {
            if (task.status === 'completed') continue;
            if (this.aborted.has(crewId)) {
                crew = (await this.repo.getCrew(crewId)) ?? crew;
                crew.status = 'aborted';
                crew.updatedAt = now();
                await this.repo.putCrew(crew);
                this.events.emit(EVENTS.CREW_ABORTED, { crewId });
                return { crewId, status: 'aborted', outputs, startedAt, completedAt: now() };
            }
            // GAP E.3 — human-in-task gate (CrewAI `human_input`).
            if (task.humanInput && task.status !== 'awaiting_human') {
                task.status = 'awaiting_human';
                task.updatedAt = now();
                await this.repo.putTask(task);
                crew.status = 'paused';
                crew.currentTaskId = task.id;
                crew.updatedAt = now();
                await this.repo.putCrew(crew);
                this.events.emit(EVENTS.TASK_HITL, { crewId, taskId: task.id });
                return { crewId, status: 'paused', outputs, startedAt, completedAt: now() };
            }
            if (task.status === 'awaiting_human') {
                crew.status = 'paused';
                crew.currentTaskId = task.id;
                crew.updatedAt = now();
                await this.repo.putCrew(crew);
                return { crewId, status: 'paused', outputs, startedAt, completedAt: now() };
            }
            const role = crew.roles.find((r) => r.id === task.assigneeId);
            if (!role) {
                task.status = 'failed';
                task.error = `Assignee role not found: ${task.assigneeId}`;
                task.updatedAt = now();
                await this.repo.putTask(task);
                this.events.emit(EVENTS.TASK_FAILED, {
                    crewId,
                    taskId: task.id,
                    error: task.error,
                });
                continue;
            }
            // Hierarchical: manager prepends delegation context (no extra LLM call).
            let effectiveContext = this.explicitContext(ordered, task) + context;
            if (crew.process === 'hierarchical' && crew.managerId) {
                const manager = crew.roles.find((r) => r.id === crew.managerId);
                if (manager && role.id !== manager.id && role.allowDelegation !== false) {
                    effectiveContext =
                        `[Delegated by ${manager.name} (${manager.role})]\n` + effectiveContext;
                }
            }

            task.status = 'running';
            task.startedAt = now();
            task.updatedAt = now();
            crew.currentTaskId = task.id;
            crew.updatedAt = now();
            await this.repo.putTask(task);
            await this.repo.putCrew(crew);
            this.events.emit(EVENTS.TASK_STARTED, {
                crewId,
                taskId: task.id,
                assigneeId: role.id,
            });

            try {
                const output =
                    crew.process === 'consensual'
                        ? await this.runConsensual(crew, task, effectiveContext)
                        : await this.runGuarded(crew, task, role, effectiveContext);
                task.status = 'completed';
                task.output = output;
                task.completedAt = now();
                task.updatedAt = now();
                await this.repo.putTask(task);
                outputs[task.id] = output;
                context += `\n--- ${role.name}: ${task.description}\n${output}\n`;
                this.events.emit(EVENTS.TASK_COMPLETED, { crewId, taskId: task.id });
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                task.status = 'failed';
                task.error = msg;
                task.completedAt = now();
                task.updatedAt = now();
                await this.repo.putTask(task);
                this.events.emit(EVENTS.TASK_FAILED, { crewId, taskId: task.id, error: msg });
            }
        }

        crew = (await this.repo.getCrew(crewId)) ?? crew;
        const failed = (await this.repo.listTasks(crewId)).filter((t) => t.status === 'failed');
        crew.status = failed.length > 0 ? 'failed' : 'completed';
        crew.currentTaskId = undefined;
        crew.updatedAt = now();
        await this.repo.putCrew(crew);
        const completedAt = now();

        if (crew.status === 'completed') {
            this.events.emit(EVENTS.CREW_COMPLETED, { crewId, taskCount: ordered.length });
        } else {
            this.events.emit(EVENTS.CREW_FAILED, { crewId, failedCount: failed.length });
        }
        return {
            crewId,
            status: crew.status === 'completed' ? 'completed' : 'failed',
            outputs,
            startedAt,
            completedAt,
        };
    }

    /** GAP E.3 — consensual process: up to 3 roles vote, majority wins. */
    private async runConsensual(crew: Crew, task: CrewTask, context: string): Promise<string> {
        const voters = crew.roles.slice(0, 3);
        if (voters.length === 0) throw new Error('Consensual process needs at least 1 role');
        const ballots: string[] = [];
        for (const voter of voters) {
            ballots.push(
                await this.executor.execute({ crew, task, role: voter, context }),
            );
        }
        const counts = new Map<string, { n: number; first: number }>();
        ballots.forEach((b, i) => {
            const e = counts.get(b) ?? { n: 0, first: i };
            e.n += 1;
            counts.set(b, e);
        });
        let best = ballots[0] as string;
        let bestScore = -1;
        for (const [text, { n, first }] of counts) {
            const s = n * 1000 - first;
            if (s > bestScore) {
                bestScore = s;
                best = text;
            }
        }
        return `${best}\n\n[consensus: ${counts.size === 1 ? 'unanimous' : 'majority'} of ${ballots.length} votes]`;
    }

    /**
     * GAP E.3 — soft output-schema guardrail (CrewAI `expected_output` as contract):
     * checks `contains[]` / `minLength`, retries once with an augmented prompt.
     */
    private async runGuarded(
        crew: Crew,
        task: CrewTask,
        role: AgentRole,
        context: string,
    ): Promise<string> {
        let output = await this.executor.execute({ crew, task, role, context });
        const schema = task.outputSchema ?? {};
        const missing = this.schemaViolations(output, schema);
        if (missing.length > 0) {
            output = await this.executor.execute({
                crew,
                task,
                role,
                context:
                    `${context}\n\n[GUARDRAIL RETRY — previous output violated: ${missing.join('; ')}. ` +
                    `Fix it while keeping the content.]`,
            });
        }
        return output;
    }

    private schemaViolations(output: string, schema: Record<string, unknown>): string[] {
        const issues: string[] = [];
        const contains = schema['contains'];
        if (Array.isArray(contains)) {
            for (const needle of contains) {
                if (typeof needle === 'string' && !output.toLowerCase().includes(needle.toLowerCase())) {
                    issues.push(`missing "${needle}"`);
                }
            }
        }
        const minLength = schema['minLength'];
        if (typeof minLength === 'number' && output.length < minLength) {
            issues.push(`too short (${output.length} < ${minLength})`);
        }
        return issues;
    }

    /** GAP E.3 — explicit context tasks (CrewAI `context=[...]`). */
    private explicitContext(all: CrewTask[], task: CrewTask): string {
        if (!task.contextTaskIds || task.contextTaskIds.length === 0) return '';
        const byId = new Map(all.map((t) => [t.id, t]));
        const parts: string[] = [];
        for (const id of task.contextTaskIds) {
            const ref = byId.get(id);
            if (ref?.output) parts.push(`--- context: ${ref.description}\n${ref.output}`);
        }
        return parts.length > 0 ? parts.join('\n') + '\n' : '';
    }

    async abortCrew(crewId: string): Promise<void> {
        this.aborted.add(crewId);
        const crew = await this.repo.getCrew(crewId);
        if (crew && crew.status === 'running') {
            crew.status = 'aborted';
            crew.updatedAt = now();
            await this.repo.putCrew(crew);
            this.events.emit(EVENTS.CREW_ABORTED, { crewId });
        }
    }

    private orderTasks(crew: Crew, tasks: CrewTask[]): CrewTask[] {
        // Respect crew.taskIds order first, then dependsOn via stable topological pass.
        const byId = new Map(tasks.map((t) => [t.id, t]));
        const inCrewOrder = crew.taskIds
            .map((id) => byId.get(id))
            .filter((t): t is CrewTask => Boolean(t));
        const rest = tasks.filter((t) => !crew.taskIds.includes(t.id));
        const all = [...inCrewOrder, ...rest];
        const done = new Set<string>();
        const out: CrewTask[] = [];
        const pending = [...all];
        let guard = pending.length * 2 + 1;
        while (pending.length > 0 && guard-- > 0) {
            const idx = pending.findIndex((t) =>
                (t.dependsOn ?? []).every((d) => done.has(d)),
            );
            if (idx === -1) break; // cycle — keep remaining in current order
            const next = pending.splice(idx, 1)[0]!;
            out.push(next);
            done.add(next.id);
        }
        out.push(...pending);
        return out;
    }

    // ── Agent Card (Wave 1.2) ──
    cardFromRole(role: AgentRole): AgentCard {
        const t = now();
        return {
            id: role.id,
            name: role.name,
            role: role.role,
            style: undefined,
            voice: undefined,
            skills: role.tools ? [...role.tools] : [],
            limitations: [],
            goal: role.goal,
            backstory: role.backstory,
            version: 1,
            createdAt: role.createdAt ?? t,
            updatedAt: t,
        };
    }

    roleFromCard(card: AgentCard): CreateRoleInput {
        return {
            name: card.name,
            role: card.role,
            goal: card.goal ?? '',
            backstory: card.backstory ?? '',
            tools: card.skills ? [...card.skills] : undefined,
            allowDelegation: true,
        };
    }

    exportCard(card: AgentCard): string {
        return JSON.stringify({ kind: 'agent-card', version: 1, card }, null, 2);
    }

    importCard(json: string): AgentCard {
        let parsed: unknown;
        try {
            parsed = JSON.parse(json);
        } catch {
            throw new Error('AgentCard import: invalid JSON');
        }
        const card =
            typeof parsed === 'object' &&
            parsed !== null &&
            'card' in parsed &&
            typeof (parsed as { card: unknown }).card === 'object'
                ? ((parsed as { card: unknown }).card as unknown)
                : parsed;
        if (!this.validateCard(card)) throw new Error('AgentCard import: schema mismatch');
        return card;
    }

    validateCard(card: unknown): card is AgentCard {
        if (typeof card !== 'object' || card === null) return false;
        const c = card as Record<string, unknown>;
        return (
            typeof c['id'] === 'string' &&
            typeof c['name'] === 'string' &&
            typeof c['role'] === 'string' &&
            (c['goal'] === undefined || typeof c['goal'] === 'string') &&
            (c['backstory'] === undefined || typeof c['backstory'] === 'string') &&
            (c['style'] === undefined || typeof c['style'] === 'string') &&
            (c['voice'] === undefined || typeof c['voice'] === 'string') &&
            (c['skills'] === undefined || Array.isArray(c['skills'])) &&
            (c['limitations'] === undefined || Array.isArray(c['limitations']))
        );
    }

    // ── Templates (Wave 1.4) ──
    listTemplates(): Array<{ id: string; name: string; description: string }> {
        return CREW_TEMPLATES.map((t) => ({ id: t.id, name: t.name, description: t.description }));
    }

    async createCrewFromTemplate(
        templateId: string,
        overrides?: Partial<CreateCrewInput>,
    ): Promise<Crew> {
        const tpl = getCrewTemplate(templateId);
        if (!tpl) throw new Error(`Crew template not found: ${templateId}`);
        const base = tpl.build();
        return this.createCrew({
            name: overrides?.name ?? base.name,
            description: overrides?.description ?? base.description,
            process: overrides?.process ?? base.process,
            managerId: overrides?.managerId ?? base.managerId,
            roles: overrides?.roles ?? base.roles,
            tasks: overrides?.tasks ?? base.tasks,
        });
    }
}
