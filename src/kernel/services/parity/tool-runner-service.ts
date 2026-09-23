/**
 * ToolRunnerService — GAP E.2 (real execution, agentic loop, no eval).
 *
 * Built-in tools: workspace.list/read/search (via Workspace delegate),
 * http.fetch (SSRF-guarded, best-effort), time.now, math.calc (safe parser),
 * knowledge.search (via Knowledge delegate), mcp.call (via MCPService),
 * debate.start/debate.verdict/debate.status (via DebateSyncManager).
 * Every call is policy-gated through ToolGovernance when wired.
 * `runWithTools()` implements the LLM → toolCalls → execute → LLM loop.
 */
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService, AdapterMessage } from '../../contracts/provider-adapter';
import type { IToolGovernanceService } from '../../contracts/ops';
import type { IWorkspaceService } from '../../contracts/workspace';
import type { MCPService } from '../mcp-service';
import type { DebateSyncManager } from '../debate-runtime/debate-sync-manager';
import type { IToolRunnerService, ToolRunResult } from '../../contracts/parity';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('ToolRunner');

function now(): number {
    return Date.now();
}

interface ToolDef {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    run: (args: Record<string, unknown>) => Promise<string>;
}

/** Safe arithmetic: numbers, + - * / ( ) and whitespace only. */
function safeCalc(expr: string): number {
    if (!/^[0-9+\-*/().\s]+$/.test(expr)) throw new Error('Invalid characters in expression');
    const tokens = expr.match(/(\d+\.?\d*|[+\-*/()])/g);
    if (!tokens || tokens.join('').replace(/\s/g, '') !== expr.replace(/\s/g, '')) {
        throw new Error('Unparseable expression');
    }
    let pos = 0;
    const peek = (): string | undefined => tokens[pos];
    const next = (): string => tokens[pos++] as string;
    function parseExpr(): number {
        let v = parseTerm();
        for (;;) {
            const t = peek();
            if (t === '+' || t === '-') {
                next();
                const r = parseTerm();
                v = t === '+' ? v + r : v - r;
            } else return v;
        }
    }
    function parseTerm(): number {
        let v = parseFactor();
        for (;;) {
            const t = peek();
            if (t === '*' || t === '/') {
                next();
                const r = parseFactor();
                v = t === '*' ? v * r : v / r;
            } else return v;
        }
    }
    function parseFactor(): number {
        const t = next();
        if (t === '(') {
            const v = parseExpr();
            if (next() !== ')') throw new Error('Mismatched parenthesis');
            return v;
        }
        if (t === '-') return -parseFactor();
        const n = Number(t);
        if (!Number.isFinite(n)) throw new Error(`Bad number: ${t}`);
        return n;
    }
    const result = parseExpr();
    if (pos !== tokens.length) throw new Error('Trailing tokens');
    if (!Number.isFinite(result)) throw new Error('Non-finite result');
    return result;
}

function httpGuard(url: string): void {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error('Invalid URL');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Only http(s) URLs are allowed');
    }
    const host = parsed.hostname.toLowerCase();
    if (
        host === 'localhost' ||
        host.endsWith('.local') ||
        /^127\./.test(host) ||
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
        host === '0.0.0.0'
    ) {
        throw new Error('Private/local hosts are blocked');
    }
}

export interface ToolRunnerDeps {
    events: IEventBus;
    llm: ILLMClientService;
    governance?: IToolGovernanceService;
    workspace?: IWorkspaceService;
    mcp?: MCPService;
    debate?: DebateSyncManager;
    knowledge?: { retrieve(query: string, limit?: number): Promise<Array<{ title: string; chunk: string }>> };
}

export class ToolRunnerService implements IToolRunnerService {
    private deps: ToolRunnerDeps;
    private tools = new Map<string, ToolDef>();

    constructor(deps: ToolRunnerDeps) {
        this.deps = deps;
        this.registerBuiltin();
    }

