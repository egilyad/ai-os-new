/**
 * The assistant's operational hands and eyes: what the system is doing right
 * now and the work the assistant can start on it.
 *
 * Reads are observations of runtime state — topology, metrics, traces, pending
 * approvals and the task board. They exist so the assistant can answer
 * "почему тормозит", "что сейчас выполняется" and "кого ждёт система" from
 * numbers instead of guessing. Writes are scheduled automation and task
 * delegation; both go through the permission gate.
 */
import type { AssistantAction } from '../../contracts/assistant';

/** Structural shapes of the services behind these actions (kept minimal). */
export interface AssistantOpsDeps {
    topology?: {
        summary(): {
            id: string;
            name: string;
            nodes: number;
            agents: number;
            routers: number;
            paused: number;
            edges: number;
        } | null;
    };
    metrics?: {
        aggregated(): {
            totalRequests: number;
            totalTokens: number;
            estimatedCost: number;
            avgLatency: number;
            successRate: number;
            errorRate: number;
            activeProviders: number;
            totalProviders: number;
        };
    };
    traces?: {
        stats(): {
            total: number;
            completed: number;
            failed: number;
            running: number;
            successRate: number;
            avgDuration: number;
            avgTokens: number;
        };
    };
    approvals?: {
        pending(): Array<{ id: string; tool?: string; agentId?: string }>;
    };
    /** Recurring automation: the assistant's first operational write. */
    scheduler?: {
        create(data: {
            name: string;
            agentId: string;
            frequency: ScheduleFrequency;
            cronExpression?: string;
            taskParams: { prompt: string; priority?: 'low' | 'normal' | 'high' };
        }): Promise<{
            id: string;
            name: string;
            agentId: string;
            cronExpression: string;
            nextRun?: number;
        }>;
        getAll(): Array<{ id: string }>;
        validateCron?(cron: string): boolean;
    };
    /** Only used to refuse schedules for agents that do not exist. */
    agents?: {
        getAgents(): Array<{ id: string }>;
    };
    /** The task board: what the system owes and who is on it. */
    tasks?: {
        list(): Promise<
            Array<{ id: string; title: string; status: string; assigneeId?: string }>
        >;
        create(input: {
            title: string;
            description?: string;
            type: TaskType;
            priority: TaskPriority;
            assigneeId?: string;
            creatorId?: string;
        }): Promise<{ id: string; title: string; status: string; assigneeId?: string }>;
    };
}

type ScheduleFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

type TaskType = 'ONE_TIME' | 'RECURRING' | 'CONTINUOUS';

type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const TASK_TYPES: TaskType[] = ['ONE_TIME', 'RECURRING', 'CONTINUOUS'];

const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const FREQUENCIES: ScheduleFrequency[] = ['hourly', 'daily', 'weekly', 'monthly', 'custom'];

const pct = (v: number): string => `${Math.round(v * 100)}%`;

