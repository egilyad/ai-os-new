/**
 * The assistant's actions — the operations it may perform on SuperAgents OS.
 *
 * Rules that shape this file:
 *  - every action returns a verifiable result: what was observed, so the
 *    assistant can state facts instead of intentions;
 *  - an action never throws — a failure is a result the model can react to;
 *  - the permission class is declared per action, and the waterfall checks it
 *    (read = free, write/exec/net/mcp = ask the human).
 *
 * The action set grows by adding entries here — the registry, the tool
 * schemas and the assistant prompt pick them up automatically.
 */
import type {
    AssistantAction,
    AssistantActionResult,
} from '../../contracts/assistant';
import type { ProjectKnowledgeService } from './project-knowledge-service';
import type { AssistantNavigationService } from './assistant-navigation-service';

/** Structural shapes of the services the actions use (kept minimal). */
export interface AssistantActionDeps {
    knowledge: ProjectKnowledgeService;
    navigation: AssistantNavigationService;
    agents?: {
        getAgents(): Array<{ id: string; name: string; role: string; status: string }>;
        spawnAgent(name: string, roleId?: string, config?: Record<string, unknown>): unknown;
        activate(id: string): void;
        pause(id: string): void;
        getLifecycleState(id: string): string;
    };
    keys?: {
        getKeys(): Array<{ id: string; provider: string; status: string }>;
        checkHealth(keyId?: string): Promise<{ id: string; status: string; latency?: number }>;
    };
    tools?: {
        getTools(): Array<{ id: string; name: string; description: string; enabled?: boolean }>;
    };
    mcp?: {
        listServers(): Promise<Array<{ id: string; name: string; status: string; tools?: string[] }>>;
    };
    skills?: {
        getSkills(): Array<{ id?: string; name: string; description?: string; status?: string }>;
    };
    /** The trust ledger — what is declared, discovered and verified. */
    trust?: {
        list(): Array<{
            id: string;
            kind: string;
            title: string;
            trust: string;
            evidence: string[];
            stale: boolean;
        }>;
        stats(): { total: number; declared: number; discovered: number; verified: number; stale: number };
    };
    /** The self-check gate. */
    exam?: {
        examine(
            capabilityId: string,
            probeArgs?: Record<string, unknown>,
        ): Promise<{
            capabilityId: string;
            passed: boolean;
            level: string;
            evidence: string[];
            reason: string;
            nextStep: string;
        }>;
    };
    /** Routing a symptom to the layer that owns it. */
    diagnosis?: {
        diagnose(symptom: string): {
            layer: string;
            reasons: string[];
            checks: Array<{
                action: string;
                question: string;
                args?: Record<string, unknown>;
            }>;
            fallbackLayers: string[];
        };
    };
    /** "How do I do this here?" — an ordered plan with real routes. */
    guide?: {
        plan(goal: string): {
            goal: string;
            steps: Array<{
                order: number;
                kind: string;
                action?: string;
                args?: Record<string, unknown>;
                route?: string;
                title: string;
                detail: string;
            }>;
            note: string;
        };
    };
    /** The assistant's own experience log. */
    diary?: {
        write(input: {
            kind: string;
            text: string;
            evidence?: string;
            outcome?: string;
            tags?: string[];
        }): Promise<{ id: string }>;
        recent(limit?: number): Array<{
            id: string;
            kind: string;
            text: string;
            evidence?: string;
            timestamp: number;
        }>;
        search(query: string, limit?: number): Array<{
            id: string;
            kind: string;
            text: string;
            evidence?: string;
            timestamp: number;
        }>;
    };
    memory?: {
        recall(
            context: string,
            limit?: number,
        ): Promise<Array<{ id: string; content: string; metadata: { type?: string } }>>;
        store(entry: { content: string; metadata: Record<string, unknown> }): Promise<string>;
    };
    scheduler?: {
        getAll(): Array<{ id: string; name?: string; enabled?: boolean; cron?: string }>;
    };
    tasks?: {
        list(): Array<{ id: string; title?: string; status?: string }>;
    };
    debates?: {
        startDebate(
            topic: string,
            participants: Array<{ id: string; name: string; role: 'pro' }>,
            strategy?: string,
            maxRounds?: number,
        ): Promise<{ id: string; status?: string }>;
    };
}

