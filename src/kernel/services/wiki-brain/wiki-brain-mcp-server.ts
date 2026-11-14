import type { IWikiQueryService } from '../../contracts/wiki-brain/wiki-query.service';
import type { TWikiKnowledgeUnit } from '../../contracts/wiki-brain/types';
import type { KnowledgeUnitService } from './wiki-knowledge-unit.service';
import type { ProjectGraphService } from '../project-graph/project-graph-service';

export interface McpToolDef {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}

export interface McpHandleResult {
    content: Array<{ type: 'text'; text: string }>;
    isError?: boolean;
}

export interface WikiBrainMcpServerDeps {
    query: IWikiQueryService;
    units: KnowledgeUnitService;
    graph?: ProjectGraphService;
}

/**
 * F8 — thin MCP wrapper over Wiki-Brain: search, readPage, graph.query,
 * addKnowledgeUnit. Runs in-process (local-first); a stdio CLI can mount it.
 */
export class WikiBrainMcpServer {
    constructor(private deps: WikiBrainMcpServerDeps) {}

    tools(): McpToolDef[] {
        return [
            {
                name: 'wiki.search',
                description: 'Search Wiki-Brain pages (BM25).',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string' },
                        topK: { type: 'number' },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'wiki.read_page',
                description: 'Read a wiki page body by slug.',
                inputSchema: {
                    type: 'object',
                    properties: { slug: { type: 'string' } },
                    required: ['slug'],
                },
            },
            {
                name: 'wiki.graph_query',
                description: 'Query the project graph (list/neighbors/relations).',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectId: { type: 'string' },
                        mode: { type: 'string', enum: ['list', 'neighbors', 'relations'] },
                        nodeId: { type: 'string' },
                        relation: { type: 'string' },
                    },
                    required: ['projectId', 'mode'],
                },
            },
            {
                name: 'wiki.add_knowledge_unit',
                description: 'Add a knowledge unit (write; gated by tool policy).',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pageId: { type: 'string' },
                        text: { type: 'string' },
                        kind: { type: 'string' },
                        evidence: { type: 'array', items: { type: 'string' } },
                        projectId: { type: 'string' },
                    },
                    required: ['pageId', 'text'],
                },
            },
        ];
    }

    async handle(name: string, args: Record<string, unknown>): Promise<McpHandleResult> {
        switch (name) {
            case 'wiki.search':
                return this.search(args);
            case 'wiki.read_page':
                return this.readPage(args);
            case 'wiki.graph_query':
                return this.graphQuery(args);
            case 'wiki.add_knowledge_unit':
                return this.addKnowledgeUnit(args);
            default:
                return {
                    content: [{ type: 'text', text: `unknown tool: ${name}` }],
                    isError: true,
                };
        }
    }

    private async search(args: Record<string, unknown>): Promise<McpHandleResult> {
        const query = String(args['query'] ?? '');
        const topK = typeof args['topK'] === 'number' ? args['topK'] : 5;
        try {
            const hits = await this.deps.query.search(query, { topK });
            const text = hits
                .slice(0, topK)
                .map((h) => `[[${h.page.slug}]] ${h.page.frontmatter.title}\n${h.snippet}`)
                .join('\n\n');
            return { content: [{ type: 'text', text: text || 'no results' }] };
        } catch (e) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `search failed: ${e instanceof Error ? e.message : String(e)}`,
                    },
                ],
                isError: true,
            };
        }
    }

    private async readPage(args: Record<string, unknown>): Promise<McpHandleResult> {
        const slug = String(args['slug'] ?? '');
        try {
            const page = await this.deps.query.getBySlug(slug);
            if (!page)
                return {
                    content: [{ type: 'text', text: `page not found: ${slug}` }],
                    isError: true,
                };
            return { content: [{ type: 'text', text: page.body }] };
        } catch (e) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `readPage failed: ${e instanceof Error ? e.message : String(e)}`,
                    },
                ],
                isError: true,
            };
        }
    }

    private async graphQuery(args: Record<string, unknown>): Promise<McpHandleResult> {
        if (!this.deps.graph) {
            return { content: [{ type: 'text', text: 'graph unavailable' }], isError: true };
        }
        const projectId = String(args['projectId'] ?? '');
        const mode = String(args['mode'] ?? 'list');
        try {
            const graph = this.deps.graph;
            if (mode === 'neighbors') {
                const nbrs = await graph.neighbors(projectId, String(args['nodeId'] ?? ''));
                const text = nbrs.map((n) => `${n.node.label} [${n.node.id}]`).join('\n');
                return { content: [{ type: 'text', text: text || 'no neighbors' }] };
            }
            if (mode === 'relations') {
                const edges = await graph.findByRelation(
                    projectId,
                    String(args['relation'] ?? '') as never,
                );
                const text = edges.map((e) => `${e.from} → ${e.relation} → ${e.to}`).join('\n');
                return { content: [{ type: 'text', text: text || 'no edges' }] };
            }
            const { nodes, edges } = await graph.listProject(projectId);
            const text = `nodes: ${nodes.length}\nedges: ${edges.length}`;
            return { content: [{ type: 'text', text }] };
        } catch (e) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `graphQuery failed: ${e instanceof Error ? e.message : String(e)}`,
                    },
                ],
                isError: true,
            };
        }
    }

    private async addKnowledgeUnit(args: Record<string, unknown>): Promise<McpHandleResult> {
        try {
            const unit = await this.deps.units.addUnit({
                pageId: String(args['pageId'] ?? ''),
                text: String(args['text'] ?? ''),
                kind: (args['kind'] as TWikiKnowledgeUnit['kind']) ?? 'note',
                evidence: Array.isArray(args['evidence']) ? (args['evidence'] as string[]) : [],
                projectId: args['projectId'] ? String(args['projectId']) : undefined,
            });
            return { content: [{ type: 'text', text: `unit ${unit.id} created` }] };
        } catch (e) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `addKnowledgeUnit failed: ${e instanceof Error ? e.message : String(e)}`,
                    },
                ],
                isError: true,
            };
        }
    }
}
