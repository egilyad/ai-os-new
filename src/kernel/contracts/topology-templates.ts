export interface TopologyTemplateNode {
    id: string;
    type: 'router' | 'agent' | 'filter' | 'aggregator' | 'transformer';
    label: string;
    config?: Record<string, unknown>;
}

export interface TopologyTemplateEdge {
    from: string;
    to: string;
}

export interface TopologyTemplate {
    id: string;
    name: string;
    description: string;
    category: 'analysis' | 'creative' | 'technical' | 'research' | 'debate' | 'custom';
    nodes: TopologyTemplateNode[];
    edges: TopologyTemplateEdge[];
    usageCount: number;
}

export interface ITopologyTemplateService {
    getTemplates(category?: string): TopologyTemplate[];
    getTemplate(id: string): TopologyTemplate | undefined;
    incrementUsage(id: string): void;
}
