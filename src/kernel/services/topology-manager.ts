import type { ILifecycle } from '../contracts/lifecycle';
import type { IEventBus } from '../types/interfaces';
import { EVENTS } from '../events/event-names';
import type { OrchestrationService } from './orchestration-service';
import type { AgentHealthMonitor } from './agent-health-monitor';
import type { MetricsService } from './metrics-service';
import type { AgentService } from './agent-service';
import type { ISTopology, ISNode, ISEdge } from '../contracts/topology';

export interface TopologyManagerDeps {
    eventBus: IEventBus;
    orchestrator: OrchestrationService;
    agentHealthMonitor: AgentHealthMonitor;
    agentService: AgentService;
    metricsService: MetricsService;
}

const CLONE_COOLDOWN_MS = 5 * 60_000;

export class TopologyManager implements ILifecycle {
    private deps: TopologyManagerDeps;
    private unsubs: Array<() => void> = [];
    private checkInterval: ReturnType<typeof setInterval> | null = null;
    private enabled = true;
    private lastCloneAt = new Map<string, number>();
    lastEvaluationTime = 0;

    constructor(deps: TopologyManagerDeps) {
        this.deps = deps;
    }

    async init() {}
    private _started = false;

    async start() {
        if (this._started) return;
        this._started = true;
        this.unsubs.push(
            this.deps.eventBus.onSafe(EVENTS.AGENT_HEALTH_CHANGE, () => {
                this.evaluateTopology();
            }),
        );

        this.checkInterval = setInterval(() => {
            this.evaluateTopology();
        }, 60000);
    }

