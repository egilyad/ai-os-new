import type { ITopologyTemplateService, TopologyTemplate } from '../contracts/topology-templates';

const TEMPLATES: TopologyTemplate[] = [
    {
        id: 'simple-chat',
        name: 'Simple Chat',
        description: 'Router → Single agent for basic chat',
        category: 'technical',
        nodes: [
            { id: 'router', type: 'router', label: 'Router' },
            { id: 'agent', type: 'agent', label: 'Chat Agent' },
        ],
        edges: [{ from: 'router', to: 'agent' }],
        usageCount: 0,
    },
    {
        id: 'research-team',
        name: 'Research Team',
        description: 'Router → 3 research agents + aggregator',
        category: 'research',
        nodes: [
            { id: 'router', type: 'router', label: 'Router' },
            { id: 'agent1', type: 'agent', label: 'Web Researcher' },
            { id: 'agent2', type: 'agent', label: 'Data Analyst' },
            { id: 'agent3', type: 'agent', label: 'Fact Checker' },
            { id: 'agg', type: 'aggregator', label: 'Aggregator' },
        ],
        edges: [
            { from: 'router', to: 'agent1' },
            { from: 'router', to: 'agent2' },
            { from: 'router', to: 'agent3' },
            { from: 'agent1', to: 'agg' },
            { from: 'agent2', to: 'agg' },
            { from: 'agent3', to: 'agg' },
        ],
        usageCount: 0,
    },
    {
        id: 'code-review',
        name: 'Code Review Pipeline',
        description: 'Router → Code analyzer → Reviewer → Aggregator',
        category: 'technical',
        nodes: [
            { id: 'router', type: 'router', label: 'Router' },
            { id: 'analyzer', type: 'agent', label: 'Code Analyzer' },
            { id: 'reviewer', type: 'agent', label: 'Peer Reviewer' },
            { id: 'filter', type: 'filter', label: 'Quality Filter' },
            { id: 'agg', type: 'aggregator', label: 'Report Builder' },
        ],
        edges: [
            { from: 'router', to: 'analyzer' },
            { from: 'analyzer', to: 'reviewer' },
            { from: 'reviewer', to: 'filter' },
            { from: 'filter', to: 'agg' },
        ],
        usageCount: 0,
    },
    {
        id: 'debate-panel',
        name: 'Debate Panel',
        description: 'Router → 4 debaters → Judge',
        category: 'debate',
        nodes: [
            { id: 'router', type: 'router', label: 'Router' },
            { id: 'pro', type: 'agent', label: 'Proponent' },
            { id: 'con', type: 'agent', label: 'Opponent' },
            { id: 'mod', type: 'agent', label: 'Moderator' },
            { id: 'judge', type: 'aggregator', label: 'Judge' },
        ],
        edges: [
            { from: 'router', to: 'pro' },
            { from: 'router', to: 'con' },
            { from: 'router', to: 'mod' },
            { from: 'pro', to: 'judge' },
            { from: 'con', to: 'judge' },
            { from: 'mod', to: 'judge' },
        ],
        usageCount: 0,
    },
    {
        id: 'creative-brainstorm',
        name: 'Creative Brainstorm',
        description: 'Router → 5 diverse agents → Idea aggregator',
        category: 'creative',
        nodes: [
            { id: 'router', type: 'router', label: 'Router' },
            { id: 'writer', type: 'agent', label: 'Writer' },
            { id: 'artist', type: 'agent', label: 'Visual Thinker' },
            { id: 'critic', type: 'agent', label: 'Critic' },
            { id: 'inno', type: 'agent', label: 'Innovator' },
            { id: 'prag', type: 'agent', label: 'Pragmatist' },
            { id: 'agg', type: 'aggregator', label: 'Synthesizer' },
        ],
        edges: [
            { from: 'router', to: 'writer' },
            { from: 'router', to: 'artist' },
            { from: 'router', to: 'critic' },
            { from: 'router', to: 'inno' },
            { from: 'router', to: 'prag' },
            { from: 'writer', to: 'agg' },
            { from: 'artist', to: 'agg' },
            { from: 'critic', to: 'agg' },
            { from: 'inno', to: 'agg' },
            { from: 'prag', to: 'agg' },
        ],
        usageCount: 0,
    },
    {
        id: 'data-pipeline',
        name: 'Data Analysis Pipeline',
        description: 'Router → Extract → Transform → Load → Report',
        category: 'analysis',
        nodes: [
            { id: 'router', type: 'router', label: 'Router' },
            { id: 'extract', type: 'agent', label: 'Data Extractor' },
            { id: 'transform', type: 'transformer', label: 'Transformer' },
            { id: 'analyze', type: 'agent', label: 'Analyst' },
            { id: 'report', type: 'aggregator', label: 'Report Builder' },
        ],
        edges: [
            { from: 'router', to: 'extract' },
            { from: 'extract', to: 'transform' },
            { from: 'transform', to: 'analyze' },
            { from: 'analyze', to: 'report' },
        ],
        usageCount: 0,
    },
];

export class TopologyTemplateService implements ITopologyTemplateService {
    getTemplates(category?: string): TopologyTemplate[] {
        if (category) return TEMPLATES.filter((t) => t.category === category);
        return TEMPLATES;
    }
    getTemplate(id: string): TopologyTemplate | undefined {
        return TEMPLATES.find((t) => t.id === id);
    }
    incrementUsage(id: string): void {
        const t = TEMPLATES.find((x) => x.id === id);
        if (t) t.usageCount++;
    }
}