    async init(): Promise<void> {
        LOGGER.info('ToolRunner', 'init', {});
    }

    async destroy(): Promise<void> {
        this.tools.clear();
    }

    listTools(): Array<{ name: string; description: string }> {
        return [...this.tools.values()].map((t) => ({ name: t.name, description: t.description }));
    }

    /** F.2 — external packs (Letta memory tools, toolkits) register here. */
    addTool(def: {
        name: string;
        description: string;
        parameters?: Record<string, unknown>;
        run: (args: Record<string, unknown>) => Promise<string>;
    }): void {
        this.tools.set(def.name, {
            name: def.name,
            description: def.description,
            parameters: def.parameters ?? { type: 'object', properties: {} },
            run: def.run,
        });
    }

    async callTool(agentId: string, name: string, args: Record<string, unknown> = {}): Promise<string> {
        const tool = this.tools.get(name);
        if (!tool) throw new Error(`Unknown tool: ${name}`);
        if (this.deps.governance) {
            const allowed = await this.deps.governance.check(agentId, `tool:${name}`);
            if (!allowed) throw new Error(`Tool ${name} denied for ${agentId} by policy`);
        }
        const started = now();
        try {
            const out = (await tool.run(args)).slice(0, 8000);
            this.deps.events.emit(EVENTS.TOOL_EXECUTED, {
                agentId,
                tool: name,
                ok: true,
                latencyMs: now() - started,
            });
            return out;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.deps.events.emit(EVENTS.TOOL_EXECUTED, {
                agentId,
                tool: name,
                ok: false,
                latencyMs: now() - started,
            });
            throw new Error(`Tool ${name} failed: ${msg}`);
        }
    }

    async runWithTools(
        prompt: string,
        opts: { agentId?: string; system?: string; maxRounds?: number; model?: string } = {},
    ): Promise<ToolRunResult> {
        const agentId = opts.agentId ?? 'tool-runner';
        const messages: AdapterMessage[] = [
            {
                role: 'system',
                content: (opts.system ?? 'You are a capable assistant. Use tools when they help. Answer concisely.').slice(0, 4000),
            },
            { role: 'user', content: prompt.slice(0, 12000) },
        ];
        const toolDefs = [...this.tools.values()].map((t) => ({
            type: 'function',
            function: { name: t.name, description: t.description, parameters: t.parameters },
        }));
        const used: string[] = [];
        const maxRounds = Math.max(1, Math.min(5, opts.maxRounds ?? 3));
        let output = '';
        for (let round = 0; round < maxRounds; round++) {
            const res = await this.deps.llm.chat(messages, {
                model: opts.model,
                temperature: 0.3,
                maxTokens: 1024,
                tools: toolDefs,
                cacheScope: { agentId },
            });
            if (res.error) throw new Error(`LLM error: ${res.error}`);
            const calls = res.toolCalls ?? [];
            if (calls.length === 0) {
                output = res.content;
                break;
            }
            output = res.content;
            messages.push({
                role: 'assistant',
                content: res.content,
                toolCalls: calls.map((c) => ({ id: c.id, type: 'function' as const, function: c.function })),
            });
            for (const call of calls) {
                let args: Record<string, unknown> = {};
                try {
                    args = JSON.parse(call.function.arguments || '{}') as Record<string, unknown>;
                } catch {
                    args = {};
                }
                let result: string;
                try {
                    result = await this.callTool(agentId, call.function.name, args);
                } catch (e) {
                    result = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
                }
                used.push(call.function.name);
                messages.push({ role: 'tool', content: result.slice(0, 6000), toolCallId: call.id });
            }
        }
        return { output, toolCalls: used, rounds: used.length };
    }

