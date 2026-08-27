import type { IUncertaintyPropagationService, UncertaintyNode } from '../../contracts/debate-uncertainty-propagation';
export class UncertaintyPropagationService implements IUncertaintyPropagationService {
    propagate(nodes: UncertaintyNode[]): UncertaintyNode[] {
        let min: 'high'|'medium'|'low'='high';
        if (nodes.some(n=>n.confidence==='low')) min='low';
        else if (nodes.some(n=>n.confidence==='medium')) min='medium';
        return nodes.map(n=>({ ...n, confidence: min }));
    }
}