    destroy() {
        for (const u of this.unsubs) u();
        this.unsubs = [];
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.lastCloneAt.clear();
        this._started = false;
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    private hasRecentClone(agentId: string): boolean {
        const at = this.lastCloneAt.get(agentId);
        return at !== undefined && Date.now() - at < CLONE_COOLDOWN_MS;
    }

    private markClone(agentId: string) {
        this.lastCloneAt.set(agentId, Date.now());
    }

    private hasActiveDynamicClone(agentId: string, topology: ISTopology): boolean {
        return topology.nodes.some(
            (n) =>
                n.dynamic &&
                (n.id.startsWith(`${agentId}-clone`) || n.id.startsWith(`${agentId}-scale`)),
        );
    }

    private cloneNode(
        topology: ISTopology,
        source: ISNode,
        suffix: string,
        labelSuffix: string,
    ): ISNode {
        const cloneId = `${source.id}-${suffix}-${Date.now()}`;
        const cloneNode: ISNode = {
            ...source,
            id: cloneId,
            label: `${source.label} ${labelSuffix}`,
            dynamic: true,
        };
        topology.nodes.push(cloneNode);

        const incoming = topology.edges.filter((e) => e.to === source.id);
        const outgoing = topology.edges.filter((e) => e.from === source.id);
        const ts = Date.now();
        incoming.forEach((e) => {
            topology.edges.push({ ...e, id: `${e.id}-in-${ts}`, to: cloneId });
        });
        outgoing.forEach((e) => {
            topology.edges.push({ ...e, id: `${e.id}-out-${ts}`, from: cloneId });
        });

        this.markClone(source.id);
        return cloneNode;
    }

    private applyLowDiversityReroute(topology: ISTopology): boolean {
        const agents = topology.nodes.filter((n) => n.type === 'agent' && !n.dynamic);
        if (agents.length < 4) return false;

        const modelKey = (n: ISNode) =>
            `${n.config.provider || 'auto'}:${n.config.model || 'auto'}`;
        const counts = new Map<string, number>();
        for (const a of agents) {
            const k = modelKey(a);
            counts.set(k, (counts.get(k) || 0) + 1);
        }
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
        const [dominantKey, dominantCount] = sorted[0] || ['', 0];
        if (!dominantKey || dominantCount / agents.length < 0.75) return false;

        let alt = agents.find((a) => modelKey(a) !== dominantKey);
        if (!alt) {
            const usedProviders = new Set(
                agents.map((a) => (a.config.provider as string) || 'auto'),
            );
            const fallbackProvider = ['groq', 'gemini', 'openrouter', 'nvidia'].find(
                (p) => !usedProviders.has(p),
            );
            if (!fallbackProvider) return false;
            const template = agents[0] as ISNode;
            alt = {
                ...template,
                id: `diversity-${fallbackProvider}-${Date.now()}`,
                label: `${fallbackProvider} (Diversity)`,
                type: template.type,
                dynamic: true,
                config: { ...template.config, provider: fallbackProvider, model: 'auto' },
            } as ISNode;
            topology.nodes.push(alt!);
        }

        const router = topology.nodes.find((n) => n.type === 'router' || n.id === 'entry');
        if (!router) return false;

        if (topology.edges.some((e) => e.from === router.id && e.to === alt.id)) return false;

        const edge: ISEdge = {
            id: `reroute-diversity-${Date.now()}`,
            from: router.id,
            to: alt.id,
            trigger: 'data_flow',
        };
        topology.edges.push(edge);
        this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
            type: 'info',
            message: `Low model diversity — added reroute to ${alt.label}`,
        });
        return true;
    }

    private evaluateTopology() {
        if (!this.enabled) return;
        this.lastEvaluationTime = Date.now();
        this.deps.eventBus.emit(EVENTS.TOPOLOGY_EVALUATED, { timestamp: this.lastEvaluationTime });

        const topology = this.deps.orchestrator.getActiveTopology();
        if (!topology) return;

        let modified = false;
        const newTopology: ISTopology = structuredClone(topology) as ISTopology;

        const unhealthyAgents = this.deps.agentHealthMonitor
            .getAllHealth()
            .filter((h) => h.health === 'unhealthy' || h.health === 'degraded');

        for (const health of unhealthyAgents) {
            if (
                this.hasRecentClone(health.agentId) ||
                this.hasActiveDynamicClone(health.agentId, newTopology)
            )
                continue;

            const nodeIndex = newTopology.nodes.findIndex((n) => n.id === health.agentId);
            if (nodeIndex === -1) continue;

            const originalNode = newTopology.nodes[nodeIndex] as ISNode;
            this.cloneNode(newTopology, originalNode, 'clone', '(Failover)');
            modified = true;
            this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                type: 'warning',
                message: `Topology scaled up due to failing agent ${originalNode.label}`,
            });
        }

        const metrics = this.deps.metricsService.generateAggregated();
        if (metrics.avgLatency > 2000 || metrics.errorRate > 0.1) {
            let bottleneckId = '';
            let highestP95 = 0;

            for (const node of newTopology.nodes) {
                if (node.type !== 'agent' || node.dynamic) continue;
                const p = this.deps.metricsService.getAgentPercentiles(node.id);
                if (p.p95 > highestP95) {
                    highestP95 = p.p95;
                    bottleneckId = node.id;
                }
            }

            if (
                bottleneckId &&
                highestP95 > 2000 &&
                !this.hasRecentClone(bottleneckId) &&
                !this.hasActiveDynamicClone(bottleneckId, newTopology)
            ) {
                const node = newTopology.nodes.find((n) => n.id === bottleneckId);
                if (node) {
                    this.cloneNode(newTopology, node, 'scale', '(Scaled)');
                    modified = true;
                    this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                        type: 'info',
                        message: `Topology scaled horizontally for bottleneck ${node.label}`,
                    });
                }
            }
        }

        if (this.applyLowDiversityReroute(newTopology)) {
            modified = true;
        }

        if (modified) {
            this.deps.orchestrator.mount(newTopology);
            this.deps.eventBus.emit(EVENTS.SYSTEM_TOPOLOGY_MOUNTED, {
                topologyId: newTopology.name || 'active',
            });
        }
    }
}
