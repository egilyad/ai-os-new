import type { DebateArgument } from '../../contracts/debate-types';

export type EdgeRelation = 'contradicts' | 'improves' | 'depends' | 'supports' | 'extends';

export interface KnowledgeNode {
    id: string;
    idea: string;
    agentId: string;
    round: number;
    strength: number;
    firstSeen: number;
    lastSeen: number;
    refs: number;
}

export interface KnowledgeEdge {
    from: string;
    to: string;
    relation: EdgeRelation;
    weight: number;
}

export interface KnowledgeGraph {
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
}

export class DebateMemoryGraph {
    private graph: KnowledgeGraph = { nodes: [], edges: [] };
    private argToNodeId = new Map<string, string>();
    private edgeKeys = new Set<string>();

    /** SI-48: Incremental add — single argument without full rebuild */
    addArgument(arg: DebateArgument): void {
        const idea = this.extractIdea(arg.content);
        const existing = this.graph.nodes.find(
            (n) =>
                n.idea.toLowerCase() === idea.toLowerCase() ||
                this.semanticOverlap(n.idea, idea) > 0.6,
        );
        if (existing) {
            existing.refs++;
            existing.lastSeen = arg.timestamp;
            existing.strength = Math.min(1, existing.strength + 0.1);
            this.argToNodeId.set(arg.id, existing.id);
        } else {
            const nodeId = arg.id;
            this.graph.nodes.push({
                id: nodeId,
                idea,
                agentId: arg.agentId,
                round: arg.round,
                strength: arg.confidence,
                firstSeen: arg.timestamp,
                lastSeen: arg.timestamp,
                refs: 1,
            });
            this.argToNodeId.set(arg.id, nodeId);
        }
        // Connect to all existing nodes that have semantic overlap
        const fromNodeId = this.resolveNodeId(arg.id);
        for (const node of this.graph.nodes) {
            if (node.id === fromNodeId) continue;
            const overlap = this.semanticOverlap(idea, node.idea);
            if (overlap < 0.3) continue;
            const relation = this.inferRelation(
                arg,
                {
                    id: node.id,
                    content: node.idea,
                    agentId: node.agentId,
                    round: node.round,
                    confidence: node.strength,
                    timestamp: node.lastSeen,
                } as DebateArgument,
                overlap,
            );
            if (relation) {
                const key = `${fromNodeId}->${node.id}:${relation}`;
                if (this.edgeKeys.has(key)) continue;
                if (this.wouldCreateCycle(fromNodeId, node.id, relation)) continue;
                this.edgeKeys.add(key);
                this.graph.edges.push({ from: fromNodeId, to: node.id, relation, weight: overlap });
            }
        }
    }

    build(arguments_: DebateArgument[]): KnowledgeGraph {
        this.graph = { nodes: [], edges: [] };
        this.argToNodeId.clear();
        this.edgeKeys.clear();

        for (const arg of arguments_) {
            const idea = this.extractIdea(arg.content);
            const existing = this.graph.nodes.find(
                (n) =>
                    n.idea.toLowerCase() === idea.toLowerCase() ||
                    this.semanticOverlap(n.idea, idea) > 0.6,
            );

            if (existing) {
                existing.refs++;
                existing.lastSeen = arg.timestamp;
                existing.strength = Math.min(1, existing.strength + 0.1);
                this.argToNodeId.set(arg.id, existing.id);
            } else {
                const nodeId = arg.id;
                this.graph.nodes.push({
                    id: nodeId,
                    idea,
                    agentId: arg.agentId,
                    round: arg.round,
                    strength: arg.confidence,
                    firstSeen: arg.timestamp,
                    lastSeen: arg.timestamp,
                    refs: 1,
                });
                this.argToNodeId.set(arg.id, nodeId);
            }
        }

        this.buildEdges(arguments_);
        return this.graph;
    }

    private resolveNodeId(argId: string): string {
        return this.argToNodeId.get(argId) ?? argId;
    }

