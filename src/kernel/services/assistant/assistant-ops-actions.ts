/**
 * The assistant's operational eyes: what the system is doing right now.
 *
 * These are read-only observations of runtime state — topology, metrics,
 * traces and pending approvals. They exist so the assistant can answer
 * "почему тормозит", "что сейчас выполняется" and "кого ждёт система"
 * from numbers instead of guessing.
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
    /** Recurring automation: the one operational write the assistant has. */
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
}

type ScheduleFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

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
