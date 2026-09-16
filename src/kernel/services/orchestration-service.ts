import type { ISTopology, ISNode, AgentLifecycleState } from '../contracts/topology';
import type { NodeContext } from '../types/domain-types';
import type { ChatMessage } from '../types/llm-types';
import type { IEventBus } from '../types/interfaces';
import { EVENTS } from '../events/event-names';
import { ExecutionQueue } from './execution-queue';
import { estimateTokenCount } from '../../llm/utils/token-counter';
import type { QueuePriority } from './execution-queue';

import { rootLogger } from './logger-service';
import { safeJsonParse } from '../../kernel/utils/safe-json';

const LOGGER = rootLogger.child('Orchestrator');

function heapLog(label: string): void {
    const mem = (
        performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }
    )?.memory;
    if (mem) {
        const usedMB = Math.round(mem.usedJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(mem.jsHeapSizeLimit / 1024 / 1024);
        LOGGER.warn('Heap', label, { usedMB, limitMB });
    }
}

const estimateTokens = (text: string): number => estimateTokenCount(text);

interface ExecutionStats {
    totalExecutions: number;
    completedNodes: number;
    failedNodes: number;
    avgNodeDuration: number;
    nodeStats: Record<string, { count: number; errors: number; totalDuration: number }>;
}

export interface OrchestrationServiceDeps {
    eventBus: IEventBus;
    toolService: {
        execute: (
            toolId: string,
            input: unknown,
        ) => Promise<{ status: string; data?: unknown; error?: string }>;
    };
    cognitiveService: {
        executeAgentNode: (
            node: ISNode,
            data: NodeContext,
            signal?: AbortSignal,
        ) => Promise<string>;
    };
    policyService: {
        enforcePrivacy: (data: { nodeId: string; output?: string }) => {
            blocked: boolean;
            sanitized?: string;
        };
        sanitizeOutput: (nodeId: string, output: string) => string;
    };
    executionQueueMaxConcurrency?: number;
    executionQueueDefaultPriority?: QueuePriority;
    deadLetterQueue?: {
        push(entry: {
            event: string;
            payload: unknown;
            error: string;
            context?: Record<string, unknown>;
            retryCount: number;
        }): Promise<void>;
    };
}

export class OrchestrationService {
    private deps: OrchestrationServiceDeps;
    private activeTopology: ISTopology | null = null;
    private disabledNodes: Set<string> = new Set();
    private unsubs: Array<() => void> = [];
    private executionStats: ExecutionStats = {
        totalExecutions: 0,
        completedNodes: 0,
        failedNodes: 0,
        avgNodeDuration: 0,
        nodeStats: {},
    };
    private queue: ExecutionQueue;
    private readonly MAX_RATE_MAP_SIZE = 200;
    private readonly MAX_LIFECYCLE_STATES = 500;
    private rateLimitTimestamps: Map<string, number[]> = new Map();
    private rateLimitTokenRecords: Map<string, Array<{ timestamp: number; value: number }>> =
        new Map();
    private rateLimitCostRecords: Map<string, Array<{ timestamp: number; value: number }>> =
        new Map();
    private lifecycleStates: Map<string, AgentLifecycleState> = new Map();
    private _abortController = new AbortController();

    private _trimMap<K, V>(map: Map<K, V>, max: number): void {
        while (map.size > max) {
            const key = map.keys().next().value;
            if (key !== undefined) map.delete(key as K);
            else break;
        }
    }

    constructor(deps: OrchestrationServiceDeps) {
        this.deps = deps;
        this.queue = new ExecutionQueue(
            (task) =>
                this.execute(task.payload as { requestId?: string; messages?: ChatMessage[] }),
            deps.executionQueueMaxConcurrency || 3,
            deps.deadLetterQueue as
                import('../contracts/dead-letter-queue').IDeadLetterQueue | undefined,
            deps.eventBus,
        );
    }