    getEvolution(): Array<{
        round: number;
        nodeCount: number;
        edgeCount: number;
        newIdeas: string[];
    }> {
        const rounds = new Map<
            number,
            { nodeCount: number; edgeCount: number; newIdeas: string[] }
        >();
        for (const node of this.graph.nodes) {
            const r = node.round;
            if (!rounds.has(r)) rounds.set(r, { nodeCount: 0, edgeCount: 0, newIdeas: [] });
            const entry = rounds.get(r)!;
            entry.nodeCount++;
            if (node.refs === 1) entry.newIdeas.push(node.idea);
        }
        for (const edge of this.graph.edges) {
            const node = this.graph.nodes.find((n) => n.id === edge.to);
            if (node) {
                const entry = rounds.get(node.round);
                if (entry) entry.edgeCount++;
            }
        }
        return Array.from(rounds.entries())
            .sort(([a], [b]) => a - b)
            .map(([round, data]) => ({ round, ...data }));
    }

    findContradictions(): Array<{ a: KnowledgeNode; b: KnowledgeNode }> {
        return this.graph.edges
            .filter((e) => e.relation === 'contradicts')
            .map((e) => {
                const a = this.graph.nodes.find((n) => n.id === e.from);
                const b = this.graph.nodes.find((n) => n.id === e.to);
                return a && b ? { a, b } : null;
            })
            .filter((x): x is { a: KnowledgeNode; b: KnowledgeNode } => x !== null);
    }

    private wouldCreateCycle(from: string, to: string, relation: EdgeRelation): boolean {
        if (relation !== 'depends') return false;
        const visited = new Set<string>();
        const stack = [to];
        while (stack.length > 0) {
            const current = stack.pop()!;
            if (current === from) return true;
            if (visited.has(current)) continue;
            visited.add(current);
            for (const edge of this.graph.edges) {
                if (edge.from === current && edge.relation === 'depends') stack.push(edge.to);
            }
        }
        return false;
    }

    private buildEdges(arguments_: DebateArgument[]): void {
        if (!this.edgeKeys) this.edgeKeys = new Set();
        for (let i = 0; i < arguments_.length; i++) {
            for (let j = i + 1; j < arguments_.length; j++) {
                const a = arguments_[i]!;
                const b = arguments_[j]!;
                const overlap = this.semanticOverlap(a.content, b.content);
                if (overlap < 0.3) continue;

                const relation = this.inferRelation(a, b, overlap);
                if (relation) {
                    const from = this.resolveNodeId(a.id);
                    const to = this.resolveNodeId(b.id);
                    const key = `${from}->${to}:${relation}`;
                    if (this.edgeKeys.has(key)) continue;
                    if (this.wouldCreateCycle(from, to, relation)) continue;
                    this.edgeKeys.add(key);
                    this.graph.edges.push({ from, to, relation, weight: overlap });
                }
            }
        }
    }

    private extractIdea(content: string): string {
        const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
        const first = sentences[0]?.trim() || content.slice(0, 100);
        return first.length > 150 ? first.slice(0, 150) + '...' : first;
    }

    private semanticOverlap(a: string, b: string): number {
        const wordsA = new Set(
            a
                .toLowerCase()
                .replace(/[^a-zа-яё\s]/g, '')
                .split(/\s+/)
                .filter((w) => w.length > 3),
        );
        const wordsB = new Set(
            b
                .toLowerCase()
                .replace(/[^a-zа-яё\s]/g, '')
                .split(/\s+/)
                .filter((w) => w.length > 3),
        );
        if (wordsA.size === 0 || wordsB.size === 0) return 0;
        const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
        const union = new Set([...wordsA, ...wordsB]);
        return intersection.size / union.size;
    }

    private inferRelation(
        a: DebateArgument,
        b: DebateArgument,
        overlap: number,
    ): EdgeRelation | null {
        const contradicts = /против|несогласен|ошибк|неверн|disagree|against|wrong|incorrect/i;
        const improves = /улучш|дополн|расшир|уточн|improve|extend|refine/i;
        const supports = /поддерживаю|согласен|верно|подтвержд|support|agree|confirm/i;

        const aText = a.content.toLowerCase();
        const bText = b.content.toLowerCase();

        if (contradicts.test(aText) || contradicts.test(bText)) return 'contradicts';
        if (a.agentId === b.agentId && improves.test(bText)) return 'extends';
        if (supports.test(aText) && supports.test(bText)) return 'supports';
        if (overlap > 0.5 && a.round < b.round) return 'improves';
        if (overlap > 0.4) return 'depends';
        return null;
    }
}
