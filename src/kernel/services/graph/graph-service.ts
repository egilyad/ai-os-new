/**
 * GraphService — Wave 3 runtime (additive, Builder/EventSourcing untouched).
 *
 * Synchronous driver (no workers): runGraph drives nodes until pause/completion.
 * approve()/restoreCheckpoint() resume driving. Every node visit writes a
 * checkpoint + decision entry + event — durable + auditable by construction.
 */
import type { IEventBus } from '../../types/interfaces';
import type { GraphRepository } from '../../dal/graph-repository';
import type {
    DecisionEntry,
    DefineGraphInput,
    GraphCheckpoint,
    GraphDefinition,
    GraphRun,
    GraphThread,
    HitlRequest,
    IGraphLlmPort,
    IGraphService,
    IGraphDelegates,
    OrchestrationMode,
} from '../../contracts/graph';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import { buildModeDefinition } from './graph-modes';

const LOGGER = rootLogger.child('GraphService');

function now(): number {
    return Date.now();
}

function matchCondition(condition: string | undefined, state: Record<string, unknown>): boolean {
    if (!condition) return true;
    const neq = condition.indexOf('!=');
    if (neq >= 0) {
        const key = condition.slice(0, neq).trim();
        const val = condition.slice(neq + 2).trim();
        return String(state[key] ?? '') !== val;
    }
    const eq = condition.indexOf('=');
    if (eq >= 0) {
        const key = condition.slice(0, eq).trim();
        const val = condition.slice(eq + 1).trim();
        return String(state[key] ?? '') === val;
    }
    return Boolean(state[condition.trim()]);
}

export interface GraphServiceDeps {
    repository: GraphRepository;
    eventBus: IEventBus;
    llm?: IGraphLlmPort;
    delegates?: IGraphDelegates;
}

export class GraphService implements IGraphService {
    private repo: GraphRepository;
    private events: IEventBus;
    private llm?: IGraphLlmPort;
    private delegates: IGraphDelegates;

    constructor(deps: GraphServiceDeps) {
        this.repo = deps.repository;
        this.events = deps.eventBus;
        this.llm = deps.llm;
        this.delegates = deps.delegates ?? {};
    }

    async init(): Promise<void> {
        LOGGER.info('GraphService', 'init', {});
    }

    async destroy(): Promise<void> {
        // no background work
    }

    /** GAP E.1 — attach the real LLM port (task nodes + reflections). */
    setLlmPort(llm: IGraphLlmPort): void {
        this.llm = llm;
    }

