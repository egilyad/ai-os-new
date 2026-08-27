import type { ISNode } from '../contracts/topology';
import type {
    NodeContext,
    CognitiveTrace,
    CognitiveDecision,
    CognitiveStep,
} from '../types/domain-types';
import type { AdapterMessage, IProviderAdapter } from '../contracts/provider-adapter';
import type { TraceStore } from '../contracts/storage/trace-store';
import type { BlackboardService } from './blackboard-service';
import { EVENTS } from '../events/event-names';
import { estimateTokens } from '../utils/tokenEstimate';
import { rootLogger } from './logger-service';
import { sanitizePromptVar } from '../utils/sanitize';
import type { IDiagnosticService } from '../contracts/diagnostic-service';

const LOGGER = rootLogger.child('CognitiveService');

export type { CognitiveTrace, CognitiveDecision, CognitiveStep };

export type DecisionAlternative = {
    id: string;
    label: string;
    score: number;
    reasoning: string;
    constraints_impact?: Record<string, number>;
    metadata?: Record<string, unknown>;
};

export interface CognitiveStats {
    totalTraces: number;
    completedTraces: number;
    failedTraces: number;
    avgLatency: number;
    avgTokens: number;
    avgConfidence: number;
    totalTokens: number;
    totalCost: number;
}

interface CognitiveRouterProvider {
    provider: string;
    name: string;
    model: string;
    score?: number;
    key?: string;
}

interface CognitiveRoleService {
    recordRoleUsage?: (
        roleId: string,
        success: boolean,
        inputTokens: number,
        outputTokens: number,
    ) => void;
}

export interface CognitiveServiceDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        onSafe: <T>(event: string, cb: (data: T) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
    };
    traceStore: TraceStore;
    routerService: {
        getRankedProviders: (
            strategy: string,
            prompt: string,
            priority?: string,
            agentId?: string,
        ) => CognitiveRouterProvider[];
    };
    keyService?: { getKey?: (id: string) => unknown };
    roleService: CognitiveRoleService;
    adapterRegistry: {
        getAdapter: (provider: string) => IProviderAdapter | undefined;
    };
    blackboardService: Pick<BlackboardService, 'read'>;
    diagnosticService?: IDiagnosticService;
}

export class CognitiveService {
    private deps: CognitiveServiceDeps;

    private traces: CognitiveTrace[] = [];
    private activeTraces = new Map<string, CognitiveTrace>();
    private unsubs: Array<() => void> = [];

    private persistErrorCount = 0;

    private stats: CognitiveStats = {
        totalTraces: 0,
        completedTraces: 0,
        failedTraces: 0,
        avgLatency: 0,
        avgTokens: 0,
        avgConfidence: 0,
        totalTokens: 0,
        totalCost: 0,
    };

    // ===== OOM SAFETY LIMITS =====
    private readonly MAX_TRACES = 30;
    private readonly MAX_STEPS = 20;
    private readonly MAX_ACTIVE_TRACES = 20;
    private readonly MAX_CHUNK_BUFFER = 8000;
    private readonly PERSIST_INTERVAL = 2000;
    private readonly MAX_INPUT_LENGTH = 5000;
    private readonly MAX_OUTPUT_LENGTH = 50000;
    private readonly MAX_STEP_OBSERVATIONS_LENGTH = 2000;

    private persistTimer: ReturnType<typeof setTimeout> | null = null;
    private persistQueued = false;
    private _listenersSetup = false;

    constructor(deps: CognitiveServiceDeps) {
        this.deps = deps;
    }

    async init() {
        if (this._listenersSetup) return;
        this.setupListeners();
        this._listenersSetup = true;
        await this.load();
    }

    private async flush(): Promise<void> {
        if (this.traces.length === 0) return;
        try {
            const trimmed = this.traces.slice(0, this.MAX_TRACES);
            await this.deps.traceStore.bulkPut(trimmed);
            this.persistErrorCount = 0;
        } catch (e) {
            LOGGER.error('CognitiveService', 'Flush error', { error: e });
        }
    }

    async destroy(): Promise<void> {
        await this.flush();
        this._listenersSetup = false;
        this.unsubs.forEach((u) => u());
        if (this.persistTimer) {
            clearTimeout(this.persistTimer);
            this.persistTimer = null;
        }
        this.persistQueued = false;
        this.traces = [];
        this.activeTraces.clear();
    }

