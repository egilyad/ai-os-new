/**
 * MemoryMcpServer — built-in MCP server exposing the memory subsystem over
 * JSON-RPC (protocol 2025-03-26): resources (stats/entries/single entry) and
 * tools (search/store/recall/delete/stats, plus associative recall when
 * ltMemoryService is present).
 *
 * Transport-agnostic: `handle(method, params)` returns the JSON-RPC `result`
 * (throws on error). MCPService attaches it as an in-process local server, so
 * it never touches the network and is never persisted.
 */

import type { MCPResource, MCPTool } from '../mcp-service';
import type { IMemoryEngine, MemoryQuery } from '../../contracts/memory';
import type { ILtMemoryService } from '../../contracts/persona';
import type { MemoryEntry } from '../../types/memory-types';
import { sanitizePromptVar } from '../../utils/sanitize';

export const MEMORY_MCP_SERVER_ID = 'mcp-memory';
export const MEMORY_MCP_SERVER_NAME = 'Memory (built-in)';

const PROTOCOL_VERSION = '2025-03-26';
const MAX_CONTENT_CHARS = 8_000;
const MAX_LIMIT = 50;

export interface MemoryMcpServerDeps {
    memoryService: IMemoryEngine;
    ltMemoryService?: ILtMemoryService;
}

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function str(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, value));
}

export class MemoryMcpServer {
    constructor(private deps: MemoryMcpServerDeps) {}

    /** Dispatch a JSON-RPC method; returns the `result` payload. */
    async handle(method: string, params?: unknown): Promise<unknown> {
        switch (method) {
            case 'initialize':
                return {
                    protocolVersion: PROTOCOL_VERSION,
                    capabilities: { resources: {}, tools: {} },
                    serverInfo: { name: 'super-agents-memory', version: '1.0.0' },
                };
            case 'notifications/initialized':
                return null;
            case 'resources/list':
                return { resources: this.listResources() };
            case 'resources/read':
                return this.readResource(asRecord(params));
            case 'tools/list':
                return { tools: this.listTools() };
            case 'tools/call':
                return this.callTool(asRecord(params));
            default:
                throw new Error(`Method not found: ${method}`);
        }
    }

    listResources(): MCPResource[] {
        return [
            {
                uri: 'memory://stats',
                name: 'Memory statistics',
                description: 'Aggregate MemoryStats (counts, tokens, sources).',
                mimeType: 'application/json',
            },
            {
                uri: 'memory://entries',
                name: 'Recent memory entries',
                description: 'Up to 100 most recent entries with metadata.',
                mimeType: 'application/json',
            },
        ];
    }

