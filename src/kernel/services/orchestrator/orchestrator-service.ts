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
} from '../../contracts/orchestrator';
import type { IEventBus } from '../../types/interfaces';
import type { DispatchAssignment } from '../../contracts/dispatcher';
import type { IMissionMetricsService } from '../../contracts/mission-metrics';
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
    ) {}

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

    /** Drop dangling dependencies and break cycles by keeping earlier nodes. */
    private sanitizeDag(nodes: MissionNode[]): MissionNode[] {
        const ids = new Set(nodes.map((n) => n.id));
        return nodes.map((n) => {
            const seenDeps = new Set<string>();
            const dependsOn = n.dependsOn.filter((d) => {
                if (d === n.id || !ids.has(d) || seenDeps.has(d)) return false;
                seenDeps.add(d);
                return true;
            });
            return { ...n, dependsOn };
        });
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
        const startedAt = Date.now();
        let firstArtifactMs = 0;
        const outputs: Record<string, string> = {};
        const failedNodeIds: string[] = [];
        let remaining = [...plan.nodes];

        while (remaining.length > 0) {
            const ready = remaining.filter((n) =>
                n.dependsOn.every((d) => plan.nodes.find((x) => x.id === d)?.status === 'done'),
            );
            if (ready.length === 0) break;
            const wave = ready.slice(0, MAX_CONCURRENCY);
            await Promise.all(
                wave.map(async (node) => {
                    node.status = 'running';
                    const dependencyOutputs: Record<string, string> = {};
                    for (const depId of node.dependsOn) {
                        if (outputs[depId] !== undefined)
                            dependencyOutputs[depId] = outputs[depId]!;
                    }
                    try {
                        const result = await executor(node, { goal, dependencyOutputs });
                        node.status = 'done';
                        node.result = result;
                        outputs[node.id] = result;
                        if (firstArtifactMs === 0) firstArtifactMs = Date.now() - startedAt;
                    } catch (e) {
                        node.status = 'failed';
                        node.result = e instanceof Error ? e.message : String(e);
                        failedNodeIds.push(node.id);
                    }
                }),
            );
            remaining = remaining.filter((n) => !wave.some((w) => w.id === n.id));
        }
        for (const n of remaining) n.status = 'skipped';

        const status = failedNodeIds.length === 0 ? 'completed' : 'failed';
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
        return { missionId: plan.id, goal, status, outputs, failedNodeIds };
    }
}