    // ================= LOAD =================
    private async load() {
        try {
            if ((await this.deps.traceStore.count()) > 0) {
                this.traces = await this.deps.traceStore.queryTraces({
                    order: 'desc',
                    limit: 50,
                });
            }

            // HARD TRIM (OOM FIX)
            this.traces = this.traces.slice(0, this.MAX_TRACES);
        } catch (e) {
            LOGGER.error('CognitiveService', 'Failed to load traces', { error: e });
        }
    }

    // ================= SAFE PERSIST (THROTTLED + COALESCED) =================
    private persist() {
        if (this.persistQueued) return;
        this.persistQueued = true;

        this.persistTimer = setTimeout(async () => {
            try {
                const trimmed = this.traces.slice(0, this.MAX_TRACES);
                await this.deps.traceStore.bulkPut(trimmed);

                this.traces = trimmed;
                this.persistErrorCount = 0;
            } catch (e) {
                this.persistErrorCount++;
                LOGGER.error('CognitiveService', 'Persist error', { error: e });
            } finally {
                this.persistQueued = false;
                this.persistTimer = null;
            }
        }, this.PERSIST_INTERVAL);
    }

    // ================= DIAGNOSTIC INJECTION (observability Phase 2) =================
    // Surface system health (active CognitiveIssues) into the trace at finalization,
    // so the trace UI can show whether execution happened under degraded conditions.
    private getDiagnosticService(): IDiagnosticService | undefined {
        try {
            return this.deps.diagnosticService;
        } catch {
            return undefined;
        }
    }

    private attachDiagnostics(trace: CognitiveTrace): void {
        const ds = this.getDiagnosticService();
        if (!ds) return;
        try {
            const issues = ds
                .getAllActiveIssues()
                .slice(0, 5)
                .map((i) => ({ type: i.type, severity: i.severity, message: i.message }));
            trace.metadata = {
                ...trace.metadata,
                diagnostics: { activeIssueCount: issues.length, issues },
            };
        } catch (e) {
            LOGGER.warn('CognitiveService', 'attachDiagnostics failed', { error: String(e) });
        }
    }

    // ================= LISTENERS =================
    private setupListeners() {
        this.unsubs.push(
            this.deps.eventBus.onSafe<{
                requestId?: string;
                messages?: Array<{ content?: string }>;
            }>(EVENTS.SEND_MESSAGE, (req) => {
                const lastMsg = req.messages?.at?.(-1);
                this.startTrace(req.requestId || crypto.randomUUID(), lastMsg?.content || '');
            }),

            this.deps.eventBus.onSafe<{ traceId?: string; nodeId: string }>(
                EVENTS.COGNITIVE_STEP_ACTIVE,
                (d) => {
                    const trace = this.activeTraces.get(d.traceId || '');
                    if (!trace) return;

                    trace.steps.push({
                        id: d.nodeId,
                        type: 'reasoning',
                        label: `Processing ${d.nodeId}`,
                        status: 'active',
                        timestamp: Date.now(),
                    });

                    if (trace.steps.length > this.MAX_STEPS) {
                        trace.steps.splice(0, trace.steps.length - this.MAX_STEPS);
                    }

                    this.persist();
                    this.throttledEmit();
                },
            ),

            this.deps.eventBus.onSafe<{
                traceId?: string;
                nodeId: string;
                status: string;
                duration: number;
                output?: string;
                fullContent?: string;
            }>(EVENTS.COGNITIVE_STEP_COMPLETED, (d) => {
                const trace = this.activeTraces.get(d.traceId || '');
                if (!trace) return;

                const step = trace.steps.find((s) => s.id === d.nodeId);

                if (step) {
                    step.status = d.status === 'error' ? 'error' : 'done';
                    step.duration = d.duration;
                    step.observations =
                        d.output?.slice?.(0, this.MAX_STEP_OBSERVATIONS_LENGTH) ?? d.output;
                }

                if (d.status === 'error') {
                    trace.status = 'failed';
                    trace.endTime = Date.now();
                    trace.totalLatency = trace.endTime - trace.startTime;
                    this.attachDiagnostics(trace);
                    this.activeTraces.delete(d.traceId || '');
                    this.updateStats(trace, true);
                    this.persist();
                    this.throttledEmit();
                    return;
                }

                if (trace.steps.length > this.MAX_STEPS) {
                    trace.steps.splice(0, trace.steps.length - this.MAX_STEPS);
                }

                this.persist();
                this.throttledEmit();
            }),

            this.deps.eventBus.onSafe<{ final_data?: { traceId: string; output: string } }>(
                EVENTS.REQUEST_COMPLETED,
                (data) => {
                    const traceId = data.final_data?.traceId || '';
                    const trace = this.activeTraces.get(traceId);
                    if (!trace) return;

                    trace.status = 'completed';
                    trace.output = data.final_data?.output?.slice(0, this.MAX_OUTPUT_LENGTH);
                    trace.endTime = Date.now();
                    trace.totalLatency = trace.endTime - trace.startTime;

                    this.attachDiagnostics(trace);

                    const text = trace.output || '';

                    // SAFE streaming replacement (NO BIG STRINGS)
                    const windowText = text.slice(-this.MAX_CHUNK_BUFFER);
                    trace.totalTokens = estimateTokens(windowText);

                    this.activeTraces.delete(traceId);

                    this.updateStats(trace);
                    this.persist();
                    this.throttledEmit();
                },
            ),
        );
    }

