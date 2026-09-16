import { AGENT_REGISTRY } from '../agents/registry';
import type { ISNode } from '../contracts/topology';

/**
 * Composes the topology nodes by combining infrastructure (router, aggregator)
 * with the registry of declared agents.
 */
export function composeTopologyNodes(nodes: ISNode[]): ISNode[] {
    const infrastructure = nodes.filter(n => n.type === 'router' || n.type === 'aggregator');
    const agentNodes: ISNode[] = Object.values(AGENT_REGISTRY).map(def => ({
        id: def.metadata.id,
        type: 'agent',
        label: def.metadata.name,
        config: def.config as ISNode['config'],
    }));
    
    return [...infrastructure, ...agentNodes];
}