    listTools(): MCPTool[] {
        const tools: MCPTool[] = [
            {
                name: 'memory.search',
                description:
                    'Search memory with optional namespace filters (agent/role/session/chat/source/type).',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string' },
                        limit: { type: 'number' },
                        agentId: { type: 'string' },
                        roleId: { type: 'string' },
                        sessionId: { type: 'string' },
                        chatId: { type: 'string' },
                        source: { type: 'string' },
                        type: { type: 'string' },
                        importanceMin: { type: 'number' },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'memory.store',
                description: 'Store a memory entry (content is sanitized and capped).',
                inputSchema: {
                    type: 'object',
                    properties: {
                        content: { type: 'string' },
                        source: { type: 'string' },
                        type: { type: 'string' },
                        importance: { type: 'number' },
                        agentId: { type: 'string' },
                        sessionId: { type: 'string' },
                        chatId: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['content'],
                },
            },
            {
                name: 'memory.recall',
                description: 'Keyword recall over a namespace scope.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        context: { type: 'string' },
                        limit: { type: 'number' },
                        agentId: { type: 'string' },
                        sessionId: { type: 'string' },
                    },
                    required: ['context'],
                },
            },
            {
                name: 'memory.delete',
                description: 'Delete a memory entry by id.',
                inputSchema: {
                    type: 'object',
                    properties: { id: { type: 'string' } },
                    required: ['id'],
                },
            },
            {
                name: 'memory.stats',
                description: 'Aggregate memory statistics.',
                inputSchema: { type: 'object', properties: {} },
            },
        ];
        if (this.deps.ltMemoryService) {
            tools.push({
                name: 'memory.associated',
                description: 'Associative (PPR) recall around a long-term memory id.',
                inputSchema: {
                    type: 'object',
                    properties: { id: { type: 'string' }, limit: { type: 'number' } },
                    required: ['id'],
                },
            });
        }
        return tools;
    }

    private filterFrom(args: Record<string, unknown>): Record<string, unknown> {
        const filter: Record<string, unknown> = {};
        for (const key of [
            'agentId',
            'roleId',
            'sessionId',
            'chatId',
            'source',
            'type',
            'collection',
        ]) {
            const value = str(args[key]);
            if (value) filter[key] = value;
        }
        if (typeof args.importanceMin === 'number') filter.importanceMin = args.importanceMin;
        return filter;
    }

    private async readResource(args: Record<string, unknown>): Promise<unknown> {
        const uri = str(args.uri);
        if (!uri) throw new Error('resources/read requires a uri');
        const text = await this.readUri(uri);
        return { contents: [{ uri, mimeType: 'application/json', text }] };
    }

    private async readUri(uri: string): Promise<string> {
        if (uri === 'memory://stats') {
            return JSON.stringify(this.deps.memoryService.getStats(), null, 2);
        }
        if (uri === 'memory://entries') {
            return JSON.stringify(this.deps.memoryService.getMemories(100), null, 2);
        }
        if (uri.startsWith('memory://entry/')) {
            const id = uri.slice('memory://entry/'.length);
            const entry = this.deps.memoryService.getMemory(id);
            if (!entry) throw new Error(`Memory entry not found: ${id}`);
            return JSON.stringify(entry, null, 2);
        }
        throw new Error(`Unknown resource: ${uri}`);
    }

    private async callTool(args: Record<string, unknown>): Promise<unknown> {
        const name = str(args.name);
        if (!name) throw new Error('tools/call requires a name');
        const toolArgs = asRecord(args.arguments);
        const result = await this.dispatchTool(name, toolArgs);
        return { content: [{ type: 'text', text: JSON.stringify(result ?? null) }] };
    }

    private async dispatchTool(name: string, args: Record<string, unknown>): Promise<unknown> {
        switch (name) {
            case 'memory.search':
                return this.toolSearch(args);
            case 'memory.store':
                return this.toolStore(args);
            case 'memory.recall': {
                const context = str(args.context);
                if (!context) throw new Error('memory.recall requires "context"');
                const limit = clampNumber(args.limit, 5, 1, MAX_LIMIT);
                const filter = this.filterFrom(args);
                return this.deps.memoryService.recall(
                    context,
                    limit,
                    Object.keys(filter).length ? filter : undefined,
                );
            }
            case 'memory.delete': {
                const id = str(args.id);
                if (!id) throw new Error('memory.delete requires "id"');
                await this.deps.memoryService.deleteMemory(id);
                return { deleted: true, id };
            }
            case 'memory.stats':
                return this.deps.memoryService.getStats();
            case 'memory.associated':
                return this.toolAssociated(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }

    private async toolSearch(args: Record<string, unknown>): Promise<unknown> {
        const query = str(args.query);
        if (!query) throw new Error('memory.search requires "query"');
        const limit = clampNumber(args.limit, 5, 1, MAX_LIMIT);
        const filter = this.filterFrom(args);
        const engine = this.deps.memoryService;

        let hits: MemoryEntry[];
        if (engine.searchAdvanced) {
            const results = await engine.searchAdvanced({
                query,
                limit,
                filter,
            } as MemoryQuery);
            hits = results.map((r) => ({ ...r.entry, score: r.score }));
        } else {
            const results = await engine.search(query, limit);
            hits = results.map((r) => r.entry);
        }

        return hits.map((e) => ({
            id: e.id,
            content: e.content,
            score: typeof e.score === 'number' ? e.score : undefined,
            metadata: {
                source: e.metadata.source,
                type: e.metadata.type,
                importance: e.metadata.importance,
                timestamp: e.metadata.timestamp,
                agentId: e.metadata.agentId,
                sessionId: e.metadata.sessionId,
            },
        }));
    }

    private async toolStore(args: Record<string, unknown>): Promise<unknown> {
        const raw = str(args.content);
        if (!raw) throw new Error('memory.store requires "content"');
        const content = sanitizePromptVar(raw).slice(0, MAX_CONTENT_CHARS);
        const tags = Array.isArray(args.tags)
            ? args.tags.filter((t): t is string => typeof t === 'string')
            : undefined;
        await this.deps.memoryService.store({
            content,
            metadata: {
                source: str(args.source) ?? 'system',
                type: str(args.type) ?? 'mcp',
                timestamp: Date.now(),
                importance: clampNumber(args.importance, 0.5, 0, 1),
                agentId: str(args.agentId),
                sessionId: str(args.sessionId),
                chatId: str(args.chatId),
                ...(tags && tags.length ? { tags: { labels: tags } } : {}),
            },
        });
        return { stored: true };
    }

    private async toolAssociated(args: Record<string, unknown>): Promise<unknown> {
        const lt = this.deps.ltMemoryService;
        if (!lt) throw new Error('memory.associated requires long-term memory');
        const id = str(args.id);
        if (!id) throw new Error('memory.associated requires "id"');
        const limit = clampNumber(args.limit, 5, 1, MAX_LIMIT);
        const related = await lt.associativeRecall(id, { limit });
        return related.map((r) => ({
            id: r.memory.id,
            content: r.memory.content,
            score: r.score,
        }));
    }
}