    // ================= TRIM ACTIVE TRACES =================
    private trimActiveTraces() {
        if (this.activeTraces.size < this.MAX_ACTIVE_TRACES) return;

        const firstKey = this.activeTraces.keys().next().value;
        if (firstKey) {
            const old = this.activeTraces.get(firstKey);
            if (old) old.status = 'completed';
            this.activeTraces.delete(firstKey);
        }
    }

    // ================= TRACE START =================
    private startTrace(traceId: string, input: string) {
        this.trimActiveTraces();

        const trace: CognitiveTrace = {
            id: crypto.randomUUID(),
            traceId,
            startTime: Date.now(),
            input: input.slice(0, this.MAX_INPUT_LENGTH),
            status: 'running',
            steps: [],
            decisionGraph: { nodes: [], edges: [] },
            totalLatency: 0,
            totalTokens: 0,
            estimatedCost: 0,
            semanticConfidence: 1,
            dataQuality: {},
        };

        this.activeTraces.set(traceId, trace);

        this.traces = [trace, ...this.traces].slice(0, this.MAX_TRACES);

        this.persist();
        this.throttledEmit();
    }

    // ================= SAFE EMIT THROTTLE =================
    private lastEmitTime = 0;
    private static EMIT_INTERVAL_MS = 500;