    private registerBuiltin(): void {
        const str = (v: unknown, fallback = ''): string =>
            typeof v === 'string' ? v : fallback;

        this.tools.set('workspace.list', {
            name: 'workspace.list',
            description: 'List files in the attached workspace directory.',
            parameters: { type: 'object', properties: { dir: { type: 'string' } } },
            run: async (args) => {
                if (!this.deps.workspace?.isAttached()) return 'No workspace attached.';
                const tree = await this.deps.workspace.listTree(str(args['dir']) || undefined);
                return JSON.stringify(tree.slice(0, 100)).slice(0, 6000);
            },
        });

        this.tools.set('workspace.read', {
            name: 'workspace.read',
            description: 'Read a file from the attached workspace.',
            parameters: {
                type: 'object',
                properties: { path: { type: 'string' } },
                required: ['path'],
            },
            run: async (args) => {
                if (!this.deps.workspace?.isAttached()) return 'No workspace attached.';
                return (await this.deps.workspace.readFile(str(args['path']))).slice(0, 6000);
            },
        });

        this.tools.set('workspace.search', {
            name: 'workspace.search',
            description: 'Search file contents in the attached workspace.',
            parameters: {
                type: 'object',
                properties: { pattern: { type: 'string' } },
                required: ['pattern'],
            },
            run: async (args) => {
                if (!this.deps.workspace?.isAttached()) return 'No workspace attached.';
                const hits = await this.deps.workspace.grepContent(str(args['pattern']));
                return JSON.stringify(hits.slice(0, 30)).slice(0, 6000);
            },
        });

        this.tools.set('http.fetch', {
            name: 'http.fetch',
            description: 'Fetch a public http(s) URL and return text (private hosts blocked).',
            parameters: {
                type: 'object',
                properties: { url: { type: 'string' } },
                required: ['url'],
            },
            run: async (args) => {
                const url = str(args['url']);
                httpGuard(url);
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 15000);
                try {
                    const res = await fetch(url, { signal: ctrl.signal });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return (await res.text()).slice(0, 6000);
                } finally {
                    clearTimeout(timer);
                }
            },
        });

        this.tools.set('time.now', {
            name: 'time.now',
            description: 'Current date/time as ISO string.',
            parameters: { type: 'object', properties: {} },
            run: async () => new Date().toISOString(),
        });

        this.tools.set('math.calc', {
            name: 'math.calc',
            description: 'Evaluate a plain arithmetic expression (+-*/ and parentheses).',
            parameters: {
                type: 'object',
                properties: { expression: { type: 'string' } },
                required: ['expression'],
            },
            run: async (args) => String(safeCalc(str(args['expression']))),
        });

        this.tools.set('knowledge.search', {
            name: 'knowledge.search',
            description: 'Search the local knowledge sources (RAG).',
            parameters: {
                type: 'object',
                properties: { query: { type: 'string' } },
                required: ['query'],
            },
            run: async (args) => {
                if (!this.deps.knowledge) return 'No knowledge base configured.';
                const hits = await this.deps.knowledge.retrieve(str(args['query']), 5);
                if (hits.length === 0) return 'No relevant knowledge found.';
                return hits.map((h) => `[${h.title}] ${h.chunk}`).join('\n---\n').slice(0, 6000);
            },
        });

        this.tools.set('mcp.call', {
            name: 'mcp.call',
            description: 'Call a tool on a connected MCP server (serverId + tool + args).',
            parameters: {
                type: 'object',
                properties: {
                    serverId: { type: 'string' },
                    tool: { type: 'string' },
                    args: { type: 'object' },
                },
                required: ['serverId', 'tool'],
            },
            run: async (args) => {
                if (!this.deps.mcp) throw new Error('MCP bridge not configured');
                const out = await this.deps.mcp.callTool(
                    str(args['serverId']),
                    str(args['tool']),
                    (args['args'] ?? {}) as Record<string, unknown>,
                );
                return JSON.stringify(out).slice(0, 6000);
            },
        });