function str(v: unknown, fallback = ''): string {
    return typeof v === 'string' ? v : fallback;
}

function num(v: unknown, fallback: number): number {
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function ok(detail: string, evidence?: string): AssistantActionResult {
    return { ok: true, detail, evidence, verification: 'verified' };
}

function fail(detail: string): AssistantActionResult {
    return { ok: false, detail, verification: 'discovered' };
}

/** UI-owned capabilities (keys, MCP, skills, scheduler, tasks). */
export interface AssistantUiActionDeps {
    keys?: AssistantActionDeps['keys'];
    mcp?: AssistantActionDeps['mcp'];
    skills?: AssistantActionDeps['skills'];
    scheduler?: AssistantActionDeps['scheduler'];
    tasks?: AssistantActionDeps['tasks'];
}

function uiWorkActions(deps: AssistantUiActionDeps): AssistantAction[] {
    const actions: AssistantAction[] = [];

    actions.push({
        id: 'keys.list',
        group: 'work',
        description: 'List the API keys with their provider and status.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            const keys = deps.keys?.getKeys() ?? [];
            if (keys.length === 0) return fail('No API keys configured');
            return ok(
                `${keys.length} key(s)`,
                keys.map((k) => `${k.id} (${k.provider}, ${k.status})`).join(' | '),
            );
        },
    });

    actions.push({
        id: 'keys.health',
        group: 'work',
        description: 'Check the health of one API key (or of the first available key).',
        parameters: {
            type: 'object',
            properties: { keyId: { type: 'string' } },
        },
        action: 'tool:read',
        run: async (args) => {
            if (!deps.keys) return fail('key service is not available');
            const keyId = str(args['keyId']) || undefined;
            const health = await deps.keys.checkHealth(keyId);
            return ok(
                `Key ${health.id}: ${health.status}`,
                `latency: ${health.latency ?? 0}ms`,
            );
        },
    });

    actions.push({
        id: 'mcp.list',
        group: 'work',
        description: 'List the connected MCP servers and their tools.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            if (!deps.mcp) return fail('MCP service is not available');
            const servers = await deps.mcp.listServers();
            if (servers.length === 0) return fail('No MCP servers configured');
            return ok(
                `${servers.length} MCP server(s)`,
                servers
                    .map(
                        (s) =>
                            `${s.name} (${s.status})${s.tools?.length ? `: ${s.tools.join(', ')}` : ''}`,
                    )
                    .join(' | '),
            );
        },
    });

    actions.push({
        id: 'skills.list',
        group: 'work',
        description: 'List the installed skills (procedures the agents can follow).',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            const skills = deps.skills?.getSkills() ?? [];
            if (skills.length === 0) return fail('No skills installed');
            return ok(
                `${skills.length} skill(s)`,
                skills.map((s) => s.name).join(' | '),
            );
        },
    });

    return actions;
}

function uiCoordinationActions(deps: AssistantUiActionDeps): AssistantAction[] {
    const actions: AssistantAction[] = [];

    actions.push({
        id: 'scheduler.list',
        group: 'coordination',
        description: 'List the scheduled jobs of the system.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            if (!deps.scheduler) return fail('scheduler service is not available');
            const jobs = deps.scheduler.getAll();
            if (jobs.length === 0) return fail('No scheduled jobs');
            return ok(
                `${jobs.length} job(s)`,
                jobs.map((j) => `${j.name ?? j.id}${j.enabled === false ? ' (off)' : ''}`).join(' | '),
            );
        },
    });

    actions.push({
        id: 'tasks.list',
        group: 'coordination',
        description: 'List the tasks of the system with their status.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            if (!deps.tasks) return fail('task service is not available');
            const tasks = deps.tasks.list();
            if (tasks.length === 0) return fail('No tasks');
            return ok(
                `${tasks.length} task(s)`,
                tasks.map((t) => `${t.title ?? t.id} (${t.status ?? 'unknown'})`).join(' | '),
            );
        },
    });

    return actions;
}

