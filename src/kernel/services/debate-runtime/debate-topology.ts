import type {
    DebateTopology,
    TopologyNode,
    TopologyType,
    ITopologyService,
} from '../../contracts/debate-runtime';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('DebateTopology');

const VALID_EDGE_COUNTS: Record<TopologyType, { min: number; max: number }> = {
    linear: { min: 1, max: 100 },
    roundtable: { min: 2, max: 100 },
    judge: { min: 1, max: 100 },
    'tree-of-thought': { min: 2, max: 100 },
    'red-blue': { min: 2, max: 100 },
};

export class DebateTopologyService implements ITopologyService {
    validate(topology: DebateTopology): boolean {
        if (!topology.nodes.length) return false;

        const bounds = VALID_EDGE_COUNTS[topology.type];
        if (!bounds) return false;

        if (topology.edges.length < bounds.min || topology.edges.length > bounds.max) return false;

        const nodeIds = new Set(topology.nodes.map((n) => n.id));
        const edgeKeys = new Set<string>();
        for (const edge of topology.edges) {
            if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) return false;
            if (edge.from === edge.to) return false;
            const key = `${edge.from}->${edge.to}`;
            if (edgeKeys.has(key)) return false;
            edgeKeys.add(key);
        }

        // Type-specific validations
        if (topology.type === 'judge') {
            const hasJudge = topology.nodes.some((n) => n.role === 'judge');
            if (!hasJudge) return false;
        }

        if (topology.type === 'red-blue') {
            const hasAttacker = topology.nodes.some((n) => n.role === 'attacker');
            const hasDefender = topology.nodes.some((n) => n.role === 'defender');
            if (!hasAttacker || !hasDefender) return false;
        }

        // Detect disconnected subgraphs for linear/tree-of-thought
        if (topology.type === 'linear' || topology.type === 'tree-of-thought') {
            const reachable = new Set<string>();
            const adj = new Map<string, string[]>();
            for (const id of nodeIds) adj.set(id, []);
            for (const edge of topology.edges) {
                adj.get(edge.from)?.push(edge.to);
                adj.get(edge.to)?.push(edge.from);
            }
            // BFS from first node
            const queue = [topology.nodes[0]!.id];
            reachable.add(topology.nodes[0]!.id);
            while (queue.length > 0) {
                const current = queue.shift()!;
                for (const next of adj.get(current) || []) {
                    if (!reachable.has(next)) {
                        reachable.add(next);
                        queue.push(next);
                    }
                }
            }
            if (reachable.size !== nodeIds.size) return false;
        }

        return true;
    }

    buildRounds(topology: DebateTopology): TopologyNode[][] {
        const rounds: TopologyNode[][] = [];
        const nodeMap = new Map(topology.nodes.map((n) => [n.id, n]));

        switch (topology.type) {
            case 'linear': {
                const sorted = this.topologicalSort(topology);
                for (const id of sorted) {
                    const node = nodeMap.get(id);
                    if (node) rounds.push([node]);
                }
                break;
            }
            case 'roundtable': {
                const maxRounds = topology.maxRounds ?? 1;
                for (let r = 0; r < maxRounds; r++) rounds.push(topology.nodes);
                break;
            }
            case 'judge': {
                const debaters = topology.nodes.filter((n) => n.role !== 'judge');
                const judges = topology.nodes.filter((n) => n.role === 'judge');
                if (debaters.length) rounds.push(debaters);
                if (judges.length) rounds.push(judges);
                break;
            }
            case 'tree-of-thought': {
                const byEdge = this.groupByIncoming(topology);
                let current = topology.nodes.filter(
                    (n) => !byEdge.has(n.id) || byEdge.get(n.id)!.length === 0,
                );
                const visited = new Set<string>();
                const totalNodes = topology.nodes.length;
                while (current.length > 0 && visited.size < totalNodes) {
                    rounds.push(current);
                    current.forEach((n) => visited.add(n.id));
                    const next: TopologyNode[] = [];
                    for (const edge of topology.edges) {
                        if (visited.has(edge.from) && !visited.has(edge.to)) {
                            const node = nodeMap.get(edge.to);
                            if (node && !next.find((n) => n.id === node.id)) next.push(node);
                        }
                    }
                    current = next;
                }
                if (visited.size < totalNodes) {
                    const skipped = topology.nodes
                        .filter((n) => !visited.has(n.id))
                        .map((n) => n.id);
                    LOGGER.warn('DebateTopology', 'tree-of-thought BFS skipped cycled nodes', {
                        count: skipped.length,
                        nodes: skipped,
                    });
                }
                break;
            }
            case 'red-blue': {
                const attackers = topology.nodes.filter((n) => n.role === 'attacker');
                const defenders = topology.nodes.filter((n) => n.role === 'defender');
                const judges = topology.nodes.filter((n) => n.role === 'judge');
                // HIGH-4.2a: Cycle attack→defend for N rounds instead of single 3-round pass.
                // Previously max 3 rounds (attack→defend→judge) with no cycle.
                const totalRounds = Math.max(attackers.length, defenders.length);
                for (let i = 0; i < totalRounds; i++) {
                    rounds.push(attackers);
                    rounds.push(defenders);
                }
                if (judges.length) rounds.push(judges);
                break;
            }
            default: {
                const exhaustive: never = topology.type;
                throw new Error(`Unknown topology type: ${exhaustive}`);
            }
        }

        return rounds;
    }

    getNextNodes(topology: DebateTopology, currentNodeId: string): string[] {
        return topology.edges.filter((e) => e.from === currentNodeId).map((e) => e.to);
    }

    private topologicalSort(topology: DebateTopology): string[] {
        const inDegree = new Map<string, number>();
        const adj = new Map<string, string[]>();
        for (const node of topology.nodes) {
            inDegree.set(node.id, 0);
            adj.set(node.id, []);
        }
        for (const edge of topology.edges) {
            adj.get(edge.from)?.push(edge.to);
            inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
        }
        const queue: string[] = [];
        for (const [id, deg] of inDegree) {
            if (deg === 0) queue.push(id);
        }
        const result: string[] = [];
        while (queue.length > 0) {
            const node = queue.shift()!;
            result.push(node);
            for (const next of adj.get(node) || []) {
                const deg = (inDegree.get(next) || 0) - 1;
                inDegree.set(next, deg);
                if (deg === 0) queue.push(next);
            }
        }
        if (result.length !== topology.nodes.length) {
            const dropped = topology.nodes.filter((n) => !result.includes(n.id)).map((n) => n.id);
            throw new Error(
                `Cycle detected in topology "${topology.id}" — ${dropped.length} node(s) excluded from routing: [${dropped.join(', ')}]. ` +
                    `Resolve the cycle before starting the debate.`,
            );
        }
        return result;
    }

    private groupByIncoming(topology: DebateTopology): Map<string, TopologyNode[]> {
        const map = new Map<string, TopologyNode[]>();
        const nodeMap = new Map(topology.nodes.map((n) => [n.id, n]));
        for (const edge of topology.edges) {
            const source = nodeMap.get(edge.from);
            if (source) {
                const existing = map.get(edge.to) || [];
                existing.push(source);
                map.set(edge.to, existing);
            }
        }
        return map;
    }
}