    private _initialized = false;

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        this.setupListeners();
    }

    destroy() {
        this._abortController.abort();
        this._initialized = false;
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
        this.queue.clear();
        this.rateLimitTimestamps.clear();
        this.rateLimitTokenRecords.clear();
        this.rateLimitCostRecords.clear();
        this.lifecycleStates.clear();
        this.disabledNodes.clear();
    }

    setNodeDisabled(nodeId: string, disabled: boolean) {
        if (disabled) this.disabledNodes.add(nodeId);
        else this.disabledNodes.delete(nodeId);
        const lifecycle: AgentLifecycleState = disabled ? 'paused' : 'ready';
        this.lifecycleStates.set(nodeId, lifecycle);
        this._trimMap(this.lifecycleStates, this.MAX_LIFECYCLE_STATES);
        if (this.activeTopology) {
            this.activeTopology = {
                ...this.activeTopology,
                nodes: this.activeTopology.nodes.map((n) =>
                    n.id === nodeId ? { ...n, lifecycle } : n,
                ),
            };
        }
    }

    isNodeDisabled(nodeId: string) {
        return this.disabledNodes.has(nodeId);
    }

    private setupListeners() {
        this.unsubs.push(
            this.deps.eventBus.on(EVENTS.REQUEST_INCOMING, async (request) => {
                if (this.activeTopology) {
                    const priority = this.deps.executionQueueDefaultPriority || 'normal';
                    this.queue.enqueue(
                        priority,
                        request as { requestId?: string; messages?: ChatMessage[] },
                    );
                }
            }),
        );
    }

    mount(topology: ISTopology) {
        this.activeTopology = topology;
        const newNodeIds = new Set(topology.nodes.map((n) => n.id));
        // Clean up stale entries for nodes removed from topology
        for (const key of this.lifecycleStates.keys()) {
            if (!newNodeIds.has(key)) {
                this.lifecycleStates.delete(key);
                this.rateLimitTimestamps.delete(key);
                this.rateLimitTokenRecords.delete(key);
                this.rateLimitCostRecords.delete(key);
                this.disabledNodes.delete(key);
            }
        }
        for (const node of topology.nodes) {
            if (!this.lifecycleStates.has(node.id)) {
                const lifecycle =
                    node.lifecycle || (this.disabledNodes.has(node.id) ? 'paused' : 'ready');
                this.lifecycleStates.set(node.id, lifecycle);
                this._trimMap(this.lifecycleStates, this.MAX_LIFECYCLE_STATES);
                node.lifecycle = lifecycle;
            }
        }
        LOGGER.info('Orchestrator', `Mounted topology: ${topology.name} (v${topology.version})`);
        this.deps.eventBus.emit(EVENTS.SYSTEM_TOPOLOGY_MOUNTED, { topologyId: topology.id });
    }

    getActiveTopology() {
        return this.activeTopology;
    }

    getExecutionStats(): ExecutionStats {
        return { ...this.executionStats };
    }

    validateTopology(topology: ISTopology): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        if (!topology.nodes || topology.nodes.length === 0) errors.push('Topology has no nodes');
        if (!topology.edges) errors.push('Topology has no edges');
        const entryNodes = topology.nodes.filter((n) => n.type === 'router' || n.id === 'entry');
        if (entryNodes.length === 0) errors.push('No entry node found (router or id="entry")');
        const edgeKeys = new Set<string>();
        for (const edge of topology.edges || []) {
            if (!topology.nodes.some((n) => n.id === edge.from))
                errors.push(`Edge from "${edge.from}" references non-existent node`);
            if (!topology.nodes.some((n) => n.id === edge.to))
                errors.push(`Edge to "${edge.to}" references non-existent node`);
            if (edge.from === edge.to) errors.push(`Self-loop edge: ${edge.from} -> ${edge.to}`);
            const key = `${edge.from}->${edge.to}`;
            if (edgeKeys.has(key)) errors.push(`Duplicate edge: ${key}`);
            edgeKeys.add(key);
        }
        return { valid: errors.length === 0, errors };
    }

    async execute(
        request: {
            requestId?: string;
            messages?: ChatMessage[];
            output?: string;
            blackboard?: Record<string, unknown>;
            traceId?: string;
        },
        mode: 'production' | 'simulation' = 'production',
    ) {
        if (!this.activeTopology) return;
        const startNode = this.activeTopology.nodes.find(
            (n) => n.type === 'router' || n.id === 'entry',
        );
        if (!startNode) return;

        const traceId = request.requestId || `trace-${crypto.randomUUID()}`;
        this.executionStats.totalExecutions++;

        const _heapStartTime = Date.now();
        LOGGER.info(
            'Orchestrator',
            `Starting ${mode} execution chain at node: ${startNode.label}`,
            { traceId },
        );

        // P0-5: DEV-only heap monitor with proper cleanup in try/finally
        const _heapTimer = import.meta.env.DEV
            ? setInterval(() => heapLog('tick'), 5000)
            : undefined;
        try {
            await this.processNode(
                startNode,
                {
                    ...request,
                    traceId,
                    blackboard: {},
                    history: [],
                    output: request.output || '',
                } as NodeContext,
                mode,
            );
        } finally {
            if (_heapTimer !== undefined) clearInterval(_heapTimer);
            if (import.meta.env.DEV)
                heapLog(`execute:end duration=${Date.now() - _heapStartTime}ms`);
        }
    }

    private async executeNodeLogic(
        node: ISNode,
        data: NodeContext,
        mode: 'production' | 'simulation',
    ): Promise<string> {
        LOGGER.debug('Orchestrator', `Executing node: ${node.label} (${node.type})`, {
            traceId: data.traceId,
            mode,
        });

        switch (node.type) {
            case 'agent':
                return mode === 'simulation'
                    ? await this.deps.cognitiveService.executeAgentNode(
                          node,
                          {
                              ...data,
                              output: `[SIM] ${data.output || ''}`,
                          },
                          this._abortController.signal,
                      )
                    : await this.deps.cognitiveService.executeAgentNode(
                          node,
                          data,
                          this._abortController.signal,
                      );
            case 'router':
                return await this.executeRouterNode(node, data);
            case 'guardrail': {
                const { approved, filteredOutput, error } = await this.executeGuardrailNode(
                    node,
                    data,
                );
                if (!approved) {
                    this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                        message: `Guardrail violation: ${error}`,
                        type: 'warning',
                    });
                    throw new Error(error || 'Blocked by guardrail');
                }
                return filteredOutput || data.output || '';
            }
            case 'tool':
                return mode === 'simulation'
                    ? `[SIM] Tool ${node.config.toolId || 'unknown'} executed`
                    : await this.executeToolNode(node, data);
            default:
                LOGGER.warn('Orchestrator', `Unknown node type: ${node.type} (${node.label})`);
                return data.output || `[Unhandled node: ${node.label}]`;
        }
    }

    private async processNode(
        node: ISNode,
        data: NodeContext,
        mode: 'production' | 'simulation' = 'production',
        visited = new Set<string>(),
    ) {
        if (this.disabledNodes.has(node.id)) return;

        if (this.isRateLimited(node)) {
            this.deps.eventBus.emit(EVENTS.AGENT_RATE_LIMITED, {
                nodeId: node.id,
                label: node.label,
                reason: 'Rate limit exceeded',
            });
            return;
        }

        if (visited.has(node.id)) {
            LOGGER.warn(
                'Orchestrator',
                `Cycle detected at node: ${node.label} (${node.id}), skipping`,
            );
            this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Cycle detected at node: ${node.label} — execution stopped`,
                type: 'warning',
            });
            return;
        }
        visited.add(node.id);

        this.deps.eventBus.emit(EVENTS.COGNITIVE_STEP_ACTIVE, {
            nodeId: node.id,
            traceId: data.traceId,
        });
        this.transitionLifecycle(node, 'busy');

        let status: 'done' | 'error' = 'done';
        let output: string;
        const startTime = Date.now();

        try {
            output = await this.executeNodeLogic(node, data, mode);
        } catch (e: unknown) {
            const errMsg = e instanceof Error ? e.message : String(e);
            output = `Error in node ${node.label}: ${errMsg.slice(0, 2000)}`;
            status = 'error';
            this.executionStats.failedNodes++;
        }

        output = this.deps.policyService.sanitizeOutput(node.id, output);
        this.recordRateLimitUsage(node, output);
        this.transitionLifecycle(node, status === 'error' ? 'errored' : 'idle');

        const duration = Date.now() - startTime;
        if (status === 'done') this.executionStats.completedNodes++;
        if (!this.executionStats.nodeStats[node.id]) {
            this.executionStats.nodeStats[node.id] = { count: 0, errors: 0, totalDuration: 0 };
        }
        this.executionStats.nodeStats[node.id]!.count++;
        if (status === 'error') this.executionStats.nodeStats[node.id]!.errors++;
        this.executionStats.nodeStats[node.id]!.totalDuration += duration;
        this.executionStats.avgNodeDuration =
            this.executionStats.completedNodes > 0
                ? Object.values(this.executionStats.nodeStats).reduce(
                      (s, n) => s + n.totalDuration,
                      0,
                  ) / this.executionStats.completedNodes
                : 0;

        let updatedBlackboard = { ...data.blackboard };
        try {
            if (output.trim().startsWith('{')) {
                const parsed = safeJsonParse(output) as Record<string, unknown> | undefined;
                if ((parsed as Record<string, unknown>)?._blackboard) {
                    updatedBlackboard = {
                        ...updatedBlackboard,
                        ...((parsed as Record<string, unknown>)._blackboard as Record<
                            string,
                            unknown
                        >),
                    };
                }
            }
        } catch (e) {
            LOGGER.warn('Orchestrator', 'Failed to parse node output as JSON for blackboard', {
                error: e,
            });
        }

        this.deps.eventBus.emit(EVENTS.COGNITIVE_STEP_COMPLETED, {
            nodeId: node.id,
            traceId: data.traceId,
            status,
            duration,
            output,
            provider: node.config.provider,
            model: node.config.model,
        });

        const nextData: NodeContext = {
            ...data,
            output,
            blackboard: updatedBlackboard,
            history: [...data.history, { node: node.label, output, status }],
        };

        const nextEdges = this.activeTopology?.edges.filter((e) => {
            if (e.from !== node.id) return false;
            if (status === 'error' && e.trigger === 'on_error') return true;
            if (
                status === 'done' &&
                (e.trigger === 'on_success' || e.trigger === 'data_flow' || !e.trigger)
            )
                return true;
            return false;
        });

        if (nextEdges && nextEdges.length > 0) {
            const errorEdges = nextEdges.filter((e) => e.trigger === 'on_error');
            const parallelEdges = nextEdges.filter((e) => e.trigger !== 'on_error');

            for (const edge of errorEdges) {
                const nextNode = this.activeTopology?.nodes.find((n) => n.id === edge.to);
                if (nextNode) await this.processNode(nextNode, nextData, mode, new Set(visited));
            }

            if (parallelEdges.length > 0) {
                const PARALLEL_LIMIT = 3;
                const batches: (typeof parallelEdges)[] = [];
                for (let i = 0; i < parallelEdges.length; i += PARALLEL_LIMIT) {
                    batches.push(parallelEdges.slice(i, i + PARALLEL_LIMIT));
                }
                heapLog(`batches:start total=${parallelEdges.length} batches=${batches.length}`);
                for (let bi = 0; bi < batches.length; bi++) {
                    const batch = batches[bi]!;
                    heapLog(`batch:before idx=${bi} nodes=${batch.length}`);
                    await Promise.allSettled(
                        batch.map(async (edge) => {
                            const nextNode = this.activeTopology?.nodes.find(
                                (n) => n.id === edge.to,
                            );
                            if (nextNode)
                                await this.processNode(nextNode, nextData, mode, new Set(visited));
                        }),
                    );
                    heapLog(`batch:after idx=${bi}`);
                }
                heapLog('batches:end');
            }
        } else {
            heapLog('REQUEST_COMPLETED:before');
            this.deps.eventBus.emit(EVENTS.REQUEST_COMPLETED, {
                final_data: { ...nextData, output: nextData.output || '' },
            });
            heapLog('REQUEST_COMPLETED:after');
        }
    }

    private async executeRouterNode(node: ISNode, data: NodeContext): Promise<string> {
        const input = data.output || '';
        const outgoingEdges =
            this.activeTopology?.edges.filter(
                (e) => e.from === node.id && e.trigger !== 'on_error',
            ) || [];
        const destinations = outgoingEdges
            .map((e) => this.activeTopology?.nodes.find((n) => n.id === e.to))
            .filter((n): n is ISNode => !!n);

        if (destinations.length === 0) return input;
        if (destinations.length === 1)
            return JSON.stringify({ traceId: data.traceId, output: input });

        const routeModel = node.config.routingModel as string | undefined;
        if (routeModel) {
            try {
                const defaultPrompt = (template: string, dests: string, inp: string) =>
                    template ||
                    `Analyze the following input and choose the most appropriate destination node from:\n${dests}\n\nInput:\n${inp}\n\nRespond with ONLY the index number of the best destination. Example: "0"`;
                const destStr = destinations
                    .map(
                        (d, i) =>
                            `${i}: ${d.label} (${d.type}) - ${(d.config.description as string) || 'No description'}`,
                    )
                    .join('\n');
                const inputTrunc = input.substring(0, 2000);
                const promptTemplate = (node.config.routingPrompt as string) || '';
                const routingPrompt = defaultPrompt(promptTemplate, destStr, inputTrunc);
                const decision = await this.deps.cognitiveService.executeAgentNode(
                    {
                        ...node,
                        config: { ...node.config, model: routeModel, prompt: routingPrompt },
                    },
                    data,
                    this._abortController.signal,
                );
                const idx = parseInt(decision.trim(), 10);
                if (!isNaN(idx) && idx >= 0 && idx < destinations.length) {
                    return JSON.stringify({
                        traceId: data.traceId,
                        output: `${input}\n[Routed to: ${destinations[idx]!.label}]`,
                    });
                }
            } catch (e) {
                LOGGER.warn('Orchestrator', 'LLM route parsing failed', { error: e });
            }
        }

        const typePriority: Record<string, number> = { guardrail: 0, tool: 1, agent: 2, router: 3 };
        const sorted = [...destinations].sort(
            (a, b) => (typePriority[a.type] ?? 99) - (typePriority[b.type] ?? 99),
        );
        return JSON.stringify({
            traceId: data.traceId,
            output: `${input}\n[Routed to: ${sorted[0]!.label}]`,
        });
    }

    private isReDosPattern(pattern: string): boolean {
        if (pattern.length > 200) return true;
        if (/\([^)]+\)\s*[+*]/.test(pattern)) return true;
        if (/\([^)]*[+*][^)]*\)\s*[+*]/.test(pattern)) return true;
        if (/(?:^|[^\\])(?:\.\*|\.[+*]|[^*+]\*|[^*+]+)\s*[*+]\s*[*+]/.test(pattern)) return true;
        if (/(\([^)]+\)\s*\+\s*)+\([^)]+\)\s*\+/.test(pattern)) return true;
        if (/\([^)]+\)\s*\+\s*\)\s*[+*]/.test(pattern)) return true;
        if (/\([^)]+(?:[+*][^)]+)+\)\s*[+*]/.test(pattern)) return true;
        if (/\([^)]*\([^)]*\)[^)]*\)[+*]/.test(pattern)) return true;
        return false;
    }

    private async executeGuardrailNode(
        node: ISNode,
        data: NodeContext,
    ): Promise<{ approved: boolean; filteredOutput?: string; error?: string }> {
        const contentToCheck = data.output || '';
        const maxLength = node.config.maxLength as number | undefined;
        if (maxLength && contentToCheck.length > maxLength) {
            return {
                approved: false,
                filteredOutput: contentToCheck.substring(0, maxLength),
                error: `Exceeds max length (${contentToCheck.length} > ${maxLength})`,
            };
        }
        const blockedKeywords = (node.config.blockedKeywords as string[] | undefined) || [];
        if (blockedKeywords.length > 0) {
            const found = blockedKeywords.find((w) =>
                contentToCheck.toLowerCase().includes(w.toLowerCase()),
            );
            if (found) return { approved: false, error: `Blocked word: "${found}"` };
        }
        const blockedPatterns = node.config.blockedPatterns as string[] | undefined;
        if (blockedPatterns) {
            for (const pattern of blockedPatterns) {
                try {
                    if (this.isReDosPattern(pattern)) {
                        LOGGER.warn(
                            'Orchestrator',
                            `Rejected potentially dangerous regex pattern: "${pattern.slice(0, 50)}..."`,
                        );
                        continue;
                    }
                    if (new RegExp(pattern, 'i').test(contentToCheck))
                        return { approved: false, error: `Matched pattern "${pattern}"` };
                } catch {
                    LOGGER.warn(
                        'Orchestrator',
                        `Invalid regex pattern: "${pattern.slice(0, 50)}..."`,
                    );
                }
            }
        }
        return { approved: true, filteredOutput: contentToCheck };
    }

    private async executeToolNode(node: ISNode, data: NodeContext): Promise<string> {
        const toolId = node.config.toolId as string | undefined;
        if (!toolId) return `Error: No toolId configured for node ${node.label}`;
        try {
            const input = (data.output || JSON.stringify(data)) as string;
            const result = await this.deps.toolService.execute(toolId, input);
            return result.status === 'success'
                ? typeof result.data === 'string'
                    ? result.data
                    : JSON.stringify(result.data, null, 2)
                : `Tool Error: ${result.error}`;
        } catch (e: unknown) {
            return `Execution Failed: ${e instanceof Error ? e.message : String(e)}`;
        }
    }

    private isRateLimited(node: ISNode): boolean {
        const rl = node.config.rateLimit;
        if (!rl) return false;
        const now = Date.now();
        const timestamps = this.rateLimitTimestamps.get(node.id) || [];
        const recent = timestamps.filter((t) => {
            if (rl.maxCallsPerMinute && now - t < 60000) return true;
            if (rl.maxCallsPerHour && now - t < 3600000) return true;
            return false;
        });
        this.rateLimitTimestamps.set(node.id, recent);
        this._trimMap(this.rateLimitTimestamps, this.MAX_RATE_MAP_SIZE);
        const callsLastMin = recent.filter((t) => now - t < 60000).length;
        const callsLastHour = recent.filter((t) => now - t < 3600000).length;
        if (rl.maxCallsPerMinute && callsLastMin >= rl.maxCallsPerMinute) return true;
        if (rl.maxCallsPerHour && callsLastHour >= rl.maxCallsPerHour) return true;
        const tokensRecs = this.rateLimitTokenRecords.get(node.id);
        const tokensUsed = tokensRecs ? this.filterRecent(tokensRecs) : 0;
        if (rl.maxTokensPerDay && tokensUsed >= rl.maxTokensPerDay) return true;
        const costRecs = this.rateLimitCostRecords.get(node.id);
        const costUsed = costRecs ? this.filterRecent(costRecs) : 0;
        if (rl.maxCostPerDay && costUsed >= rl.maxCostPerDay) return true;
        return false;
    }

    private recordRateLimitUsage(node: ISNode, output: string) {
        const rl = node.config.rateLimit;
        if (!rl) return;
        const now = Date.now();
        const timestamps = this.rateLimitTimestamps.get(node.id) || [];
        timestamps.push(now);
        this.rateLimitTimestamps.set(node.id, timestamps);
        this._trimMap(this.rateLimitTimestamps, this.MAX_RATE_MAP_SIZE);
        if (rl.maxTokensPerDay) {
            const current = this.rateLimitTokenRecords.get(node.id) || [];
            current.push({ timestamp: now, value: estimateTokens(output) });
            this.rateLimitTokenRecords.set(
                node.id,
                current.filter((r) => now - r.timestamp < 86400000),
            );
            this._trimMap(this.rateLimitTokenRecords, this.MAX_RATE_MAP_SIZE);
        }
        if (rl.maxCostPerDay) {
            const current = this.rateLimitCostRecords.get(node.id) || [];
            const outputTokens = estimateTokens(output);
            current.push({ timestamp: now, value: outputTokens * 0.000002 });
            this.rateLimitCostRecords.set(
                node.id,
                current.filter((r) => now - r.timestamp < 86400000),
            );
            this._trimMap(this.rateLimitCostRecords, this.MAX_RATE_MAP_SIZE);
        }
    }

    private filterRecent(records: Array<{ timestamp: number; value: number }>): number {
        const now = Date.now();
        return records.reduce((sum, r) => (now - r.timestamp < 86400000 ? sum + r.value : sum), 0);
    }

    private transitionLifecycle(node: ISNode, to: AgentLifecycleState) {
        const from = this.lifecycleStates.get(node.id) || node.lifecycle || 'ready';
        if (from === to) return;
        this.lifecycleStates.set(node.id, to);
        this._trimMap(this.lifecycleStates, this.MAX_LIFECYCLE_STATES);
        if (this.activeTopology) {
            this.activeTopology = {
                ...this.activeTopology,
                nodes: this.activeTopology.nodes.map((n) =>
                    n.id === node.id ? { ...n, lifecycle: to } : n,
                ),
            };
        }
        this.deps.eventBus.emit(EVENTS.AGENT_LIFECYCLE_CHANGE, { id: node.id, from, to });
    }

    resetStats() {
        this.executionStats = {
            totalExecutions: 0,
            completedNodes: 0,
            failedNodes: 0,
            avgNodeDuration: 0,
            nodeStats: {},
        };
    }
}
