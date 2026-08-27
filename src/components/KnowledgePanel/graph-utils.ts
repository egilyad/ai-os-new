export function getNodeColor(type: string): string {
    switch (type) {
        case 'decision':
            return '#3b82f6';
        case 'code':
            return '#a855f7';
        case 'chat_response':
            return '#f59e0b';
        case 'chat_query':
            return '#ec4899';
        default:
            return '#10b981';
    }
}

export function computeDensity(edges: number, nodes: number): number {
    return nodes > 1 ? Math.min(100, Math.round((edges / (nodes * 1.5)) * 100)) : 0;
}

export function computeTypeCounts(
    memories: Array<{ metadata: { type?: string } }>,
): Record<string, number> {
    const counts: Record<string, number> = {};
    memories.forEach((m) => {
        const t = m.metadata.type || 'context';
        counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
}

export function getUniqueTypes(memories: Array<{ metadata: { type?: string } }>): string[] {
    return [...new Set(memories.map((m) => m.metadata.type || 'context'))];
}

export interface GraphNodeData {
    id: string;
    label: string;
    fullContent: string;
    x: number;
    y: number;
    type: string;
    importance: number;
    source: string;
    timestamp?: string | number;
    memory: unknown;
}

export interface EdgeData {
    id: string;
    source: GraphNodeData;
    target: GraphNodeData;
    strength: number;
}

export function buildNodes(
    memories: Array<{
        id: string;
        content: string;
        metadata: {
            type?: string;
            importance?: number;
            source?: string;
            timestamp?: string | number;
        };
    }>,
): GraphNodeData[] {
    return memories.slice(0, 50).map((m, i) => {
        const theta = i * 2.39996;
        const radius = 60 + i * 15;
        return {
            id: m.id,
            label: m.content.substring(0, 30) + (m.content.length > 30 ? '...' : ''),
            fullContent: m.content,
            x: 350 + Math.cos(theta) * radius,
            y: 350 + Math.sin(theta) * radius * 0.7,
            type: m.metadata.type || 'context',
            importance: m.metadata.importance || 0.5,
            source: m.metadata.source || 'system',
            timestamp: m.metadata.timestamp,
            memory: m,
        };
    });
}

export function buildEdges(nodes: GraphNodeData[]): EdgeData[] {
    const e: EdgeData[] = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < Math.min(i + 4, nodes.length); j++) {
            e.push({
                id: `${nodes[i]!.id}-${nodes[j]!.id}`,
                source: nodes[i]!,
                target: nodes[j]!,
                strength: 1 - (j - i) * 0.2,
            });
        }
    }
    return e;
}

export const GLOW_COLORS = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];

export const LEGEND_ITEMS = [
    { label: 'Context', color: 'var(--success)' },
    { label: 'Decision', color: 'var(--accent)' },
    { label: 'Code', color: '#a855f7' },
    { label: 'Response', color: 'var(--warning)' },
    { label: 'Query', color: '#ec4899' },
];