export function createAssistantOpsActions(deps: AssistantOpsDeps): AssistantAction[] {
    const actions: AssistantAction[] = [];

    actions.push({
        id: 'topology.summary',
        group: 'research',
        description:
            'Summarise the active topology: how many nodes, agents, routers, paused agents and edges it has.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            const t = deps.topology?.summary();
            if (!t) return { ok: false, detail: 'no active topology', verification: 'discovered' };
            return {
                ok: true,
                detail: `Topology "${t.name}" (${t.id}): ${t.nodes} nodes, ${t.agents} agents, ${t.routers} routers, ${t.paused} paused, ${t.edges} edges`,
                evidence: `${t.agents} agent(s), ${t.paused} paused, ${t.edges} edge(s)`,
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'metrics.summary',
        group: 'research',
        description:
            'Read the aggregated runtime metrics: requests, tokens, estimated cost, latency, success and error rates, active providers.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            const m = deps.metrics?.aggregated();
            if (!m) return { ok: false, detail: 'metrics are not available', verification: 'discovered' };
            return {
                ok: true,
                detail: `${m.totalRequests} request(s), ${m.totalTokens} tokens, ~$${m.estimatedCost.toFixed(4)}, avg ${Math.round(m.avgLatency)} ms, success ${pct(m.successRate)}, errors ${pct(m.errorRate)}, providers ${m.activeProviders}/${m.totalProviders}`,
                evidence: `requests: ${m.totalRequests} | tokens: ${m.totalTokens} | success: ${pct(m.successRate)}`,
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'traces.summary',
        group: 'research',
        description:
            'Summarise recent execution traces: total, completed, failed, running, success rate, average duration and tokens.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            const t = deps.traces?.stats();
            if (!t) return { ok: false, detail: 'traces are not available', verification: 'discovered' };
            return {
                ok: true,
                detail: `${t.total} trace(s): ${t.completed} completed, ${t.failed} failed, ${t.running} running, success ${pct(t.successRate)}, avg ${Math.round(t.avgDuration)} ms`,
                evidence: `total: ${t.total} | failed: ${t.failed} | avgDuration: ${Math.round(t.avgDuration)} ms`,
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'approvals.pending',
        group: 'research',
        description:
            'List the actions waiting for a human confirmation. Use it when the user asks what the system is waiting for.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            const pending = deps.approvals?.pending();
            if (!pending) return { ok: false, detail: 'approvals are not available', verification: 'discovered' };
            if (pending.length === 0) {
                return { ok: true, detail: 'nothing is waiting for confirmation', evidence: 'pending: 0', verification: 'verified' };
            }
            return {
                ok: true,
                detail: `${pending.length} request(s) waiting for confirmation`,
                evidence: pending
                    .map((p) => `${p.id}${p.tool ? ` ${p.tool}` : ''}${p.agentId ? ` (${p.agentId})` : ''}`)
                    .join(' | '),
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'tasks.list',
        group: 'coordination',
        description:
            'List the tasks of the system with their status and assignee. Optionally filter by agent.',
        parameters: {
            type: 'object',
            properties: {
                agentId: {
                    type: 'string',
                    description: 'Only show tasks assigned to this agent.',
                },
            },
        },
        action: 'tool:read',
        run: async (args) => {
            const tasks = deps.tasks;
            if (!tasks) return { ok: false, detail: 'task board is not available' };
            const agentId = typeof args['agentId'] === 'string' ? args['agentId'].trim() : '';
            const all = await tasks.list();
            const filtered = agentId ? all.filter((t) => t.assigneeId === agentId) : all;
            if (filtered.length === 0) {
                return {
                    ok: true,
                    detail: agentId ? `no tasks assigned to ${agentId}` : 'no tasks',
                    evidence: 'tasks: 0',
                    verification: 'verified',
                };
            }
            return {
                ok: true,
                detail: `${filtered.length} task(s)`,
                evidence: filtered
                    .map((t) => `${t.title} (${t.status}${t.assigneeId ? `, ${t.assigneeId}` : ''})`)
                    .join(' | '),
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'tasks.create',
        group: 'coordination',
        description:
            'Delegate work by creating a task for an agent. The task is stored on the board and becomes that agent\'s responsibility. Confirm with the user before delegating.',
        parameters: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'What has to be done, short and concrete.' },
                description: {
                    type: 'string',
                    description: 'Details, context and the definition of done.',
                },
                agentId: {
                    type: 'string',
                    description: 'Agent that owns the task. Omit for an unassigned task.',
                },
                type: {
                    type: 'string',
                    enum: TASK_TYPES,
                    description: 'ONE_TIME (default), RECURRING or CONTINUOUS.',
                },
                priority: {
                    type: 'string',
                    enum: TASK_PRIORITIES,
                    description: 'LOW, MEDIUM (default), HIGH or CRITICAL.',
                },
            },
            required: ['title'],
        },
        action: 'tool:write',
        run: async (args) => {
            const tasks = deps.tasks;
            if (!tasks) return { ok: false, detail: 'task board is not available' };

            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const title = text(args['title']);
            const description = text(args['description']);
            const agentId = text(args['agentId']);
            const type = (text(args['type']) || 'ONE_TIME') as TaskType;
            const priority = (text(args['priority']) || 'MEDIUM') as TaskPriority;

            if (!title) return { ok: false, detail: 'title is required' };
            if (title.length > 200) return { ok: false, detail: 'title is too long (max 200)' };
            if (description.length > 2000) {
                return { ok: false, detail: 'description is too long (max 2000)' };
            }
            if (!TASK_TYPES.includes(type)) return { ok: false, detail: `Unknown type: ${type}` };
            if (!TASK_PRIORITIES.includes(priority)) {
                return { ok: false, detail: `Unknown priority: ${priority}` };
            }
            if (agentId && deps.agents) {
                const exists = deps.agents.getAgents().some((a) => a.id === agentId);
                if (!exists) return { ok: false, detail: `Agent ${agentId} does not exist` };
            }

            const created = await tasks.create({
                title,
                ...(description ? { description } : {}),
                type,
                priority,
                ...(agentId ? { assigneeId: agentId } : {}),
                creatorId: 'assistant',
            });

            // Read it back: a task that is not on the board was not delegated.
            const listed = await tasks.list();
            const fresh = listed.find((t) => t.id === created.id);
            if (!fresh) return { ok: false, detail: `Task ${created.id} was not stored` };

            return {
                ok: true,
                detail: `Created task "${fresh.title}"${fresh.assigneeId ? ` for ${fresh.assigneeId}` : ' (unassigned)'}`,
                evidence: `task: ${fresh.id} | status: ${fresh.status} | priority: ${priority}${fresh.assigneeId ? ` | assignee: ${fresh.assigneeId}` : ''}`,
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'scheduler.create',
        group: 'work',
        description:
            'Create a recurring task (hourly, daily, weekly, monthly or a custom cron). The task runs the given prompt on an agent; by default on the assistant itself. Confirm with the user before creating it.',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Short name of the schedule.' },
                prompt: { type: 'string', description: 'What the agent should do on each run.' },
                frequency: {
                    type: 'string',
                    enum: FREQUENCIES,
                    description: 'How often it runs; "custom" needs cronExpression.',
                },
                cronExpression: {
                    type: 'string',
                    description: 'Cron expression for the custom frequency.',
                },
                agentId: {
                    type: 'string',
                    description: 'Agent that runs the task (default: assistant).',
                },
                priority: { type: 'string', enum: ['low', 'normal', 'high'] },
            },
            required: ['name', 'prompt', 'frequency'],
        },
        action: 'tool:write',
        run: async (args) => {
            const scheduler = deps.scheduler;
            if (!scheduler) return { ok: false, detail: 'scheduler is not available' };

            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const name = text(args['name']);
            const prompt = text(args['prompt']);
            const frequency = text(args['frequency']) as ScheduleFrequency;
            const cronExpression = text(args['cronExpression']);
            const agentId = text(args['agentId']) || 'assistant';
            const priority = text(args['priority']) || undefined;

            if (!name) return { ok: false, detail: 'name is required' };
            if (name.length > 80) return { ok: false, detail: 'name is too long (max 80)' };
            if (!prompt) return { ok: false, detail: 'prompt is required' };
            if (prompt.length > 500) return { ok: false, detail: 'prompt is too long (max 500)' };
            if (!FREQUENCIES.includes(frequency)) {
                return { ok: false, detail: `Unknown frequency: ${frequency || '(empty)'}` };
            }
            if (frequency === 'custom') {
                if (!cronExpression) {
                    return { ok: false, detail: 'cronExpression is required for the custom frequency' };
                }
                if (scheduler.validateCron && !scheduler.validateCron(cronExpression)) {
                    return { ok: false, detail: `Invalid cron expression: ${cronExpression}` };
                }
            }
            if (priority && !['low', 'normal', 'high'].includes(priority)) {
                return { ok: false, detail: `Unknown priority: ${priority}` };
            }
            if (deps.agents) {
                const exists = deps.agents.getAgents().some((a) => a.id === agentId);
                if (!exists) return { ok: false, detail: `Agent ${agentId} does not exist` };
            }

            const created = await scheduler.create({
                name,
                agentId,
                frequency,
                cronExpression: frequency === 'custom' ? cronExpression : undefined,
                taskParams: {
                    prompt,
                    ...(priority ? { priority: priority as 'low' | 'normal' | 'high' } : {}),
                },
            });

            // Read it back: a schedule that is not listed is not a schedule.
            const listed = scheduler.getAll().some((s) => s.id === created.id);
            if (!listed) return { ok: false, detail: `Schedule ${created.id} was not stored` };

            const nextRun =
                typeof created.nextRun === 'number'
                    ? ` | next run: ${new Date(created.nextRun).toISOString()}`
                    : '';
            return {
                ok: true,
                detail: `Scheduled "${created.name}" (${frequency}) on agent ${created.agentId}`,
                evidence: `schedule: ${created.id} | cron: ${created.cronExpression} | agent: ${created.agentId}${nextRun}`,
                verification: 'verified',
            };
        },
    });

    return actions;
}
