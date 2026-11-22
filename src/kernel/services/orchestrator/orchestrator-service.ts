/**
 * Unified mission orchestrator.
 *
 * Decomposes a goal into a dependency DAG (LLM-generated when available,
 * deterministic fallback otherwise), executes ready nodes level-by-level with
 * bounded concurrency, and feeds each node the outputs of its dependencies.
 * Executor injection keeps this service LLM/agent-agnostic.
 */
import type {
    IOrchestratorService,
    MissionExecutor,
    MissionNode,
    MissionPlan,
    MissionResult,
    MissionArtifact,
    NodePolicy,
    CancellationRequest,
} from '../../contracts/orchestrator';
import type { IEventBus } from '../../types/interfaces';
import type { DispatchAssignment } from '../../contracts/dispatcher';
import type { IMissionMetricsService } from '../../contracts/mission-metrics';
import type { IMissionLedgerService } from '../../contracts/mission-ledger';
import type { IRunHistoryService, RunHistoryStep } from '../../contracts/run-history';
const MAX_NODES = 12;
const MAX_CONCURRENCY = 3;

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${++seq}`;

export class OrchestratorService implements IOrchestratorService {
    constructor(
        private events: IEventBus,
        private llm?: {
            chat(messages: Array<{ role: string; content: string }>): Promise<{ content: string }>;
        },
        private metrics?: IMissionMetricsService,
        private ledger?: IMissionLedgerService,
        private policies: Record<string, NodePolicy> = {},
        private history?: IRunHistoryService,
    ) {}
    private cancellation: CancellationRequest | null = null;
    private resultCache = new Map<string, MissionArtifact>();

    /** Cooperatively stop an in-flight mission with a human-readable reason. */
    cancel(reason: string): void {
        this.cancellation = { reason, requestedAt: Date.now() };
    }

    clearCancellation(): void {
        this.cancellation = null;
    }

    /** Get the active cancellation request, if any. */
    getCancellation(): CancellationRequest | null {
        return this.cancellation;
    }

    async init(): Promise<void> {}

    async destroy(): Promise<void> {}

    async plan(goal: string): Promise<MissionPlan> {
        const llmPlan = await this.planWithLlm(goal);
        const nodes = llmPlan ?? this.planFallback(goal);
        return { id: nextId('mission'), goal, nodes, createdAt: Date.now() };
    }

    private async planWithLlm(goal: string): Promise<MissionNode[] | null> {
        if (!this.llm) return null;
        try {
            const res = await this.llm.chat([
                {
                    role: 'system',
                    content:
                        'Decompose the goal into a DAG of at most 8 concrete subtasks. ' +
                        'Reply ONLY with JSON: [{"id":"t1","description":"...","dependsOn":[],"role":"..."}]. ' +
                        'dependsOn lists IDs of prerequisite tasks; use [] when none. No prose.',
                },
                { role: 'user', content: goal },
            ]);
            const start = res.content.indexOf('[');
            const end = res.content.lastIndexOf(']');
            if (start < 0 || end <= start) return null;
            const parsed = JSON.parse(res.content.slice(start, end + 1)) as unknown;
            if (!Array.isArray(parsed)) return null;
            const nodes: MissionNode[] = [];
            for (const raw of parsed.slice(0, MAX_NODES)) {
                if (!raw || typeof raw !== 'object') continue;
                const o = raw as Record<string, unknown>;
                if (typeof o.description !== 'string' || !o.description.trim()) continue;
                nodes.push({
                    id: typeof o.id === 'string' ? o.id : nextId('node'),
                    description: o.description.trim(),
                    dependsOn: Array.isArray(o.dependsOn)
                        ? o.dependsOn.filter((d): d is string => typeof d === 'string')
                        : [],
                    assignee:
                        typeof o.role === 'string' && o.role.trim()
                            ? { role: o.role.trim() }
                            : undefined,
                    status: 'pending',
                });
            }
            return this.sanitizeDag(nodes);
        } catch {
            return null;
        }
    }

    /** Deterministic 3-stage fallback when no LLM is configured. */
    private planFallback(goal: string): MissionNode[] {
        return [
            {
                id: 't1',
                description: `Research context for: ${goal}`,
                dependsOn: [],
                status: 'pending',
            },
            {
                id: 't2',
                description: `Draft solution for: ${goal}`,
                dependsOn: ['t1'],
                status: 'pending',
            },
            {
                id: 't3',
                description: `Verify the solution for: ${goal}`,
                dependsOn: ['t2'],
                status: 'pending',
            },
        ];
    }

    /**
     * Drop dangling/duplicate deps and break real cycles with DFS: an edge
     * pointing into the current recursion stack is removed. After this pass
     * the graph is guaranteed acyclic and every node can eventually execute.
     */
    private sanitizeDag(nodes: MissionNode[]): MissionNode[] {
        const ids = new Set(nodes.map((n) => n.id));
        const deps = new Map<string, string[]>();
        for (const n of nodes) {
            const seen = new Set<string>();
            deps.set(
                n.id,
                n.dependsOn.filter((d) => {
                    if (d === n.id || !ids.has(d) || seen.has(d)) return false;
                    seen.add(d);
                    return true;
                }),
            );
        }

        const visiting = new Set<string>();
        const done = new Set<string>();
        const visit = (id: string) => {
            if (done.has(id) || visiting.has(id)) return;
            visiting.add(id);
            for (const dep of deps.get(id) ?? []) {
                if (visiting.has(dep)) {
                    // Back-edge: cut dep → id, keeping id executable.
                    deps.set(
                        id,
                        (deps.get(id) ?? []).filter((d) => d !== dep),
                    );
                } else if (!done.has(dep)) {
                    visit(dep);
                }
            }
            visiting.delete(id);
            done.add(id);
        };
        for (const n of nodes) visit(n.id);

        return nodes.map((n) => ({ ...n, dependsOn: deps.get(n.id) ?? [] }));
    }

    async run(goal: string, executor: MissionExecutor): Promise<MissionResult> {
        return this.executePlan(await this.plan(goal), executor);
    }

    async runWithDispatcher(
        goal: string,
        executor: MissionExecutor,
        dispatcher: { assign(nodes: MissionNode[]): DispatchAssignment[] },
    ): Promise<MissionResult & { assignments: DispatchAssignment[] }> {
        const plan = await this.plan(goal);
        const assignments = dispatcher.assign(plan.nodes);
        const byNode = new Map(assignments.map((a) => [a.nodeId, a]));
        const result = await this.executePlan(plan, (node, ctx) =>
            executor({ ...node, assignee: { role: byNode.get(node.id)?.agent.role } }, ctx),
        );
        return { ...result, assignments };
    }

    /** Shared DAG execution core used by run() and runWithDispatcher(). */
    private async executePlan(
        plan: MissionPlan,
        executor: MissionExecutor,
    ): Promise<MissionResult> {
        const goal = plan.goal;
        this.resultCache.clear();
        const startedAt = Date.now();
        const steps: RunHistoryStep[] = [];
        const ledgerId = this.ledger?.begin(goal);
        if (ledgerId && this.ledger) {
            this.ledger.setTasks(
                ledgerId,
                plan.nodes.map((n) => ({
                    id: n.id,
                    description: n.description,
                    status: n.status === 'done' ? 'done' : 'pending',
                    dependsOn: [...n.dependsOn],
                })),
            );
        }
        let firstArtifactMs = 0;
        const outputs: Record<string, string> = {};
        const artifacts: MissionArtifact[] = [];
        const artifactsByNode = new Map<string, MissionArtifact>();
        const failedNodeIds: string[] = [];
        let remaining = [...plan.nodes];

        while (remaining.length > 0) {
            if (this.cancellation) break;
            const ready = remaining.filter((n) =>
                n.dependsOn.every((d) => plan.nodes.find((x) => x.id === d)?.status === 'done'),
            );
            if (ready.length === 0) break;
            const wave = ready.slice(0, MAX_CONCURRENCY);
            await Promise.all(
                wave.map(async (node) => {
                    node.status = 'running';
                    const dependencyOutputs: Record<string, string> = {};
                    const dependencyArtifacts: MissionArtifact[] = [];
                    for (const depId of node.dependsOn) {
                        if (outputs[depId] !== undefined)
                            dependencyOutputs[depId] = outputs[depId]!;
                        const art = artifactsByNode.get(depId);
                        if (art) dependencyArtifacts.push(art);
                    }
                    const policy = this.policies[node.id] ?? {};
                    const cacheKey = policy.cacheKey
                        ? policy.cacheKey(node, dependencyOutputs)
                        : undefined;
                    const cached = cacheKey ? this.resultCache.get(cacheKey) : undefined;
                    try {
                        let rawResult: string | MissionArtifact;
                        if (cached) {
                            rawResult = cached;
                        } else {
                            const attempts = Math.max(1, policy.maxAttempts ?? 1);
                            let lastError: unknown;
                            for (let attempt = 0; attempt < attempts; attempt++) {
                                if (this.cancellation) throw new Error('mission cancelled');
                                try {
                                    rawResult = await executor(node, {
                                        goal,
                                        dependencyOutputs,
                                        dependencyArtifacts,
                                    });
                                    lastError = undefined;
                                    break;
                                } catch (e) {
                                    lastError = e;
                                    if (attempt + 1 < attempts && policy.retryDelayMs) {
                                        await new Promise((r) =>
                                            setTimeout(r, policy.retryDelayMs),
                                        );
                                    }
                                }
                            }
                            if (lastError) throw lastError;
                        }
                        const result = rawResult!;
                        // The DAG is the authority on node identity: never trust
                        // a nodeId supplied by the executor. Mismatches are
                        // normalized to the actual node and recorded in meta.
                        const rawArtifact: MissionArtifact =
                            typeof result === 'string'
                                ? {
                                      nodeId: node.id,
                                      type: 'text',
                                      content: result,
                                      createdAt: Date.now(),
                                  }
                                : result;
                        const idMismatch = rawArtifact.nodeId !== node.id;
                        const artifact: MissionArtifact = {
                            ...rawArtifact,
                            nodeId: node.id,
                            meta: {
                                ...(rawArtifact.meta ?? {}),
                                ...(idMismatch ? { claimedNodeId: rawArtifact.nodeId } : {}),
                            },
                        };
                        artifacts.push(artifact);
                        artifactsByNode.set(node.id, artifact);
                        if (cacheKey) this.resultCache.set(cacheKey, artifact);
                        if (ledgerId && this.ledger) {
                            this.ledger.addFact(ledgerId, artifact.content.slice(0, 200), node.id);
                            this.ledger.recordStep(ledgerId, node.id, true);
                        }
                        node.status = 'done';
                        node.result = artifact.content;
                        outputs[node.id] = artifact.content;
                        steps.push({
                            nodeId: node.id,
                            input: { ...dependencyOutputs },
                            output: { [node.id]: artifact.content },
                            timestamp: Date.now(),
                        });
                        if (firstArtifactMs === 0) firstArtifactMs = Date.now() - startedAt;
                    } catch (e) {
                        node.status = 'failed';
                        node.result = e instanceof Error ? e.message : String(e);
                        steps.push({
                            nodeId: node.id,
                            input: { ...dependencyOutputs },
                            output: { error: node.result },
                            timestamp: Date.now(),
                        });
                        if (ledgerId && this.ledger)
                            this.ledger.recordStep(ledgerId, node.id, false);
                        failedNodeIds.push(node.id);
                    }
                }),
            );
            remaining = remaining.filter((n) => !wave.some((w) => w.id === n.id));
        }
        for (const n of remaining) n.status = 'skipped';

        // A mission with unexecuted nodes is NOT completed — otherwise a
        // malformed/cyclic plan would silently report success.
        const status =
            failedNodeIds.length === 0 && remaining.length === 0 && !this.cancellation
                ? 'completed'
                : 'failed';
        this.events.emit('orchestrator:mission-finished', {
            missionId: plan.id,
            goal,
            status,
            completed: Object.keys(outputs).length,
            failed: failedNodeIds.length,
        });
        this.metrics?.record({
            missionId: plan.id,
            goal,
            status,
            replans: 0,
            costUsd: 0,
            firstArtifactMs,
            durationMs: Date.now() - startedAt,
        });
        if (ledgerId) this.ledger?.finish(ledgerId);
        if (this.history) {
            await this.history.save({
                runId: plan.id,
                goal,
                status,
                startedAt,
                finishedAt: Date.now(),
                steps,
                artifacts: artifacts.map((a) => ({
                    nodeId: a.nodeId,
                    type: a.type,
                    content: a.content,
                    createdAt: a.createdAt,
                })),
            });
        }
        return { missionId: plan.id, goal, status, outputs, artifacts, failedNodeIds };
    }
}