/** Actions that only the UI composition root can provide. */
export function createAssistantUiActions(deps: AssistantUiActionDeps): AssistantAction[] {
    return [...uiWorkActions(deps), ...uiCoordinationActions(deps)];
}

/** The first tranche of actions. */
export function createAssistantActions(deps: AssistantActionDeps): AssistantAction[] {
    const actions: AssistantAction[] = [];

    // ---------------------------------------------------------------- research

    actions.push({
        id: 'system.find',
        group: 'research',
        description:
            'Find parts of SuperAgents OS: panels, their routes and the wiki articles that document them. Use it when the user asks "where is X" or "what is X".',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'What to look for (Russian or English).' },
                limit: { type: 'number', description: 'Maximum hits (default 8).' },
            },
            required: ['query'],
        },
        action: 'tool:read',
        run: async (args) => {
            const query = str(args['query']);
            if (!query) return fail('query is required');
            const hits = await deps.knowledge.search(query, num(args['limit'], 8));
            if (hits.length === 0) return fail(`Nothing found for "${query}"`);
            const lines = hits.map(
                (h) =>
                    h.kind === 'article'
                        ? `article ${h.id} — ${h.title}${h.snippet ? ` (${h.snippet})` : ''}`
                        : `panel ${h.id} — ${h.route}`,
            );
            return ok(`${hits.length} hit(s) for "${query}"`, lines.join(' | '));
        },
    });

    actions.push({
        id: 'system.describe',
        group: 'research',
        description:
            'Describe one component of SuperAgents OS: the route, the implementing file, the tests that cover it and the article that documents it.',
        parameters: {
            type: 'object',
            properties: {
                panelId: { type: 'string', description: 'Panel id (e.g. "agents", "memory").' },
            },
            required: ['panelId'],
        },
        action: 'tool:read',
        run: async (args) => {
            const panelId = str(args['panelId']);
            const chain = deps.knowledge.connections(panelId);
            if (!chain) return fail(`Unknown panel: ${panelId}`);
            const article = chain.article ? deps.knowledge.article(chain.article) : null;
            const evidence = [
                `route: ${chain.route}`,
                `component: ${chain.component ?? 'unknown'}`,
                `tests: ${chain.tests.length ? chain.tests.join(', ') : 'none'}`,
                article ? `article: ${article.slug} (${article.freshness ?? 'unknown'})` : 'article: none',
            ].join(' | ');
            return ok(`${panelId}: ${chain.component ?? chain.route}`, evidence);
        },
    });

    actions.push({
        id: 'system.capabilities',
        group: 'research',
        description:
            'List what the system can do and how much that is trusted: declared (documented), discovered (found in the code), verified (actually executed and observed).',
        parameters: {
            type: 'object',
            properties: {
                trust: {
                    type: 'string',
                    enum: ['declared', 'discovered', 'verified'],
                    description: 'Filter by trust level (optional).',
                },
                limit: { type: 'number', description: 'Maximum rows (default 20).' },
            },
        },
        action: 'tool:read',
        run: async (args) => {
            if (!deps.trust) return fail('capability trust ledger is not available');
            const level = str(args['trust']);
            const all = deps.trust.list();
            const filtered = level ? all.filter((c) => c.trust === level) : all;
            const limit = num(args['limit'], 20);
            const stats = deps.trust.stats();
            if (filtered.length === 0) {
                return ok(
                    `no capabilities at level "${level || 'any'}"`,
                    `ledger: ${stats.total} total, ${stats.verified} verified`,
                );
            }
            return ok(
                `${filtered.length} capability/capabilities (verified ${stats.verified}, discovered ${stats.discovered}, declared ${stats.declared})`,
                filtered
                    .slice(0, limit)
                    .map((c) => `${c.id} [${c.trust}]${c.stale ? ' (stale)' : ''}`)
                    .join(' | '),
            );
        },
    });

    actions.push({
        id: 'system.howto',
        group: 'research',
        description:
            'Turn a goal into an ordered plan with real routes: which panels to open, in what order, and how to check the result.',
        parameters: {
            type: 'object',
            properties: {
                goal: { type: 'string', description: 'What the operator wants to achieve.' },
            },
            required: ['goal'],
        },
        action: 'tool:read',
        run: async (args) => {
            if (!deps.guide) return fail('guide service is not available');
            const goal = str(args['goal']).trim();
            if (!goal) return fail('goal is required');
            const plan = deps.guide.plan(goal);
            if (plan.steps.length === 0) return fail(plan.note);
            return ok(
                `${plan.steps.length} step(s) for "${plan.goal}"`,
                plan.steps
                    .map((s) => `${s.order}. ${s.title}${s.route ? ` → ${s.route}` : ''} (${s.detail})`)
                    .join(' | '),
            );
        },
    });

    actions.push({
        id: 'system.diagnose',
        group: 'research',
        description:
            'Route a symptom to the layer that owns it (A documentation, B structure, C memory, D live state) and get the checks to run there.',
        parameters: {
            type: 'object',
            properties: {
                symptom: {
                    type: 'string',
                    description: 'What the user reported, in their own words.',
                },
            },
            required: ['symptom'],
        },
        action: 'tool:read',
        run: async (args) => {
            if (!deps.diagnosis) return fail('diagnosis service is not available');
            const symptom = str(args['symptom']).trim();
            if (!symptom) return fail('symptom is required');
            const plan = deps.diagnosis.diagnose(symptom);
            return ok(
                `Layer ${plan.layer}`,
                [
                    `reasons: ${plan.reasons.join('; ')}`,
                    `checks: ${plan.checks.map((c) => `${c.action} — ${c.question}`).join(' | ')}`,
                    `fallback layers: ${plan.fallbackLayers.join(', ')}`,
                ].join(' | '),
            );
        },
    });

    actions.push({
        id: 'system.exam',
        group: 'research',
        description:
            'Examine a capability before claiming it works. Runs a safe probe when possible and reports whether the claim is allowed.',
        parameters: {
            type: 'object',
            properties: {
                capability: {
                    type: 'string',
                    description: 'Capability id: "action:ui.openPanel" or "ui.openPanel".',
                },
                probeArgs: {
                    type: 'object',
                    description: 'Arguments for the probe, when the capability needs them.',
                },
            },
            required: ['capability'],
        },
        action: 'tool:read',
        run: async (args) => {
            if (!deps.exam) return fail('exam service is not available');
            const capability = str(args['capability']);
            if (!capability) return fail('capability is required');
            const probeArgs =
                args['probeArgs'] && typeof args['probeArgs'] === 'object'
                    ? (args['probeArgs'] as Record<string, unknown>)
                    : {};
            const verdict = await deps.exam.examine(capability, probeArgs);
            return ok(
                verdict.passed
                    ? `Exam passed (${verdict.level})`
                    : `Exam not passed (${verdict.level})`,
                [
                    verdict.reason,
                    verdict.evidence.length ? `evidence: ${verdict.evidence.join('; ')}` : '',
                    verdict.nextStep ? `next: ${verdict.nextStep}` : '',
                ]
                    .filter(Boolean)
                    .join(' | '),
            );
        },
    });

    actions.push({
        id: 'diary.write',
        group: 'work',
        description:
            'Record an experience in the assistant diary: what was decided, what was learned, what went wrong.',
        parameters: {
            type: 'object',
            properties: {
                kind: {
                    type: 'string',
                    enum: ['decision', 'lesson', 'mistake', 'question', 'action'],
                },
                text: { type: 'string', description: 'One sentence about what happened.' },
                evidence: { type: 'string', description: 'What was actually observed.' },
            },
            required: ['kind', 'text'],
        },
        action: 'tool:write',
        run: async (args) => {
            if (!deps.diary) return fail('diary service is not available');
            const text = str(args['text']).trim();
            if (!text) return fail('text is required');
            const kind = str(args['kind'], 'lesson');
            const entry = await deps.diary.write({
                kind: kind as 'decision' | 'lesson' | 'mistake' | 'question' | 'action',
                text,
                evidence: str(args['evidence']) || undefined,
            });
            return ok('Recorded in the diary', `diaryId: ${entry.id}`);
        },
    });

    actions.push({
        id: 'diary.recent',
        group: 'research',
        description: 'Read the recent entries of the assistant diary.',
        parameters: {
            type: 'object',
            properties: {
                limit: { type: 'number', description: 'Maximum entries (default 10).' },
                query: { type: 'string', description: 'Search the diary instead of listing it.' },
            },
        },
        action: 'tool:read',
        run: async (args) => {
            if (!deps.diary) return fail('diary service is not available');
            const limit = num(args['limit'], 10);
            const query = str(args['query']);
            const entries = query ? deps.diary.search(query, limit) : deps.diary.recent(limit);
            if (entries.length === 0) return fail('The diary is empty');
            return ok(
                `${entries.length} diary entry/entries`,
                entries
                    .map((e) => `(${e.kind}) ${e.text}${e.evidence ? ` — ${e.evidence}` : ''}`)
                    .join(' | '),
            );
        },
    });

    actions.push({
        id: 'memory.search',
        group: 'research',
        description:
            'Search the long-term memory of the system (decisions, lessons, earlier research, user facts).',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string' },
                limit: { type: 'number', description: 'Maximum hits (default 5).' },
            },
            required: ['query'],
        },
        action: 'tool:memory',
        run: async (args) => {
            const query = str(args['query']);
            if (!query) return fail('query is required');
            if (!deps.memory) return fail('memory service is not available');
            const hits = await deps.memory.recall(query, num(args['limit'], 5));
            if (hits.length === 0) return fail(`No memory hits for "${query}"`);
            return ok(
                `${hits.length} memory hit(s)`,
                hits
                    .map((h) => `${h.metadata.type ?? 'memory'}: ${h.content.slice(0, 160)}`)
                    .join(' | '),
            );
        },
    });

    // -------------------------------------------------------------- navigation

    actions.push({
        id: 'ui.openPanel',
        group: 'navigation',
        description:
            'Open a panel of the application for the user. Returns whether the interface confirmed the navigation — never claim it opened if it did not confirm.',
        parameters: {
            type: 'object',
            properties: {
                panelId: {
                    type: 'string',
                    description: 'Panel id (e.g. "agents") or a route ("/memory").',
                },
                reason: { type: 'string', description: 'Why you open it (shown to the user).' },
            },
            required: ['panelId'],
        },
        // Navigation has no persistent side effect — the user asked for it.
        action: 'tool:read',
        run: async (args) => {
            const target = str(args['panelId']);
            const route = target.startsWith('/')
                ? target
                : (deps.knowledge.panel(target)?.route ?? `/${target}`);
            const confirmed = await deps.navigation.open(
                route,
                str(args['reason'], 'Открываю панель по просьбе'),
            );
            return confirmed
                ? ok(`Panel ${route} is open`, `route: ${route}`)
                : fail(`Navigation to ${route} was not confirmed by the interface`);
        },
    });

    // ------------------------------------------------------------------- work

    actions.push({
        id: 'agents.list',
        group: 'work',
        description: 'List the agents of the active topology with their state.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            const agents = deps.agents?.getAgents() ?? [];
            if (agents.length === 0) return fail('No agents in the active topology');
            return ok(
                `${agents.length} agent(s)`,
                agents.map((a) => `${a.id} (${a.role}, ${a.status})`).join(' | '),
            );
        },
    });

    actions.push({
        id: 'agents.spawn',
        group: 'work',
        description:
            'Create a new agent in the active topology. Use it when the user asks for a new specialist.',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                roleId: { type: 'string', description: 'Existing role id (optional).' },
                prompt: { type: 'string', description: 'System prompt of the agent.' },
                toolProfile: {
                    type: 'string',
                    description: 'Tool profile: minimal | research | coding | full.',
                },
            },
            required: ['name'],
        },
        action: 'tool:write',
        run: async (args) => {
            if (!deps.agents) return fail('agent service is not available');
            const name = str(args['name']);
            if (!name) return fail('name is required');
            const config: Record<string, unknown> = {};
            if (str(args['prompt'])) config['prompt'] = str(args['prompt']);
            if (str(args['toolProfile'])) config['toolProfile'] = str(args['toolProfile']);
            const agent = deps.agents.spawnAgent(name, str(args['roleId']) || undefined, config);
            const id =
                typeof agent === 'string'
                    ? agent
                    : ((agent as { id?: string } | null)?.id ?? 'unknown');
            return ok(`Agent "${name}" created`, `agentId: ${id}`);
        },
    });

    actions.push({
        id: 'agents.setState',
        group: 'work',
        description: 'Pause, resume or activate an existing agent.',
        parameters: {
            type: 'object',
            properties: {
                agentId: { type: 'string' },
                state: { type: 'string', enum: ['active', 'paused'] },
            },
            required: ['agentId', 'state'],
        },
        action: 'tool:write',
        run: async (args) => {
            if (!deps.agents) return fail('agent service is not available');
            const agentId = str(args['agentId']);
            const state = str(args['state']);
            if (!agentId) return fail('agentId is required');
            if (state === 'active') deps.agents.activate(agentId);
            else if (state === 'paused') deps.agents.pause(agentId);
            else return fail(`Unknown state: ${state}`);
            return ok(
                `Agent ${agentId} → ${state}`,
                `lifecycle: ${deps.agents.getLifecycleState(agentId)}`,
            );
        },
    });

    actions.push({
        id: 'tools.list',
        group: 'work',
        description: 'List the tools available in the tool catalogue.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            const tools = deps.tools?.getTools() ?? [];
            if (tools.length === 0) return fail('The tool catalogue is empty');
            return ok(
                `${tools.length} tool(s)`,
                tools.map((t) => `${t.id}${t.enabled === false ? ' (off)' : ''}`).join(' | '),
            );
        },
    });

    actions.push({
        id: 'memory.remember',
        group: 'work',
        description:
            'Store a durable fact about the project or the user in the long-term memory, so later sessions can recall it.',
        parameters: {
            type: 'object',
            properties: {
                content: { type: 'string', description: 'The fact, in one short sentence.' },
                type: { type: 'string', description: 'Type: decision | lesson | context | issue.' },
            },
            required: ['content'],
        },
        action: 'tool:write',
        run: async (args) => {
            if (!deps.memory) return fail('memory service is not available');
            const content = str(args['content']).trim();
            if (!content) return fail('content is required');
            const id = await deps.memory.store({
                content,
                metadata: {
                    source: 'assistant',
                    type: str(args['type'], 'note'),
                    timestamp: Date.now(),
                    importance: 0.6,
                },
            });
            return ok('Fact stored in the long-term memory', `memoryId: ${id}`);
        },
    });

    // ----------------------------------------------------------- coordination

    actions.push({
        id: 'debate.start',
        group: 'coordination',
        description:
            'Start a multi-agent debate on a topic and get the session id back.',
        parameters: {
            type: 'object',
            properties: {
                topic: { type: 'string' },
                participants: { type: 'array', items: { type: 'string' } },
                maxRounds: { type: 'number' },
            },
            required: ['topic', 'participants'],
        },
        action: 'tool:exec',
        run: async (args) => {
            if (!deps.debates) return fail('debate service is not available');
            const topic = str(args['topic']);
            const ids = Array.isArray(args['participants'])
                ? (args['participants'] as unknown[]).map((p) => String(p))
                : [];
            if (!topic) return fail('topic is required');
            if (ids.length < 2) return fail('at least two participants are required');
            const session = await deps.debates.startDebate(
                topic,
                ids.map((id) => ({ id, name: id, role: 'pro' as const })),
                'round_robin',
                num(args['maxRounds'], 5),
            );
            return ok(`Debate started: ${topic}`, `sessionId: ${session.id}`);
        },
    });



    return actions;
}