        this.tools.set('debate.start', {
            name: 'debate.start',
            description: 'Start a multi-agent debate on a topic. Returns the session ID. Agents argue pro/con and a verdict is generated.',
            parameters: {
                type: 'object',
                properties: {
                    topic: { type: 'string', description: 'The debate topic or question' },
                    participants: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Agent IDs to participate (min 2)',
                    },
                    strategy: {
                        type: 'string',
                        enum: ['round_robin', 'sequential', 'judge', 'tree-of-thought', 'red-blue', 'free_for_all'],
                        description: 'Debate strategy (default: round_robin)',
                    },
                    maxRounds: { type: 'number', description: 'Maximum rounds (default: 5)' },
                },
                required: ['topic', 'participants'],
            },
            run: async (args) => {
                if (!this.deps.debate) throw new Error('Debate service not configured');
                const topic = str(args['topic']);
                const participantIds = args['participants'] as string[];
                if (!topic) throw new Error('topic is required');
                if (!Array.isArray(participantIds) || participantIds.length < 2) {
                    throw new Error('At least 2 participants required');
                }
                const strategy = (str(args['strategy']) || 'round_robin') as Parameters<DebateSyncManager['startDebate']>[2];
                const maxRounds = typeof args['maxRounds'] === 'number' ? args['maxRounds'] : 5;
                const participants = participantIds.map((id) => ({
                    id,
                    name: id,
                    role: 'pro' as const,
                }));
                const session = await this.deps.debate.startDebate(
                    topic,
                    participants,
                    strategy,
                    maxRounds,
                );
                return JSON.stringify({
                    sessionId: session.id,
                    topic: session.topic,
                    status: session.status,
                    strategy,
                    maxRounds,
                }).slice(0, 6000);
            },
        });

        this.tools.set('debate.verdict', {
            name: 'debate.verdict',
            description: 'Get the verdict/result of a completed debate.',
            parameters: {
                type: 'object',
                properties: {
                    sessionId: { type: 'string', description: 'The debate session ID' },
                },
                required: ['sessionId'],
            },
            run: async (args) => {
                if (!this.deps.debate) throw new Error('Debate service not configured');
                const sessionId = str(args['sessionId']);
                if (!sessionId) throw new Error('sessionId is required');
                const verdict = this.deps.debate.getCachedVerdict(sessionId);
                if (!verdict) {
                    const session = this.deps.debate.engine?.getSession(sessionId);
                    if (!session) return 'Debate session not found.';
                    return JSON.stringify({
                        sessionId,
                        topic: session.topic,
                        phase: session.phase,
                        round: session.round,
                        status: 'not_yet_completed',
                        message: 'Debate is still in progress. Call debate.verdict later.',
                    }).slice(0, 6000);
                }
                return JSON.stringify({
                    sessionId: verdict.sessionId,
                    topic: verdict.topic,
                    summary: verdict.summary,
                    conclusionType: verdict.conclusionType,
                    stanceResult: verdict.stanceResult,
                    confidence: verdict.confidence,
                    roundsTotal: verdict.roundsTotal,
                    keyArguments: verdict.keyArguments.slice(0, 5),
                }).slice(0, 6000);
            },
        });

        this.tools.set('debate.status', {
            name: 'debate.status',
            description: 'Get the current status of a debate session (phase, round, participants).',
            parameters: {
                type: 'object',
                properties: {
                    sessionId: { type: 'string', description: 'The debate session ID' },
                },
                required: ['sessionId'],
            },
            run: async (args) => {
                if (!this.deps.debate) throw new Error('Debate service not configured');
                const sessionId = str(args['sessionId']);
                if (!sessionId) throw new Error('sessionId is required');
                const session = this.deps.debate.engine?.getSession(sessionId);
                if (!session) return 'Debate session not found.';
                return JSON.stringify({
                    sessionId,
                    topic: session.topic,
                    phase: session.phase,
                    round: session.round,
                    agents: session.agentStates.map((a) => ({
                        agentId: a.agentId,
                        phase: a.phase,
                        tokensUsed: a.tokensUsed,
                    })),
                    totalTokens: session.totalTokens,
                }).slice(0, 6000);
            },
        });
    }
}
