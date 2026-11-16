/**
 * The assistant's operational hands and eyes: what the system is doing right
 * now and the work the assistant can start on it.
 *
 * Reads are observations of runtime state ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â topology, metrics, traces, pending
 * approvals and the task board. They exist so the assistant can answer
 * "ÃƒÂÃ‚Â¿ÃƒÂÃ‚Â¾Ãƒâ€˜Ã¢â‚¬Â¡ÃƒÂÃ‚ÂµÃƒÂÃ‚Â¼Ãƒâ€˜Ã†â€™ Ãƒâ€˜Ã¢â‚¬Å¡ÃƒÂÃ‚Â¾Ãƒâ€˜Ã¢â€šÂ¬ÃƒÂÃ‚Â¼ÃƒÂÃ‚Â¾ÃƒÂÃ‚Â·ÃƒÂÃ‚Â¸Ãƒâ€˜Ã¢â‚¬Å¡", "Ãƒâ€˜Ã¢â‚¬Â¡Ãƒâ€˜Ã¢â‚¬Å¡ÃƒÂÃ‚Â¾ Ãƒâ€˜Ã‚ÂÃƒÂÃ‚ÂµÃƒÂÃ‚Â¹Ãƒâ€˜Ã¢â‚¬Â¡ÃƒÂÃ‚Â°Ãƒâ€˜Ã‚Â ÃƒÂÃ‚Â²Ãƒâ€˜Ã¢â‚¬Â¹ÃƒÂÃ‚Â¿ÃƒÂÃ‚Â¾ÃƒÂÃ‚Â»ÃƒÂÃ‚Â½Ãƒâ€˜Ã‚ÂÃƒÂÃ‚ÂµÃƒâ€˜Ã¢â‚¬Å¡Ãƒâ€˜Ã‚ÂÃƒâ€˜Ã‚Â" and "ÃƒÂÃ‚ÂºÃƒÂÃ‚Â¾ÃƒÂÃ‚Â³ÃƒÂÃ‚Â¾ ÃƒÂÃ‚Â¶ÃƒÂÃ‚Â´Ãƒâ€˜Ã¢â‚¬ËœÃƒâ€˜Ã¢â‚¬Å¡ Ãƒâ€˜Ã‚ÂÃƒÂÃ‚Â¸Ãƒâ€˜Ã‚ÂÃƒâ€˜Ã¢â‚¬Å¡ÃƒÂÃ‚ÂµÃƒÂÃ‚Â¼ÃƒÂÃ‚Â°" from
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
        getAll(): Array<{
            id: string;
            name: string;
            agentId: string;
            cronExpression: string;
            enabled: boolean;
            nextRun?: number;
            lastRun?: number;
            runCount?: number;
        }>;
        getById(id: string): { id: string; name: string; enabled: boolean } | undefined;
        toggle(
            id: string,
            enabled: boolean,
        ): Promise<{ id: string; name: string; enabled: boolean } | null>;
        remove(id: string): Promise<boolean>;
        validateCron?(cron: string): boolean;
    };
    /** Only used to refuse schedules for agents that do not exist. */
    agents?: {
        getAgents(): Array<{ id: string }>;
    };
    /** The task board: what the system owes and who is on it. */
    tasks?: {
        list(): Promise<Array<{ id: string; title: string; status: string; assigneeId?: string }>>;
        create(input: {
            title: string;
            description?: string;
            type: TaskType;
            priority: TaskPriority;
            assigneeId?: string;
            creatorId?: string;
        }): Promise<{ id: string; title: string; status: string; assigneeId?: string }>;
    };
    /** M2.1 — agent→agent handoff protocol. */
    handoff?: {
        handoff(opts: {
            fromAgent: string;
            toAgent: string;
            description: string;
            context: string;
            expectedOutput?: string;
            priority?: 'critical' | 'high' | 'normal' | 'low';
        }): Promise<{ id: string; status: string }>;
    };
    /** M2.3 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Invocation Engine. */
    invocation?: {
        invoke(req: {
            source: string;
            caller: { kind: string; id: string };
            target: { agentId?: string; role?: string; expertise?: string[] };
            reason: string;
            context: { type: string; ref: string };
            constraints?: { mode?: string; maxTurns?: number; ttlMs?: number };
        }): Promise<{ id: string; status: string; rejectionReason?: string }>;
    };
    /** M2.4 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â agent group execution. */
    agentsExecute?: {
        executeGroup(groupId: string, input: string): Promise<string[]>;
    };
    /** F5 â€” Wiki closed-loop research. */
    wikiResearch?: {
        research(question: string): Promise<{
            sources: Array<{ slug: string; title: string; snippet: string }>;
            hypothesisId?: string;
            summary?: string;
            status: string;
        }>;
        checkHypothesis(id: string): Promise<{ ok: boolean; evidence: string[]; message: string }>;
    };
    /** F6 — Knowledge Potential Graph lifecycle (propose/activate/supersede). */
    graphF6?: {
        proposeNode(
            input: {
                projectId: string;
                kind: string;
                label: string;
                refType?: string;
                refId?: string;
                payload?: Record<string, unknown>;
            },
            confidence?: number,
        ): Promise<{ id: string; status?: string }>;
        activateNode(id: string): Promise<{ id: string; status?: string } | undefined>;
        supersedeNode(id: string): Promise<{ id: string; status?: string } | undefined>;
        listPotential(projectId: string): Promise<
            Array<{
                node: { id: string; label: string; kind: string };
                edges: Array<{ id: string; relation: string }>;
            }>
        >;
        promoteEdge(id: string): Promise<{ id: string; status?: string } | undefined>;
    };

    /** Topic Graph ? ??????????????? ????? ??????. */
    topicGraph?: {
        createTopic(title: string, description: string): Promise<{ id: string; title: string }>;
        ingest(topicId: string, payload: { kind: string; ref: string; title: string; content: string }): Promise<{
            status: string;
            stats: { newClaims: number; duplicates: number; conflicts: number; relations: number };
        }>;
        completeness(topicId: string): Promise<{
            totalClaims: number;
            uniqueConcepts: number;
            conflicts: number;
            sources: number;
            coverage: number;
        }>;
    };
    /** Read-only system observer (health, errors, stuck runs). */
    observer?: {
        status(): Promise<{
            health: 'ok' | 'degraded' | 'error';
            summary: string;
            fields: Record<string, unknown>;
        }>;
    };
    /** Sidecar attachments (visual evidence; roadmap: images from sidecar). */
    attachments?: {
        register(input: {
            projectId?: string;
            sourceKind: string;
            sourceRef: string;
            caption: string;
            mimeType: string;
            dataB64: string;
            width?: number;
            height?: number;
        }): Promise<{ id: string }>;
        list(filter?: {
            projectId?: string;
            sourceKind?: string;
            sourceRef?: string;
        }): Promise<Array<{ id: string; sourceRef: string; caption: string; mimeType: string }>>;
        get(id: string): Promise<
            | {
                  id: string;
                  sourceRef: string;
                  caption: string;
                  mimeType: string;
                  width?: number;
                  height?: number;
              }
            | undefined
        >;
        detach(id: string): Promise<boolean>;
    };
    /** Vision helper over sidecar attachments. */
    vision?: {
        describe(attachmentId: string, prompt?: string): Promise<string>;
    };
    /** Privileged operations (approval-gated via tool:exec). */
    ops?: {
        restartAgent(agentId: string): Promise<boolean>;
        retryTask(taskId: string): Promise<boolean>;
        switchProfile(profileId: string): boolean;
    };
    /** Image generation facade. */
    images?: {
        generate(
            prompt: string,
            opts?: { size?: string; provider?: string },
        ): Promise<{
            dataB64: string;
            mimeType: string;
            width?: number;
            height?: number;
            provider: string;
            note?: string;
        }>;
        listProviders(): string[];
    };
    /** QW2 — live Wiki brain context provider (Core + snippets). */
    wikiContext?: {
        retrieve(
            query: string,
            opts?: { topK?: number; maxTokens?: number },
        ): Promise<{
            snippets: Array<{
                pageSlug: string;
                title: string;
                markdown: string;
                sources: string[];
            }>;
            totalTokens: number;
        }>;
        retrieveBySlugs(slugs: string[]): Promise<Array<{ slug: string }>>;
    };
    /** F5b — external literature retrieval (SciAgents-pattern). */
    literature?: {
        fetch(
            query: string,
            opts?: { provider?: string; maxResults?: number },
        ): Promise<
            Array<{
                provider: string;
                providerLabel: string;
                papers: Array<{
                    id: string;
                    title: string;
                    summary: string;
                    url: string;
                    authors: string[];
                    source: string;
                }>;
            }>
        >;
        listProviders(): Array<{ id: string; label: string }>;
        ingestAsSources(
            papers: Array<{
                title: string;
                url: string;
                summary: string;
                authors: string[];
                source: string;
            }>,
            projectId?: string,
        ): Promise<number>;
    };
    /** M4 — structured planner & plan-execution loop. */
    planner?: {
        createPlan(
            goal: string,
            steps?: Array<{ title: string; actionId?: string; args?: Record<string, unknown> }>,
            projectId?: string,
        ): Promise<{
            id: string;
            goal: string;
            status: string;
            steps: Array<{ id: string; order: number; title: string; status: string }>;
        }>;
        list(projectId?: string): Promise<
            Array<{
                id: string;
                goal: string;
                status: string;
                steps: Array<{ id: string; title: string; status: string }>;
            }>
        >;
        get(id: string): Promise<
            | {
                  id: string;
                  goal: string;
                  status: string;
                  steps: Array<{ id: string; title: string; status: string; result?: string }>;
              }
            | undefined
        >;
        run(id: string): Promise<
            | {
                  id: string;
                  goal: string;
                  status: string;
                  steps: Array<{
                      id: string;
                      title: string;
                      status: string;
                      result?: string;
                      error?: string;
                  }>;
              }
            | undefined
        >;
        pause(id: string): boolean;
        step(id: string): Promise<
            | {
                  id: string;
                  goal: string;
                  status: string;
                  steps: Array<{ id: string; title: string; status: string; result?: string }>;
              }
            | undefined
        >;
    };

    /** M3.1 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Projects subsystem (read). */
    projects?: {
        list(): Promise<
            Array<{ id: string; name: string; description: string; status: string; type: string }>
        >;
        get(
            id: string,
        ): Promise<
            | { id: string; name: string; description: string; status: string; type: string }
            | undefined
        >;
    };
    /** M3.2 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Forum subsystem (read). */
    forum?: {
        listTopics(filter?: {
            category?: string;
            limit?: number;
        }): Promise<Array<{ id: string; title: string; category: string }>>;
        getThread(topicId: string): Promise<{
            topic: { id: string; title: string };
            posts: Array<{ id: string; body: string }>;
        } | null>;
    };
    /** Universal project graph (entity-relationship). */
    graph?: {
        listProject(projectId: string): Promise<{
            nodes: Array<{ id: string; kind: string; label: string }>;
            edges: Array<{ id: string; from: string; to: string; relation: string }>;
        }>;
        neighbors(
            projectId: string,
            nodeId: string,
        ): Promise<
            Array<{
                node: { id: string; kind: string; label: string };
                edges: Array<{ relation: string }>;
            }>
        >;
        findByRelation(
            projectId: string,
            relation: string,
        ): Promise<Array<{ from: string; to: string; relation: string }>>;
        traverse(
            projectId: string,
            nodeId: string,
            depth?: number,
        ): Promise<Array<{ id: string; kind: string; label: string }>>;
    };
    /** Real provider behaviour: score, reliability, latency and cost. */
    providers?: {
        rankings(installed: string[]): Array<{
            provider: string;
            score: number;
            reliability: number;
            avgLatency: number;
            requests: number;
            costPerRequest: number;
            recommendation: string;
        }>;
        installed(): string[];
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
            if (!m)
                return {
                    ok: false,
                    detail: 'metrics are not available',
                    verification: 'discovered',
                };
            return {
                ok: true,
                detail: `${m.totalRequests} request(s), ${m.totalTokens} tokens, ~$${m.estimatedCost.toFixed(4)}, avg ${Math.round(m.avgLatency)} ms, success ${pct(m.successRate)}, errors ${pct(m.errorRate)}, providers ${m.activeProviders}/${m.totalProviders}`,
                evidence: `requests: ${m.totalRequests} | tokens: ${m.totalTokens} | success: ${pct(m.successRate)}`,
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'providers.health',
        group: 'research',
        description:
            'Rank the providers by real traffic: reliability, average latency, request count, cost per request and the recommendation. Use it when the user asks which provider is best, slow or expensive.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            const providers = deps.providers;
            if (!providers) {
                return {
                    ok: false,
                    detail: 'provider metrics are not available',
                    verification: 'discovered',
                };
            }
            const rows = providers
                .rankings(providers.installed())
                .slice()
                .sort((a, b) => b.score - a.score);
            if (rows.length === 0) {
                return {
                    ok: true,
                    detail: 'no provider metrics yet',
                    evidence: 'providers: 0',
                    verification: 'verified',
                };
            }
            const line = (r: (typeof rows)[number]): string =>
                `${r.provider}: ${Math.round(r.reliability * 100)}% reliable, avg ${Math.round(r.avgLatency)} ms, ${r.requests} request(s), $${r.costPerRequest.toFixed(4)}/request ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â ${r.recommendation}`;
            // The empty-guard above guarantees a first row here.
            const top = rows[0]!;
            return {
                ok: true,
                detail: `${rows.length} provider(s); best: ${top.provider} (${top.recommendation})`,
                evidence: rows.slice(0, 5).map(line).join(' | '),
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
            if (!t)
                return {
                    ok: false,
                    detail: 'traces are not available',
                    verification: 'discovered',
                };
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
            if (!pending)
                return {
                    ok: false,
                    detail: 'approvals are not available',
                    verification: 'discovered',
                };
            if (pending.length === 0) {
                return {
                    ok: true,
                    detail: 'nothing is waiting for confirmation',
                    evidence: 'pending: 0',
                    verification: 'verified',
                };
            }
            return {
                ok: true,
                detail: `${pending.length} request(s) waiting for confirmation`,
                evidence: pending
                    .map(
                        (p) =>
                            `${p.id}${p.tool ? ` ${p.tool}` : ''}${p.agentId ? ` (${p.agentId})` : ''}`,
                    )
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
                    .map(
                        (t) => `${t.title} (${t.status}${t.assigneeId ? `, ${t.assigneeId}` : ''})`,
                    )
                    .join(' | '),
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'tasks.create',
        group: 'coordination',
        description:
            "Delegate work by creating a task for an agent. The task is stored on the board and becomes that agent's responsibility. Confirm with the user before delegating.",
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

            // M2.1 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â initiate a handoff when a specific agent was picked.
            let handoffEvidence = '';
            if (agentId && deps.handoff) {
                try {
                    const ho = await deps.handoff.handoff({
                        fromAgent: 'assistant',
                        toAgent: agentId,
                        description: title,
                        context: `task:${created.id}`,
                        expectedOutput: description || undefined,
                        priority:
                            priority === 'CRITICAL'
                                ? 'critical'
                                : priority === 'HIGH'
                                  ? 'high'
                                  : 'normal',
                    });
                    handoffEvidence = ` | handoff: ${ho.id}`;
                } catch (e) {
                    handoffEvidence = ` | handoff failed: ${e instanceof Error ? e.message : String(e)}`;
                }
            }

            return {
                ok: true,
                detail: `Created task "${fresh.title}"${fresh.assigneeId ? ` for ${fresh.assigneeId}` : ' (unassigned)'}`,
                evidence: `task: ${fresh.id} | status: ${fresh.status} | priority: ${priority}${fresh.assigneeId ? ` | assignee: ${fresh.assigneeId}` : ''}${handoffEvidence}`,
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
                    return {
                        ok: false,
                        detail: 'cronExpression is required for the custom frequency',
                    };
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

    actions.push({
        id: 'scheduler.toggle',
        group: 'work',
        description:
            'Pause or resume an existing recurring task. Use scheduler.list to find its id first; confirm with the user before pausing anything.',
        parameters: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Schedule id.' },
                enabled: {
                    type: 'boolean',
                    description: 'true to resume, false to pause.',
                },
            },
            required: ['id', 'enabled'],
        },
        action: 'tool:write',
        run: async (args) => {
            const scheduler = deps.scheduler;
            if (!scheduler) return { ok: false, detail: 'scheduler is not available' };

            const id = typeof args['id'] === 'string' ? args['id'].trim() : '';
            if (!id) return { ok: false, detail: 'id is required' };
            if (typeof args['enabled'] !== 'boolean') {
                return { ok: false, detail: 'enabled must be true or false' };
            }
            const enabled = args['enabled'];
            const before = scheduler.getById(id);
            if (!before) return { ok: false, detail: `Schedule ${id} does not exist` };

            if (before.enabled === enabled) {
                return {
                    ok: true,
                    detail: `Schedule "${before.name}" is already ${enabled ? 'running' : 'paused'}`,
                    evidence: `schedule: ${before.id} | enabled: ${before.enabled}`,
                    verification: 'verified',
                };
            }

            const updated = await scheduler.toggle(id, enabled);
            if (!updated) return { ok: false, detail: `Schedule ${id} was not updated` };
            const after = scheduler.getById(id);
            if (!after || after.enabled !== enabled) {
                return { ok: false, detail: `Schedule ${id} did not change state` };
            }
            return {
                ok: true,
                detail: `${enabled ? 'Resumed' : 'Paused'} "${after.name}"`,
                evidence: `schedule: ${after.id} | enabled: ${after.enabled} (was ${before.enabled})`,
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'scheduler.delete',
        group: 'work',
        description:
            'Delete a recurring task permanently. Use scheduler.list to find its id, state what will be deleted and confirm with the user first.',
        parameters: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Schedule id.' },
            },
            required: ['id'],
        },
        action: 'tool:write',
        run: async (args) => {
            const scheduler = deps.scheduler;
            if (!scheduler) return { ok: false, detail: 'scheduler is not available' };

            const id = typeof args['id'] === 'string' ? args['id'].trim() : '';
            if (!id) return { ok: false, detail: 'id is required' };
            const before = scheduler.getById(id);
            if (!before) return { ok: false, detail: `Schedule ${id} does not exist` };

            const deleted = await scheduler.remove(id);
            if (!deleted) return { ok: false, detail: `Schedule ${id} was not deleted` };
            // A deletion that still lists the schedule did not happen.
            if (scheduler.getById(id))
                return { ok: false, detail: `Schedule ${id} is still there` };
            return {
                ok: true,
                detail: `Deleted schedule "${before.name}"`,
                evidence: `deleted: ${before.id} | name: ${before.name}`,
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'scheduler.list',
        group: 'coordination',
        description:
            'List the recurring schedules of the system: id, name, agent, cron, whether it is enabled and the next run. Use it to find the id before pausing or deleting one.',
        parameters: {
            type: 'object',
            properties: {
                agentId: {
                    type: 'string',
                    description: 'Only schedules of this agent (optional).',
                },
            },
        },
        action: 'tool:read',
        run: async (args) => {
            const scheduler = deps.scheduler;
            if (!scheduler) return { ok: false, detail: 'scheduler is not available' };
            const agentId = typeof args['agentId'] === 'string' ? args['agentId'].trim() : '';
            const all = scheduler.getAll();
            const rows = agentId ? all.filter((s) => s.agentId === agentId) : all;
            if (rows.length === 0) {
                return {
                    ok: true,
                    detail: agentId ? `no schedules for "${agentId}"` : 'no schedules yet',
                    evidence: 'schedules: 0',
                    verification: 'verified',
                };
            }
            const enabled = rows.filter((s) => s.enabled).length;
            const lines = rows.slice(0, 20).map((s) => {
                const next =
                    typeof s.nextRun === 'number'
                        ? ` | next: ${new Date(s.nextRun).toISOString()}`
                        : '';
                return `${s.name} [${s.id}] agent: ${s.agentId} | ${s.cronExpression} | ${s.enabled ? 'enabled' : 'paused'}${next}`;
            });
            return {
                ok: true,
                detail: `${rows.length} schedule(s), ${enabled} enabled`,
                evidence: lines.join(' | '),
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'invocation.run',
        group: 'coordination',
        description:
            'Run a task on an agent via the Invocation Engine. Target can be agentId, role or expertise. Confirm with the user before invoking.',
        parameters: {
            type: 'object',
            properties: {
                target: {
                    type: 'object',
                    description: '{ agentId } | { role } | { expertise: [] }',
                },
                reason: { type: 'string', description: 'Why this invocation is needed.' },
                context: {
                    type: 'object',
                    description: '{ type: "room"|"conversation"|"scheduled", ref: "..." }',
                },
            },
            required: ['target', 'reason'],
        },
        action: 'tool:exec',
        run: async (args) => {
            const inv = deps.invocation;
            if (!inv) return { ok: false, detail: 'invocation engine is not available' };
            const target = args['target'] as
                { agentId?: string; role?: string; expertise?: string[] } | undefined;
            if (!target || (!target.agentId && !target.role && !target.expertise)) {
                return { ok: false, detail: 'target must be {agentId} | {role} | {expertise}' };
            }
            const reason = typeof args['reason'] === 'string' ? args['reason'].trim() : '';
            if (!reason) return { ok: false, detail: 'reason is required' };
            try {
                const rawContext = args['context'] as { ref?: unknown } | undefined;
                const invocation = await inv.invoke({
                    source: 'human-expert-request',
                    caller: { kind: 'human', id: 'assistant' },
                    target: target as never,
                    reason,
                    context: {
                        type: 'conversation',
                        ref: String(rawContext?.ref ?? 'assistant'),
                    },
                    constraints: { mode: 'chat' },
                });
                return {
                    ok: invocation.status !== 'rejected',
                    detail: `Invocation ${invocation.id} ${invocation.status}`,
                    evidence: `status: ${invocation.status}${invocation.rejectionReason ? ` | ${invocation.rejectionReason}` : ''}`,
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `invocation failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'agents.execute-group',
        group: 'coordination',
        description:
            'Execute a group of agents (parallel/sequential/pipeline/consensus/debate). Requires an existing group id.',
        parameters: {
            type: 'object',
            properties: {
                groupId: { type: 'string', description: 'Group id from agents.list.' },
                input: { type: 'string', description: 'Input for the group.' },
            },
            required: ['groupId'],
        },
        action: 'tool:exec',
        run: async (args) => {
            const agents = deps.agentsExecute;
            if (!agents) return { ok: false, detail: 'agent execution is not available' };
            const groupId = typeof args['groupId'] === 'string' ? args['groupId'].trim() : '';
            if (!groupId) return { ok: false, detail: 'groupId is required' };
            const input = typeof args['input'] === 'string' ? args['input'] : '';
            try {
                const results = await agents.executeGroup(groupId, input);
                return {
                    ok: results.length > 0,
                    detail: `Group ${groupId}: ${results.length} step(s)`,
                    evidence: results.join(' | '),
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `execute-group failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'graph.query',
        group: 'research',
        description:
            'Query the project entity-relationship graph: list nodes, neighbors, relations of a given type, or multi-hop traversal.',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string', description: 'Project id.' },
                nodeId: { type: 'string', description: 'Start node id for neighbors/traverse.' },
                relation: {
                    type: 'string',
                    description:
                        'Filter by relation type (depends_on, supports, contradicts, ...).',
                },
                mode: {
                    type: 'string',
                    enum: ['list', 'neighbors', 'relations', 'traverse'],
                    description: 'Query mode.',
                },
                depth: { type: 'number', description: 'Traversal depth (default 2).' },
            },
            required: ['projectId', 'mode'],
        },
        action: 'tool:read',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const graph = deps.graph;
            if (!graph) return { ok: false, detail: 'project graph is not available' };
            const projectId = text(args['projectId']);
            const mode = text(args['mode']);
            if (!projectId || !mode)
                return { ok: false, detail: 'projectId and mode are required' };
            try {
                if (mode === 'list') {
                    const { nodes, edges } = await graph.listProject(projectId);
                    const summary = nodes
                        .slice(0, 30)
                        .map((n) => `[${n.kind}] ${n.label} (${n.id})`)
                        .join(' | ');
                    return {
                        ok: true,
                        detail: `Project graph: ${nodes.length} nodes, ${edges.length} edges`,
                        evidence: summary || 'empty graph',
                        verification: 'verified',
                    };
                }
                if (mode === 'relations') {
                    const relation = text(args['relation']);
                    if (!relation)
                        return { ok: false, detail: 'relation is required for mode=relations' };
                    const edges = await graph.findByRelation(projectId, relation as never);
                    const summary = edges
                        .slice(0, 30)
                        .map((e) => `${e.from} → ${e.relation} → ${e.to}`)
                        .join(' | ');
                    return {
                        ok: true,
                        detail: `${edges.length} edge(s) of relation ${relation}`,
                        evidence: summary || 'none',
                        verification: 'verified',
                    };
                }
                const nodeId = text(args['nodeId']);
                if (!nodeId)
                    return { ok: false, detail: 'nodeId is required for neighbors/traverse' };
                if (mode === 'neighbors') {
                    const nbrs = await graph.neighbors(projectId, nodeId);
                    const summary = nbrs
                        .slice(0, 30)
                        .map(
                            ({ node, edges: es }) =>
                                `[${node.kind}] ${node.label} (${es.map((x) => x.relation).join(',')})`,
                        )
                        .join(' | ');
                    return {
                        ok: true,
                        detail: `${nbrs.length} neighbor(s)`,
                        evidence: summary || 'none',
                        verification: 'verified',
                    };
                }
                if (mode === 'traverse') {
                    const depth = Number(args['depth'] ?? 2);
                    const nodes = await graph.traverse(projectId, nodeId, depth);
                    const summary = nodes.map((n) => `[${n.kind}] ${n.label}`).join(' | ');
                    return {
                        ok: true,
                        detail: `${nodes.length} node(s) reached`,
                        evidence: summary,
                        verification: 'verified',
                    };
                }
                return { ok: false, detail: `unknown mode: ${mode}` };
            } catch (e) {
                return {
                    ok: false,
                    detail: `graph query failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'projects.list',
        group: 'research',
        description: 'List projects from the Projects subsystem.',
        parameters: { type: 'object', properties: {}, required: [] },
        action: 'tool:read',
        run: async () => {
            if (!deps.projects) return { ok: false, detail: 'projects subsystem is not available' };
            try {
                const projects = await deps.projects.list();
                const summary = projects
                    .slice(0, 30)
                    .map((p) => `${p.name} [${p.id}] (${p.type}/${p.status})`)
                    .join(' | ');
                return {
                    ok: true,
                    detail: `${projects.length} project(s)`,
                    evidence: summary || 'none',
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `projects.list failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'projects.detail',
        group: 'research',
        description: 'Show a single project by id.',
        parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        action: 'tool:read',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            if (!deps.projects) return { ok: false, detail: 'projects subsystem is not available' };
            const id = text(args['id']);
            if (!id) return { ok: false, detail: 'id is required' };
            try {
                const project = await deps.projects.get(id);
                if (!project) return { ok: false, detail: `project not found: ${id}` };
                return {
                    ok: true,
                    detail: `${project.name} (${project.type}/${project.status})`,
                    evidence: project.description || 'no description',
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `projects.detail failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'forum.list',
        group: 'research',
        description: 'List forum topics.',
        parameters: {
            type: 'object',
            properties: { category: { type: 'string' }, limit: { type: 'number' } },
            required: [],
        },
        action: 'tool:read',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            if (!deps.forum) return { ok: false, detail: 'forum subsystem is not available' };
            try {
                const topics = await deps.forum.listTopics({
                    category: text(args['category']) || undefined,
                    limit: Number(args['limit'] ?? 20),
                });
                const summary = topics
                    .slice(0, 30)
                    .map((t) => `${t.title} [${t.id}] (${t.category})`)
                    .join(' | ');
                return {
                    ok: true,
                    detail: `${topics.length} topic(s)`,
                    evidence: summary || 'none',
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `forum.list failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'forum.read',
        group: 'research',
        description: 'Read a forum thread by topic id.',
        parameters: {
            type: 'object',
            properties: { topicId: { type: 'string' } },
            required: ['topicId'],
        },
        action: 'tool:read',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            if (!deps.forum) return { ok: false, detail: 'forum subsystem is not available' };
            const topicId = text(args['topicId']);
            if (!topicId) return { ok: false, detail: 'topicId is required' };
            try {
                const thread = await deps.forum.getThread(topicId);
                if (!thread) return { ok: false, detail: `topic not found: ${topicId}` };
                const body = thread.posts
                    .slice(0, 20)
                    .map((p) => p.body.slice(0, 200))
                    .join(' | ');
                return {
                    ok: true,
                    detail: thread.topic.title,
                    evidence: body || 'empty thread',
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `forum.read failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });
    actions.push({
        id: 'wiki.research',
        group: 'research',
        description:
            'Run a closed-loop research query over Wiki-Brain: search, synthesize, persist knowledge units.',
        parameters: {
            type: 'object',
            properties: { question: { type: 'string' } },
            required: ['question'],
        },
        action: 'tool:read',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            if (!deps.wikiResearch) return { ok: false, detail: 'wiki research is not available' };
            const question = text(args['question']);
            if (!question) return { ok: false, detail: 'question is required' };
            try {
                const result = await deps.wikiResearch.research(question);
                const sourceList = result.sources
                    .slice(0, 10)
                    .map((s) => `[[${s.slug}]] ${s.title}`)
                    .join(' | ');
                return {
                    ok: result.status === 'completed',
                    detail: result.summary
                        ? result.summary.slice(0, 400)
                        : `research ${result.status}`,
                    evidence: sourceList || 'no sources',
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `wiki.research failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });
    actions.push({
        id: 'graph.propose',
        group: 'research',
        description:
            'Propose a knowledge node (hypothesis) in the project graph with a confidence score.',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                kind: { type: 'string' },
                label: { type: 'string' },
                refType: { type: 'string' },
                refId: { type: 'string' },
                confidence: { type: 'number', description: '0..1' },
            },
            required: ['projectId', 'kind', 'label'],
        },
        action: 'tool:write',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const graph = deps.graphF6;
            if (!graph) return { ok: false, detail: 'project graph is not available' };
            try {
                const node = await graph.proposeNode(
                    {
                        projectId: text(args['projectId']),
                        kind: text(args['kind']),
                        label: text(args['label']),
                        refType: text(args['refType']) || undefined,
                        refId: text(args['refId']) || undefined,
                    },
                    typeof args['confidence'] === 'number' ? args['confidence'] : 0.5,
                );
                if (!node) return { ok: false, detail: 'failed to propose node' };
                return {
                    ok: true,
                    detail: `proposed ${node.id} (${node.status ?? 'proposed'})`,
                    evidence: node.id,
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `graph.propose failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'graph.potential',
        group: 'research',
        description: 'List knowledge-potential (proposed) nodes of a project with their edges.',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
        action: 'tool:read',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const graph = deps.graphF6;
            if (!graph) return { ok: false, detail: 'project graph is not available' };
            try {
                const potential = await graph.listPotential(text(args['projectId']));
                const summary = potential
                    .slice(0, 30)
                    .map((p) => `${p.node.label} [${p.node.id}]`)
                    .join(' | ');
                return {
                    ok: true,
                    detail: `${potential.length} potential node(s)`,
                    evidence: summary || 'none',
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `graph.potential failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'graph.activate',
        group: 'research',
        description: 'Promote a proposed graph node to active (validated).',
        parameters: {
            type: 'object',
            properties: { nodeId: { type: 'string' } },
            required: ['nodeId'],
        },
        action: 'tool:write',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const graph = deps.graphF6;
            if (!graph) return { ok: false, detail: 'project graph is not available' };
            try {
                const node = await graph.activateNode(text(args['nodeId']));
                if (!node) return { ok: false, detail: 'node not found' };
                return {
                    ok: true,
                    detail: `${node.id} -> ${node.status}`,
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `graph.activate failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'graph.supersede',
        group: 'research',
        description: 'Mark a graph node as superseded.',
        parameters: {
            type: 'object',
            properties: { nodeId: { type: 'string' } },
            required: ['nodeId'],
        },
        action: 'tool:write',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const graph = deps.graphF6;
            if (!graph) return { ok: false, detail: 'project graph is not available' };
            try {
                const node = await graph.supersedeNode(text(args['nodeId']));
                if (!node) return { ok: false, detail: 'node not found' };
                return {
                    ok: true,
                    detail: `${node.id} -> ${node.status}`,
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `graph.supersede failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'plan.create',
        group: 'work',
        description:
            'Create a structured execution plan from a goal (steps may be auto-decomposed).',
        parameters: {
            type: 'object',
            properties: {
                goal: { type: 'string' },
                projectId: { type: 'string' },
                steps: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            title: { type: 'string' },
                            actionId: { type: 'string' },
                        },
                    },
                },
            },
            required: ['goal'],
        },
        action: 'tool:write',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const planner = deps.planner;
            if (!planner) return { ok: false, detail: 'planner is not available' };
            try {
                const rawSteps = Array.isArray(args['steps'])
                    ? (args['steps'] as unknown[])
                    : undefined;
                const steps = rawSteps?.map((s) => {
                    const o = s as Record<string, unknown>;
                    return { title: text(o['title']), actionId: text(o['actionId']) || undefined };
                });
                const plan = await planner.createPlan(
                    text(args['goal']),
                    steps,
                    text(args['projectId']) || undefined,
                );
                const stepList = plan.steps.map((s) => `${s.order}. ${s.title}`).join(' | ');
                return {
                    ok: true,
                    detail: `plan ${plan.id} created (${plan.steps.length} steps)`,
                    evidence: stepList,
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `plan.create failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'plan.list',
        group: 'work',
        description: 'List known plans (optionally scoped by project).',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: [],
        },
        action: 'tool:read',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const planner = deps.planner;
            if (!planner) return { ok: false, detail: 'planner is not available' };
            const plans = await planner.list(text(args['projectId']) || undefined);
            const summary = plans
                .slice(0, 20)
                .map((p) => `${p.goal} [${p.id}] (${p.status})`)
                .join(' | ');
            return {
                ok: true,
                detail: `${plans.length} plan(s)`,
                evidence: summary || 'none',
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'plan.run',
        group: 'work',
        description: 'Execute all steps of a plan sequentially.',
        parameters: {
            type: 'object',
            properties: { planId: { type: 'string' } },
            required: ['planId'],
        },
        action: 'tool:write',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const planner = deps.planner;
            if (!planner) return { ok: false, detail: 'planner is not available' };
            try {
                const plan = await planner.run(text(args['planId']));
                if (!plan) return { ok: false, detail: 'plan not found' };
                const stepList = plan.steps.map((s) => `${s.title}:${s.status}`).join(' | ');
                return {
                    ok: plan.status !== 'failed',
                    detail: `plan ${plan.id} -> ${plan.status}`,
                    evidence: stepList,
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `plan.run failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'plan.pause',
        group: 'work',
        description: 'Pause a running plan.',
        parameters: {
            type: 'object',
            properties: { planId: { type: 'string' } },
            required: ['planId'],
        },
        action: 'tool:write',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const planner = deps.planner;
            if (!planner) return { ok: false, detail: 'planner is not available' };
            try {
                const paused = planner.pause(text(args['planId']));
                return {
                    ok: paused,
                    detail: paused ? 'plan paused' : 'plan not running or missing',
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `plan.pause failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'plan.step',
        group: 'work',
        description: 'Execute a single next step of a plan.',
        parameters: {
            type: 'object',
            properties: { planId: { type: 'string' } },
            required: ['planId'],
        },
        action: 'tool:write',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const planner = deps.planner;
            if (!planner) return { ok: false, detail: 'planner is not available' };
            try {
                const plan = await planner.step(text(args['planId']));
                if (!plan) return { ok: false, detail: 'plan not found' };
                const stepList = plan.steps.map((s) => `${s.title}:${s.status}`).join(' | ');
                return {
                    ok: true,
                    detail: `plan ${plan.id} -> ${plan.status}`,
                    evidence: stepList,
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `plan.step failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'observer.status',
        group: 'research',
        description:
            'Read-only system health: metrics, traces, approvals, audit integrity, scheduler health.',
        parameters: { type: 'object', properties: {}, required: [] },
        action: 'tool:read',
        run: async () => {
            const observer = deps.observer;
            if (!observer) return { ok: false, detail: 'observer is not available' };
            try {
                const status = await observer.status();
                return {
                    ok: true,
                    detail: `health: ${status.health}`,
                    evidence: status.summary,
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `observer.status failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'attachment.register',
        group: 'work',
        description: 'Store a sidecar visual attachment (base64) bound to a source entity.',
        parameters: {
            type: 'object',
            properties: {
                sourceKind: { type: 'string', enum: ['wiki', 'debate', 'task', 'project', 'note'] },
                sourceRef: { type: 'string' },
                caption: { type: 'string' },
                mimeType: { type: 'string' },
                dataB64: { type: 'string' },
                projectId: { type: 'string' },
            },
            required: ['sourceKind', 'sourceRef', 'caption', 'mimeType', 'dataB64'],
        },
        action: 'tool:write',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const attachments = deps.attachments;
            if (!attachments) return { ok: false, detail: 'attachments are not available' };
            try {
                const att = await attachments.register({
                    projectId: text(args['projectId']) || undefined,
                    sourceKind: text(args['sourceKind']),
                    sourceRef: text(args['sourceRef']),
                    caption: text(args['caption']),
                    mimeType: text(args['mimeType']),
                    dataB64: text(args['dataB64']),
                });
                return {
                    ok: true,
                    detail: `attachment ${att.id} stored`,
                    evidence: att.id,
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `attachment.register failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'attachment.list',
        group: 'research',
        description: 'List sidecar attachments (optionally by source).',
        parameters: {
            type: 'object',
            properties: {
                sourceKind: { type: 'string' },
                sourceRef: { type: 'string' },
            },
            required: [],
        },
        action: 'tool:read',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const attachments = deps.attachments;
            if (!attachments) return { ok: false, detail: 'attachments are not available' };
            try {
                const items = await attachments.list({
                    sourceKind: text(args['sourceKind']) || undefined,
                    sourceRef: text(args['sourceRef']) || undefined,
                });
                const summary = items
                    .slice(0, 30)
                    .map((a) => `${a.caption} [${a.id}] (${a.mimeType})`)
                    .join(' | ');
                return {
                    ok: true,
                    detail: `${items.length} attachment(s)`,
                    evidence: summary || 'none',
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `attachment.list failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'attachment.get',
        group: 'research',
        description: 'Get attachment metadata (use attachment.describe for vision content).',
        parameters: {
            type: 'object',
            properties: { id: { type: 'string' } },
            required: ['id'],
        },
        action: 'tool:read',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const attachments = deps.attachments;
            if (!attachments) return { ok: false, detail: 'attachments are not available' };
            try {
                const att = await attachments.get(text(args['id']));
                if (!att) return { ok: false, detail: 'attachment not found' };
                return {
                    ok: true,
                    detail: `${att.caption} (${att.mimeType})`,
                    evidence: `source=${att.sourceRef}`,
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `attachment.get failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'attachment.detach',
        group: 'work',
        description: 'Remove a sidecar attachment.',
        parameters: {
            type: 'object',
            properties: { id: { type: 'string' } },
            required: ['id'],
        },
        action: 'tool:write',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const attachments = deps.attachments;
            if (!attachments) return { ok: false, detail: 'attachments are not available' };
            try {
                const ok = await attachments.detach(text(args['id']));
                return {
                    ok,
                    detail: ok ? 'attachment removed' : 'attachment not found',
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `attachment.detach failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'attachment.describe',
        group: 'research',
        description: 'Ask the vision-capable model to describe an attachment.',
        parameters: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                prompt: { type: 'string' },
            },
            required: ['id'],
        },
        action: 'tool:read',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const vision = deps.vision;
            if (!vision) return { ok: false, detail: 'vision is not available' };
            try {
                const description = await vision.describe(
                    text(args['id']),
                    text(args['prompt']) || undefined,
                );
                return { ok: true, detail: description.slice(0, 600), verification: 'verified' };
            } catch (e) {
                return {
                    ok: false,
                    detail: `attachment.describe failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'agent.restart',
        group: 'work',
        description: 'Restart an agent (privileged; goes through approval).',
        parameters: {
            type: 'object',
            properties: { agentId: { type: 'string' } },
            required: ['agentId'],
        },
        action: 'tool:exec',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const ops = deps.ops;
            if (!ops) return { ok: false, detail: 'ops are not available' };
            try {
                const ok = await ops.restartAgent(text(args['agentId']));
                return {
                    ok,
                    detail: ok ? 'agent restarted' : 'restart failed',
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `agent.restart failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'task.retry',
        group: 'work',
        description: 'Retry a failed task (privileged; goes through approval).',
        parameters: {
            type: 'object',
            properties: { taskId: { type: 'string' } },
            required: ['taskId'],
        },
        action: 'tool:exec',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const ops = deps.ops;
            if (!ops) return { ok: false, detail: 'ops are not available' };
            try {
                const ok = await ops.retryTask(text(args['taskId']));
                return {
                    ok,
                    detail: ok ? 'task re-queued' : 'retry failed',
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `task.retry failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'profile.switch',
        group: 'work',
        description: 'Switch active settings profile (privileged; goes through approval).',
        parameters: {
            type: 'object',
            properties: { profileId: { type: 'string' } },
            required: ['profileId'],
        },
        action: 'tool:exec',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const ops = deps.ops;
            if (!ops) return { ok: false, detail: 'ops are not available' };
            try {
                const ok = ops.switchProfile(text(args['profileId']));
                return {
                    ok,
                    detail: ok ? 'profile switched' : 'profile switch failed',
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `profile.switch failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'image.generate',
        group: 'work',
        description: 'Generate an image from a prompt and store it as a sidecar attachment.',
        parameters: {
            type: 'object',
            properties: {
                prompt: { type: 'string' },
                size: { type: 'string', enum: ['256x256', '512x512', '1024x1024', '2048x2048'] },
                provider: { type: 'string' },
            },
            required: ['prompt'],
        },
        action: 'tool:write',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const images = deps.images;
            const attachments = deps.attachments;
            if (!images) return { ok: false, detail: 'image generation is not available' };
            try {
                const generated = await images.generate(text(args['prompt']), {
                    size: text(args['size']) || undefined,
                    provider: text(args['provider']) || undefined,
                });
                if (!attachments) {
                    return {
                        ok: true,
                        detail: `image generated (${generated.provider}) but attachments unavailable`,
                        evidence: generated.note,
                        verification: 'verified',
                    };
                }
                const att = await attachments.register({
                    sourceKind: 'note',
                    sourceRef: 'generated',
                    caption: text(args['prompt']).slice(0, 120),
                    mimeType: generated.mimeType,
                    dataB64: generated.dataB64,
                    width: generated.width,
                    height: generated.height,
                });
                return {
                    ok: true,
                    detail: `image generated (${generated.provider}) -> attachment ${att.id}`,
                    evidence: generated.note ?? '',
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `image.generate failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'wiki.context',
        group: 'research',
        description:
            'Retrieve bounded wiki context (Core snippets) for a question via the live context provider.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string' },
                topK: { type: 'number' },
                maxTokens: { type: 'number' },
            },
            required: ['query'],
        },
        action: 'tool:read',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const ctx = deps.wikiContext;
            if (!ctx) return { ok: false, detail: 'wiki context is not available' };
            try {
                const result = await ctx.retrieve(text(args['query']), {
                    topK: typeof args['topK'] === 'number' ? args['topK'] : 5,
                    maxTokens:
                        typeof args['maxTokens'] === 'number' ? args['maxTokens'] : undefined,
                });
                const summary = result.snippets
                    .slice(0, 10)
                    .map((s) => `[[${s.pageSlug}]] ${s.title}`)
                    .join(' | ');
                return {
                    ok: true,
                    detail: `${result.snippets.length} snippet(s), ${result.totalTokens} tokens`,
                    evidence: summary || 'none',
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `wiki.context failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'research.fetch_literature',
        group: 'research',
        description:
            'Fetch external literature (arXiv/web) and optionally ingest results as wiki sources.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string' },
                provider: { type: 'string', description: 'arxiv | web' },
                maxResults: { type: 'number' },
                ingest: { type: 'boolean' },
                projectId: { type: 'string' },
            },
            required: ['query'],
        },
        action: 'tool:read',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const lit = deps.literature;
            if (!lit) return { ok: false, detail: 'literature fetcher is not available' };
            try {
                const results = await lit.fetch(text(args['query']), {
                    provider: text(args['provider']) || undefined,
                    maxResults: typeof args['maxResults'] === 'number' ? args['maxResults'] : 5,
                });
                const total = results.reduce((a, r) => a + r.papers.length, 0);
                const summary = results
                    .flatMap((r) => r.papers)
                    .slice(0, 10)
                    .map((p) => `${p.title.slice(0, 80)} [${p.source}]`)
                    .join(' | ');
                let ingestLine = '';
                if (args['ingest'] === true && total > 0) {
                    const papers = results.flatMap((r) => r.papers);
                    const count = await lit.ingestAsSources(
                        papers,
                        text(args['projectId']) || undefined,
                    );
                    ingestLine = ` | ingested ${count}`;
                }
                return {
                    ok: true,
                    detail: `fetched ${total} paper(s)${ingestLine}`,
                    evidence: summary || 'none',
                    verification: 'verified',
                };
            } catch (e) {
                return {
                    ok: false,
                    detail: `research.fetch_literature failed: ${e instanceof Error ? e.message : String(e)}`,
                };
            }
        },
    });

    actions.push({
        id: 'topic.create',
        group: 'research',
        description: 'Create a Topic Graph topic for accumulating structured knowledge.',
        parameters: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                description: { type: 'string' },
            },
            required: ['title'],
        },
        action: 'tool:write',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const topic = deps.topicGraph;
            if (!topic) return { ok: false, detail: 'topic graph is not available' };
            try {
                const created = await topic.createTopic(text(args['title']), text(args['description']));
                return { ok: true, detail: `topic ${created.id} created`, evidence: created.title, verification: 'verified' };
            } catch (e) {
                return { ok: false, detail: `topic.create failed: ${e instanceof Error ? e.message : String(e)}` };
            }
        },
    });

    actions.push({
        id: 'topic.ingest',
        group: 'research',
        description: 'Ingest a document/model answer into a topic and process it into claims.',
        parameters: {
            type: 'object',
            properties: {
                topicId: { type: 'string' },
                title: { type: 'string' },
                content: { type: 'string' },
            },
            required: ['topicId', 'content'],
        },
        action: 'tool:write',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const topic = deps.topicGraph;
            if (!topic) return { ok: false, detail: 'topic graph is not available' };
            try {
                const run = await topic.ingest(text(args['topicId']), {
                    kind: 'document',
                    ref: text(args['title']) || `assistant-${Date.now()}`,
                    title: text(args['title']) || 'Assistant input',
                    content: text(args['content']),
                });
                return {
                    ok: run.status === 'completed',
                    detail: `ingest ${run.status}: ${run.stats.newClaims} new, ${run.stats.conflicts} conflicts`,
                    evidence: `claims=${run.stats.newClaims} conflicts=${run.stats.conflicts}`,
                    verification: 'verified',
                };
            } catch (e) {
                return { ok: false, detail: `topic.ingest failed: ${e instanceof Error ? e.message : String(e)}` };
            }
        },
    });

    actions.push({
        id: 'topic.summary',
        group: 'research',
        description: 'Get a summary of a topic: completeness, claims, conflicts, coverage.',
        parameters: {
            type: 'object',
            properties: { topicId: { type: 'string' } },
            required: ['topicId'],
        },
        action: 'tool:read',
        run: async (args) => {
            const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
            const topic = deps.topicGraph;
            if (!topic) return { ok: false, detail: 'topic graph is not available' };
            try {
                const comp = await topic.completeness(text(args['topicId']));
                return {
                    ok: true,
                    detail: `claims=${comp.totalClaims} concepts=${comp.uniqueConcepts} conflicts=${comp.conflicts} sources=${comp.sources} coverage=${Math.round(comp.coverage * 100)}%`,
                    verification: 'verified',
                };
            } catch (e) {
                return { ok: false, detail: `topic.summary failed: ${e instanceof Error ? e.message : String(e)}` };
            }
        },
    });

    return actions;
}