    // ── Definitions ──
    async defineGraph(input: DefineGraphInput): Promise<GraphDefinition> {
        const nodeIds = new Set(input.nodes.map((n) => n.id));
        if (!nodeIds.has(input.entryNodeId)) {
            throw new Error(`Entry node not found: ${input.entryNodeId}`);
        }
        for (const e of input.edges) {
            if (!nodeIds.has(e.from)) throw new Error(`Edge ${e.id} has unknown from: ${e.from}`);
            if (!nodeIds.has(e.to)) throw new Error(`Edge ${e.id} has unknown to: ${e.to}`);
        }
        const t = now();
        const def: GraphDefinition = {
            id: genId('graph'),
            name: input.name,
            description: input.description,
            mode: input.mode ?? 'graph',
            nodes: input.nodes.map((n) => ({ ...n, config: n.config ? { ...n.config } : undefined })),
            edges: input.edges.map((e) => ({ ...e })),
            entryNodeId: input.entryNodeId,
            reflectEvery: input.reflectEvery ?? 0,
            maxSteps: input.maxSteps ?? 50,
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putGraph(def);
        this.events.emit(EVENTS.GRAPH_DEFINED, {
            graphId: def.id,
            name: def.name.slice(0, 160),
            mode: def.mode,
            nodeCount: def.nodes.length,
        });
        return def;
    }

    async getGraph(id: string): Promise<GraphDefinition | null> {
        return this.repo.getGraph(id);
    }

    async listGraphs(): Promise<GraphDefinition[]> {
        return this.repo.listGraphs();
    }

    async deleteGraph(id: string): Promise<void> {
        await this.repo.deleteGraph(id);
    }

    async buildModeGraph(
        mode: OrchestrationMode,
        params: Record<string, unknown> = {},
    ): Promise<GraphDefinition> {
        const input = buildModeDefinition(mode, params);
        return this.defineGraph(input);
    }

    // ── Runs ──
    async runGraph(graphId: string, input: Record<string, unknown> = {}): Promise<GraphRun> {
        const def = await this.repo.getGraph(graphId);
        if (!def) throw new Error(`Graph not found: ${graphId}`);
        const t = now();
        const run: GraphRun = {
            id: genId('grun'),
            graphId,
            status: 'running',
            currentNodeId: def.entryNodeId,
            state: { ...input },
            visited: [],
            stepCount: 0,
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putRun(run);
        this.events.emit(EVENTS.GRAPH_STARTED, { runId: run.id, graphId });
        return this.drive(def, run);
    }

    async getRun(runId: string): Promise<GraphRun | null> {
        return this.repo.getRun(runId);
    }

    async listRuns(graphId?: string): Promise<GraphRun[]> {
        return this.repo.listRuns(graphId);
    }

    // ── Threads (F.1) ──
    async startThread(graphId: string): Promise<GraphThread> {
        const def = await this.requireGraph(graphId);
        void def;
        const t = now();
        const thread: GraphThread = {
            id: genId('thread'),
            graphId,
            runIds: [],
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putThread(thread);
        return thread;
    }

    async postToThread(threadId: string, input: Record<string, unknown> = {}): Promise<GraphRun> {
        const thread = await this.repo.getThread(threadId);
        if (!thread) throw new Error(`Thread not found: ${threadId}`);
        const run = await this.runGraph(thread.graphId, { ...input, threadId });
        thread.runIds.push(run.id);
        thread.updatedAt = now();
        await this.repo.putThread(thread);
        return run;
    }

    async listThreads(graphId?: string): Promise<GraphThread[]> {
        return this.repo.listThreads(graphId);
    }

    // ── HITL ──
    async interrupt(runId: string, prompt = 'Operator interrupt'): Promise<HitlRequest> {
        const run = await this.requireRun(runId);
        if (run.status !== 'running') throw new Error(`Run ${runId} is ${run.status}`);
        run.status = 'paused';
        const req: HitlRequest = {
            runId,
            nodeId: run.currentNodeId ?? '',
            prompt,
            stateSnapshot: { ...run.state },
            createdAt: now(),
        };
        run.pendingHitl = req;
        run.updatedAt = now();
        await this.repo.putRun(run);
        this.events.emit(EVENTS.GRAPH_HITL, { runId, nodeId: req.nodeId, prompt: prompt.slice(0, 280) });
        return req;
    }

    async approve(runId: string, editedState?: Record<string, unknown>): Promise<GraphRun> {
        const run = await this.requireRun(runId);
        if (run.status !== 'paused') throw new Error(`Run ${runId} is not paused`);
        if (editedState) run.state = { ...run.state, ...editedState };
        if (run.pendingHitl) run.state[`_approved:${run.pendingHitl.nodeId}`] = 1;
        run.pendingHitl = undefined;
        run.status = 'running';
        run.updatedAt = now();
        await this.repo.putRun(run);
        this.events.emit(EVENTS.GRAPH_APPROVED, { runId });
        const def = await this.requireGraph(run.graphId);
        return this.drive(def, run);
    }

    async reject(runId: string, reason = 'Rejected by operator'): Promise<GraphRun> {
        const run = await this.requireRun(runId);
        if (run.status !== 'paused') throw new Error(`Run ${runId} is not paused`);
        await this.logDecision(run, run.currentNodeId ?? '', 'rejected by operator', reason, []);
        run.pendingHitl = undefined;
        run.status = 'aborted';
        run.error = reason;
        run.updatedAt = now();
        await this.repo.putRun(run);
        this.events.emit(EVENTS.GRAPH_REJECTED, { runId, reason: reason.slice(0, 280) });
        return run;
    }

    async editState(runId: string, patch: Record<string, unknown>): Promise<GraphRun> {
        const run = await this.requireRun(runId);
        if (run.status !== 'paused' && run.status !== 'running') {
            throw new Error(`Run ${runId} is ${run.status}`);
        }
        run.state = { ...run.state, ...patch };
        run.updatedAt = now();
        await this.repo.putRun(run);
        return run;
    }

    async abortRun(runId: string): Promise<void> {
        const run = await this.requireRun(runId);
        run.status = 'aborted';
        run.pendingHitl = undefined;
        run.updatedAt = now();
        await this.repo.putRun(run);
        this.events.emit(EVENTS.GRAPH_ABORTED, { runId });
    }

    // ── Checkpointing / time-travel ──
    async listCheckpoints(runId: string): Promise<GraphCheckpoint[]> {
        await this.requireRun(runId);
        return this.repo.listCheckpoints(runId);
    }

    async restoreCheckpoint(runId: string, checkpointId: string): Promise<GraphRun> {
        const run = await this.requireRun(runId);
        const cp = await this.repo.getCheckpoint(checkpointId);
        if (!cp || cp.runId !== runId) throw new Error(`Checkpoint not found: ${checkpointId}`);
        run.state = { ...cp.state };
        run.currentNodeId = cp.nodeId;
        run.stepCount = cp.stepIndex;
        run.visited = run.visited.slice(0, cp.stepIndex);
        run.status = 'paused';
        run.pendingHitl = {
            runId,
            nodeId: cp.nodeId,
            prompt: `Restored to checkpoint ${cp.stepIndex} (${cp.label ?? cp.id}). Approve to resume.`,
            stateSnapshot: { ...cp.state },
            createdAt: now(),
        };
        run.updatedAt = now();
        await this.repo.putRun(run);
        this.events.emit(EVENTS.GRAPH_RESTORED, { runId, checkpointId, stepIndex: cp.stepIndex });
        return run;
    }

    // ── Reflection + Decision Log ──
    async reflect(runId: string): Promise<string> {
        const run = await this.requireRun(runId);
        const text = await this.doReflect(run);
        run.state['lastReflection'] = text;
        run.updatedAt = now();
        await this.repo.putRun(run);
        await this.checkpoint(run, run.currentNodeId ?? '', `reflection@${run.stepCount}`);
        this.events.emit(EVENTS.GRAPH_REFLECTED, { runId, stepCount: run.stepCount });
        return text;
    }

    async decisionLog(runId: string): Promise<DecisionEntry[]> {
        await this.requireRun(runId);
        return this.repo.listDecisions(runId);
    }

    // ── Driver ──
    private async drive(def: GraphDefinition, run: GraphRun): Promise<GraphRun> {
        const byId = new Map(def.nodes.map((n) => [n.id, n]));
        const outgoing = new Map<string, typeof def.edges>();
        for (const e of def.edges) {
            const list = outgoing.get(e.from) ?? [];
            list.push(e);
            outgoing.set(e.from, list);
        }
        // Seed swarm roots: nodes with no incoming edges also get visited.
        // Resume: a paused run restores its pending queue from state.
        const hasIncoming = new Set(def.edges.map((e) => e.to));
        const roots = def.nodes.filter((n) => !hasIncoming.has(n.id) && n.id !== def.entryNodeId);
        const restored = Array.isArray(run.state['_queue'])
            ? (run.state['_queue'] as string[]).filter((id) => byId.has(id))
            : null;
        const queue: string[] = restored ?? [run.currentNodeId ?? def.entryNodeId, ...roots.map((r) => r.id)];
        if (restored) delete run.state['_queue'];
        const maxSteps = def.maxSteps ?? 50;

        // F.1 — Pregel-style super-steps: each wave executes concurrently,
        // outputs merge deterministically in wave order afterwards.
        while (queue.length > 0) {
            if (run.stepCount >= maxSteps) {
                run.status = 'failed';
                run.error = `maxSteps exceeded (${maxSteps})`;
                run.updatedAt = now();
                await this.repo.putRun(run);
                this.events.emit(EVENTS.GRAPH_FAILED, { runId: run.id, error: run.error });
                return run;
            }
            const waveIds = [...new Set(queue.splice(0))];
            const wave = waveIds
                .map((id) => byId.get(id))
                .filter((n): n is GraphDefinition['nodes'][number] => Boolean(n));
            if (wave.length === 0) continue;

            // HITL gate first (deterministic: first ungated HITL node in wave order).
            // F.1 fix: approved nodes never re-pause (approve() marks `_approved:<id>`).
            const hitlNode = wave.find(
                (n) => (n.requireApproval || n.kind === 'human') && !run.state[`_approved:${n.id}`],
            );
            if (hitlNode) {
                const rest = wave.filter((n) => n.id !== hitlNode.id).map((n) => n.id);
                run.status = 'paused';
                run.currentNodeId = hitlNode.id;
                run.pendingHitl = {
                    runId: run.id,
                    nodeId: hitlNode.id,
                    prompt: `Approval required: ${hitlNode.label}`,
                    stateSnapshot: { ...run.state },
                    createdAt: now(),
                };
                run.state['_queue'] = [...rest, ...queue];
                run.updatedAt = now();
                await this.repo.putRun(run);
                await this.checkpoint(run, hitlNode.id, `hitl@${run.stepCount}`);
                this.events.emit(EVENTS.GRAPH_HITL, { runId: run.id, nodeId: hitlNode.id, prompt: hitlNode.label.slice(0, 280) });
                return run;
            }

            run.currentNodeId = wave[wave.length - 1]!.id;
            const results = await Promise.all(
                wave.map(async (node) => {
                    try {
                        return { ok: true as const, output: await this.executeNode(node, run) };
                    } catch (e) {
                        return { ok: false as const, output: '', error: e instanceof Error ? e.message : String(e) };
                    }
                }),
            );

            const nextIds: string[] = [];
            for (let i = 0; i < wave.length; i++) {
                const node = wave[i]!;
                const res = results[i]!;
                if (!res.ok) {
                    LOGGER.warn('GraphService', 'node execution failed', { nodeId: node.id, error: res.error });
                    await this.logDecision(run, node.id, `failed: ${res.error}`, `Node "${node.label}" failed`, []);
                    continue;
                }
                const output = res.output;
                run.visited.push(node.id);
                run.stepCount += 1;
                run.state[`out:${node.id}`] = output;
                run.state['lastOutput'] = output;
                run.updatedAt = now();
                await this.repo.putRun(run);
                await this.checkpoint(run, node.id, `step@${run.stepCount}`);
                await this.logDecision(
                    run,
                    node.id,
                    output.slice(0, 500),
                    `Executed ${node.kind} node "${node.label}"`,
                    this.rejectedBranches(def, node.id, run.state),
                );
                this.events.emit(EVENTS.GRAPH_NODE, { runId: run.id, nodeId: node.id, kind: node.kind });

                // Periodic reflection.
                if (def.reflectEvery && def.reflectEvery > 0 && run.stepCount % def.reflectEvery === 0) {
                    const text = await this.doReflect(run);
                    run.state['lastReflection'] = text;
                    await this.repo.putRun(run);
                    this.events.emit(EVENTS.GRAPH_REFLECTED, { runId: run.id, stepCount: run.stepCount });
                }

                // Static routing + F.1 Send dispatch (state[`send:<nodeId>`] = string[]).
                const staticNexts = (outgoing.get(node.id) ?? []).filter((e) =>
                    matchCondition(e.condition, run.state),
                );
                for (const e of staticNexts) nextIds.push(e.to);
                const sendKey = `send:${node.id}`;
                const sendTargets = run.state[sendKey];
                if (Array.isArray(sendTargets)) {
                    for (const target of sendTargets) {
                        if (typeof target === 'string' && byId.has(target)) nextIds.push(target);
                    }
                    delete run.state[sendKey];
                }
            }
            for (const id of nextIds) {
                if (!queue.includes(id)) queue.push(id);
            }
            if (queue.length === 0) {
                delete run.state['_queue'];
                run.status = 'completed';
                run.currentNodeId = null;
                run.result = typeof run.state['lastOutput'] === 'string'
                    ? (run.state['lastOutput'] as string)
                    : JSON.stringify(run.state['lastOutput'] ?? {});
                run.updatedAt = now();
                await this.repo.putRun(run);
                this.events.emit(EVENTS.GRAPH_COMPLETED, { runId: run.id, steps: run.stepCount });
                return run;
            }
        }
        delete run.state['_queue'];
        run.status = 'completed';
        run.currentNodeId = null;
        run.updatedAt = now();
        await this.repo.putRun(run);
        this.events.emit(EVENTS.GRAPH_COMPLETED, { runId: run.id, steps: run.stepCount });
        return run;
    }

    private async executeNode(node: GraphDefinition['nodes'][number], run: GraphRun): Promise<string> {
        const cfg = node.config ?? {};
        try {
            switch (node.kind) {
                case 'task': {
                    if (typeof cfg['forge'] === 'boolean' && cfg['forge'] && this.delegates.forgeDraft) {
                        return await this.delegates.forgeDraft(String(cfg['topic'] ?? node.label));
                    }
                    if (this.llm) {
                        return await this.llm.runTask({ label: node.label, state: run.state });
                    }
                    const topic = typeof cfg['topic'] === 'string' ? cfg['topic'] : node.label;
                    return `[${node.label}] done: ${topic}`;
                }
                case 'crew': {
                    const crewId = typeof cfg['crewId'] === 'string' ? cfg['crewId'] : undefined;
                    const topic = typeof cfg['topic'] === 'string' ? cfg['topic'] : node.label;
                    if (crewId && this.delegates.runCrew) {
                        return await this.delegates.runCrew(crewId, topic);
                    }
                    return `[${node.label}] crew-simulated: ${topic}`;
                }
                case 'council': {
                    const topic = typeof cfg['topic'] === 'string' ? cfg['topic'] : node.label;
                    if (this.delegates.runCouncil) {
                        return await this.delegates.runCouncil(topic);
                    }
                    return `[${node.label}] council-simulated: ${topic}`;
                }
                case 'reflection': {
                    return await this.doReflect(run);
                }
                case 'gate': {
                    const key = typeof cfg['key'] === 'string' ? cfg['key'] : 'route';
                    if (!(key in run.state)) run.state[key] = 'main';
                    return `gate:${key}=${String(run.state[key])}`;
                }
                case 'human': {
                    return 'human:approved';
                }
                case 'subgraph': {
                    // F.1 — nested graph execution (LangGraph subgraph analogue).
                    const childId = typeof cfg['graphId'] === 'string' ? cfg['graphId'] : undefined;
                    if (!childId) throw new Error('subgraph node needs config.graphId');
                    const depth = typeof run.state['_depth'] === 'number' ? run.state['_depth'] : 0;
                    if (depth >= 2) throw new Error('subgraph max nesting depth (2) exceeded');
                    const inputKeys = Array.isArray(cfg['inputKeys'])
                        ? (cfg['inputKeys'] as string[])
                        : undefined;
                    const childInput: Record<string, unknown> = { _depth: depth + 1 };
                    if (inputKeys) {
                        for (const k of inputKeys) {
                            if (k in run.state) childInput[k] = run.state[k];
                        }
                    } else if (typeof run.state['lastOutput'] !== 'undefined') {
                        childInput['input'] = run.state['lastOutput'];
                    }
                    const child = await this.runGraph(childId, childInput);
                    if (child.status === 'paused') {
                        throw new Error(
                            `subgraph ${childId} paused on HITL — remove human nodes from child graphs`,
                        );
                    }
                    if (child.status !== 'completed') {
                        throw new Error(`subgraph ${childId} ended ${child.status}`);
                    }
                    const outKey = typeof cfg['outputKey'] === 'string' ? cfg['outputKey'] : undefined;
                    if (outKey) run.state[outKey] = child.result ?? '';
                    return `subgraph:${childId} → ${String(child.result ?? '').slice(0, 500)}`;
                }
                default:
                    return `[${node.label}] ok`;
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            LOGGER.warn('GraphService', 'node execution failed', { nodeId: node.id, error: msg });
            return `[${node.label}] failed: ${msg}`;
        }
    }

    private async doReflect(run: GraphRun): Promise<string> {
        if (this.llm) {
            try {
                return await this.llm.reflect({ visited: [...run.visited], state: run.state });
            } catch (e) {
                LOGGER.warn('GraphService', 'llm reflect failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        const keys = Object.keys(run.state).filter((k) => !k.startsWith('out:'));
        return (
            `Reflection after ${run.stepCount} step(s): visited [${run.visited.join(' → ') || 'none'}]. ` +
            `State keys: ${keys.join(', ') || 'none'}. ` +
            `Last: ${String(run.state['lastOutput'] ?? 'n/a').slice(0, 300)}`
        );
    }

    private rejectedBranches(
        def: GraphDefinition,
        nodeId: string,
        state: Record<string, unknown>,
    ): string[] {
        return def.edges
            .filter((e) => e.from === nodeId && !matchCondition(e.condition, state))
            .map((e) => `${e.to}${e.condition ? ` (${e.condition})` : ''}`);
    }

    private async checkpoint(run: GraphRun, nodeId: string, label: string): Promise<void> {
        const cp: GraphCheckpoint = {
            id: genId('gcp'),
            runId: run.id,
            graphId: run.graphId,
            stepIndex: run.stepCount,
            nodeId,
            state: JSON.parse(JSON.stringify(run.state)) as Record<string, unknown>,
            label,
            createdAt: now(),
        };
        await this.repo.putCheckpoint(cp);
        this.events.emit(EVENTS.GRAPH_CHECKPOINT, { runId: run.id, stepIndex: cp.stepIndex, nodeId });
    }

    private async logDecision(
        run: GraphRun,
        nodeId: string,
        decision: string,
        why: string,
        rejected: string[],
    ): Promise<void> {
        const entry: DecisionEntry = {
            id: genId('gdec'),
            runId: run.id,
            graphId: run.graphId,
            nodeId,
            decision,
            why,
            rejected,
            createdAt: now(),
        };
        await this.repo.putDecision(entry);
    }

    private async requireRun(id: string): Promise<GraphRun> {
        const r = await this.repo.getRun(id);
        if (!r) throw new Error(`Graph run not found: ${id}`);
        return r;
    }

    private async requireGraph(id: string): Promise<GraphDefinition> {
        const g = await this.repo.getGraph(id);
        if (!g) throw new Error(`Graph not found: ${id}`);
        return g;
    }
}