    private throttledEmit() {
        const now = Date.now();
        if (now - this.lastEmitTime >= CognitiveService.EMIT_INTERVAL_MS) {
            this.lastEmitTime = now;
            const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } })?.memory;
            const heapBefore = mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : 0;
            this.deps.eventBus.emit(EVENTS.COGNITIVE_TRACE_UPDATED, this.getTraces());
            const heapAfter = mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : 0;
            if (heapAfter - heapBefore > 5) {
                LOGGER.warn('CognitiveService', 'throttledEmit heap growth', {
                    heapBefore,
                    heapAfter,
                    delta: heapAfter - heapBefore,
                });
            }
        }
    }

    // ================= STATS =================
    private updateStats(trace: CognitiveTrace, failed?: boolean) {
        this.stats.totalTraces++;
        if (failed) {
            this.stats.failedTraces++;
        } else {
            this.stats.completedTraces++;
        }
        this.stats.totalTokens += trace.totalTokens;

        // B10-26: Correct running average formula — weight previous average by (n-1)/n
        const n = this.stats.totalTraces;
        this.stats.avgLatency = this.stats.avgLatency * ((n - 1) / n) + trace.totalLatency / n;

        this.stats.avgTokens = this.stats.avgTokens * ((n - 1) / n) + trace.totalTokens / n;

        this.stats.avgConfidence =
            this.stats.avgConfidence * ((n - 1) / n) + trace.semanticConfidence / n;
    }

    getStats(): CognitiveStats {
        return { ...this.stats };
    }

    // ================= PUBLIC API =================
    getTraces(): CognitiveTrace[] {
        return [...this.traces];
    }

    getTrace(id: string): CognitiveTrace | undefined {
        return this.traces.find((t) => t.id === id);
    }

    deleteTrace(id: string) {
        this.traces = this.traces.filter((t) => t.id !== id);
        this.activeTraces.delete(id);
        this.deps.traceStore
            .deleteTrace(id)
            .catch((e) => LOGGER.error('CognitiveService', 'Delete trace failed', { error: e }));
        this.throttledEmit();
    }

    clearTraces() {
        this.traces = [];
        this.activeTraces.clear();
        this.deps.traceStore
            .clear()
            .catch((e) => LOGGER.error('CognitiveService', 'Clear traces failed', { error: e }));
        this.throttledEmit();
    }

    // ================= EXECUTION =================
    async executeAgentNode(
        node: ISNode,
        data: NodeContext,
        externalSignal?: AbortSignal,
    ): Promise<string> {
        const input = this.buildPrompt(node, data);
        const alternatives = this.evaluateAlternatives(node, data, input);

        if (!alternatives.length) throw new Error('No viable execution alternatives');

        const decision = this.makeDecision(alternatives);

        this.deps.eventBus.emit(EVENTS.COGNITIVE_DECISION_MADE, decision);

        return this.executeWithFallback(decision, node, data, externalSignal);
    }

    private buildPrompt(node: ISNode, data: NodeContext): string {
        const systemPrompt =
            typeof node.config.systemPrompt === 'string' ? node.config.systemPrompt : '';
        const output = typeof data.output === 'string' ? data.output : '';
        return `${sanitizePromptVar(systemPrompt)}\n\n${sanitizePromptVar(output)}`;
    }

    private evaluateAlternatives(
        node: ISNode,
        data: NodeContext,
        input: string,
    ): DecisionAlternative[] {
        const strategy = typeof data.strategy === 'string' ? data.strategy : 'auto';
        const providers = this.deps.routerService.getRankedProviders(
            strategy,
            input,
            undefined,
            node.id,
        );
        if (!providers || providers.length === 0) return [];
        return providers.map(
            (
                p: {
                    provider?: string;
                    name?: string;
                    model?: string;
                    score?: number;
                    key?: string;
                },
                i: number,
            ) => ({
                id: `alt-${i}`,
                label: `${p.provider ?? p.name ?? 'unknown'}/${p.model ?? 'unknown'}`,
                score: p.score ?? 0.5,
                reasoning: `Router score: ${(p.score ?? 0.5).toFixed(2)}`,
                metadata: {
                    key: {
                        provider: p.provider ?? p.name ?? '',
                        model: p.model ?? '',
                        key: p.key ?? '',
                    },
                },
            }),
        );
    }

    private makeDecision(alts: DecisionAlternative[]): DecisionAlternative {
        return alts[0]!;
    }

    // P0-4: hard timeout for any single adapter call (30s)
    private static readonly ADAPTER_TIMEOUT_MS = 30_000;

    private async executeWithFallback(
        decision: DecisionAlternative,
        node: ISNode,
        data: NodeContext,
        externalSignal?: AbortSignal,
    ): Promise<string> {
        const keyMeta = decision.metadata?.key as
            { provider: string; model: string; key: string } | undefined;

        if (!keyMeta) return 'error';

        const adapter = this.deps.adapterRegistry.getAdapter(keyMeta.provider!);
        if (!adapter) throw new Error('No adapter');

        const messages: AdapterMessage[] = [
            { role: 'user', content: this.buildPrompt(node, data) },
        ];

        let output = '';
        let buffer = '';

        // P0-4: AbortController for proper HTTP cancellation on timeout
        const abortController = new AbortController();
        const onExternalAbort = () =>
            abortController.abort(externalSignal?.reason || new Error('CancelledByParent'));
        if (externalSignal && !externalSignal.aborted) {
            externalSignal.addEventListener('abort', onExternalAbort, { once: true });
        }
        const timeoutTimer = setTimeout(
            () =>
                abortController.abort(
                    new Error(
                        `Provider ${keyMeta.provider} timeout after ${CognitiveService.ADAPTER_TIMEOUT_MS}ms`,
                    ),
                ),
            CognitiveService.ADAPTER_TIMEOUT_MS,
        );

        try {
            if (adapter.streamMessage) {
                await adapter.streamMessage(
                    messages,
                    keyMeta.model!,
                    keyMeta.key!,
                    (chunk) => {
                        buffer += chunk;
                        if (output.length < this.MAX_OUTPUT_LENGTH) {
                            output += chunk.slice(0, this.MAX_OUTPUT_LENGTH - output.length);
                        }
                        if (buffer.length > this.MAX_CHUNK_BUFFER) {
                            buffer = buffer.slice(-this.MAX_CHUNK_BUFFER);
                        }
                    },
                    abortController.signal,
                );
            } else {
                const res = await adapter.sendMessage(
                    messages,
                    keyMeta.model!,
                    keyMeta.key!,
                    abortController.signal,
                );
                output = res.content;
            }
        } finally {
            clearTimeout(timeoutTimer);
            if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
        }

        const tokens = estimateTokens(output.slice(-this.MAX_CHUNK_BUFFER));

        const roleId = (node.config?.roleId as string | undefined) || 'default';
        this.deps.roleService.recordRoleUsage?.(roleId, true, 0, tokens);

        return output;
    }
}
