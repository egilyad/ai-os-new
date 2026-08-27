import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';
const LOGGER = rootLogger.child('MCPService');

export interface MCPServerConfig {
    id: string;
    name: string;
    url: string;
    status: 'connected' | 'disconnected' | 'error';
    error?: string;
    lastConnected?: number;
    capabilities?: string[];
}

export interface MCPResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}

export interface MCPTool {
    name: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
}

interface JSONRPCResponse {
    jsonrpc: '2.0';
    id: number;
    result?: unknown;
    error?: { code: number; message: string; data?: unknown };
}

import { CONFIG } from './config-registry';
import { isPrivateIP } from '../utils/network';
import { sanitizePromptVar } from '../utils/sanitize';

const SERVERS_KEY = 'super_agents_mcp_servers';

function sanitizeExternalString(input: string): string {
    return sanitizePromptVar(input)
        .replace(/<\|[^|]*\|>/g, '')
        .replace(/\[INST\]|\[\/INST\]|\[SYS\]|\[\/SYS\]/gi, '')
        .replace(/\bHUMAN:\s*|\bAI:\s*|\bUSER:\s*|\bSYSTEM:\s*/gi, '')
        .slice(0, 4000);
}

// Recursively sanitize external data by traversing all string values
function sanitizeMcpResult(data: unknown): unknown {
    if (typeof data === 'string') return sanitizeExternalString(data);
    if (Array.isArray(data)) return data.map(sanitizeMcpResult);
    if (data && typeof data === 'object' && data !== null) {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            if (key === 'name' || key === 'description') {
                result[key] = typeof value === 'string' ? sanitizeExternalString(value) : value;
            } else {
                result[key] = sanitizeMcpResult(value);
            }
        }
        return result;
    }
    return data;
}

export interface MCPServiceDeps {
    eventBus: {
        emit: (event: string, data?: unknown) => void;
    };
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
}

export class MCPService {
    private servers: MCPServerConfig[] = [];
    private rpcId = 0;
    private connectionRetries = new Map<string, number>();
    private static readonly MAX_RETRIES = 5;
    private static readonly BASE_BACKOFF_MS = 2000;
    private deps: MCPServiceDeps;
    private _initialized = false;
    private _abortController = new AbortController();

    constructor(deps: MCPServiceDeps) {
        this.deps = deps;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        await this.load();
    }

    destroy() {
        this._abortController.abort();
        this.servers = [];
        this.connectionRetries.clear();
    }

    private async load() {
        try {
            const saved = await this.deps.database.getKv<MCPServerConfig[]>(SERVERS_KEY);
            if (saved && saved.length > 0) {
                this.servers = saved;
            } else {
                this.servers = [
                    {
                        id: 'mcp-local-files',
                        name: 'Local File System',
                        url: 'http://localhost:3001',
                        status: 'disconnected',
                    },
                    {
                        id: 'mcp-github',
                        name: 'GitHub Context',
                        url: 'http://localhost:3002',
                        status: 'disconnected',
                    },
                ];
                await this.save();
            }
        } catch (e) {
            LOGGER.warn('MCPService', 'Failed to load servers, using defaults', { error: e });
            this.servers = [
                {
                    id: 'mcp-local-files',
                    name: 'Local File System',
                    url: 'http://localhost:3001',
                    status: 'disconnected',
                },
            ];
        }
    }

    private async save() {
        try {
            await this.deps.database.setKv(SERVERS_KEY, this.servers);
        } catch (e) {
            LOGGER.warn('MCPService', 'Failed to persist servers', { error: e });
        }
    }

    private validateServerUrl(url: string): void {
        try {
            const parsed = new URL(url);
            const host = parsed.hostname.toLowerCase();
            const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
            // Require https: for non-localhost connections — http: exposes API keys and
            // tool schemas to network interception (MITM on open Wi-Fi, corporate proxy).
            if (!isLocalhost && parsed.protocol !== 'https:') {
                throw new Error(`MCP server requires https: for non-localhost URLs: ${url}`);
            }
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                throw new Error(`Protocol ${parsed.protocol} not allowed for MCP server`);
            }
            // MCP is a local protocol — block only non-localhost private IPs
            if (!isLocalhost && isPrivateIP(host)) {
                throw new Error(`MCP server URL points to private/internal network: ${url}`);
            }
        } catch {
            throw new Error(`Invalid MCP server URL: ${url}`);
        }
    }

    private validateUri(uri: string): void {
        const decoded = decodeURIComponent(uri.replace(/\+/g, ' '));
        const allowedSchemes = ['http:', 'https:'];
        const scheme = decoded.split('://')[0] + ':';
        if (!allowedSchemes.includes(scheme))
            throw new Error(`MCP URI scheme not allowed: ${scheme}`);
        const path = decoded.split('://').slice(1).join('://');
        if (path.includes('..') || path.includes('\\') || path.includes('@'))
            throw new Error('MCP URI contains forbidden characters');
    }

    private async safeFetch(url: string, init?: RequestInit): Promise<Response> {
        const controller = new AbortController();
        const timeout = setTimeout(
            () => controller.abort(),
            CONFIG?.services?.mcp?.safeFetchTimeoutMs ?? 5000,
        );
        const combinedSignal = init?.signal
            ? (AbortSignal.any?.([init.signal, controller.signal]) ?? init.signal)
            : controller.signal;
        try {
            return await fetch(url, { ...init, signal: combinedSignal });
        } finally {
            clearTimeout(timeout);
        }
    }

    private async rpc(server: MCPServerConfig, method: string, params?: unknown): Promise<unknown> {
        const id = ++this.rpcId;
        const body = { jsonrpc: '2.0', id, method, params };
        const response = await this.safeFetch(server.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            response.body?.cancel()?.catch(() => {});
            throw new Error(`MCP ${server.name} returned ${response.status}`);
        }
        const data: JSONRPCResponse = await response.json();
        if (data.error) throw new Error(`MCP ${server.name} error: ${data.error.message}`);
        return data.result;
    }

    async connect(serverId: string): Promise<void> {
        const server = this.servers.find((s) => s.id === serverId);
        if (!server) throw new Error(`Server ${serverId} not found`);

        const retries = this.connectionRetries.get(serverId) || 0;
        if (retries >= MCPService.MAX_RETRIES) {
            throw new Error(`MCP ${server.name} max retries (${MCPService.MAX_RETRIES}) exceeded`);
        }
        if (retries > 0) {
            const backoff = MCPService.BASE_BACKOFF_MS * Math.pow(2, retries - 1);
            const jitter = Math.random() * backoff * 0.1;
            if (this._abortController.signal.aborted)
                throw new Error('MCPService destroyed during backoff');
            await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(resolve, backoff + jitter);
                const onAbort = () => {
                    clearTimeout(timer);
                    reject(new Error('MCPService destroyed during backoff'));
                };
                this._abortController.signal.addEventListener('abort', onAbort, { once: true });
            });
        }

        if (this._abortController.signal.aborted)
            throw new Error('MCPService destroyed during connect');

        try {
            server.error = undefined;
            server.lastConnected = Date.now();
            const result = (await this.rpc(server, 'initialize', {
                protocolVersion: '2025-03-26',
                capabilities: {},
            })) as { capabilities?: Record<string, unknown> };
            server.capabilities = result.capabilities ? Object.keys(result.capabilities) : [];
            server.status = 'connected';
            this.connectionRetries.delete(serverId);
            await this.save();
            this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Connected to MCP Server: ${server.name}`,
                type: 'success',
            });
        } catch (err) {
            server.status = 'error';
            server.error = err instanceof Error ? err.message : String(err);
            this.connectionRetries.set(serverId, retries + 1);
            await this.save();
            this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                message: `MCP ${server.name} connection failed: ${server.error}`,
                type: 'error',
            });
            throw err;
        }
    }

    async disconnect(serverId: string): Promise<void> {
        const server = this.servers.find((s) => s.id === serverId);
        if (!server) return;
        server.status = 'disconnected';
        server.error = undefined;
        await this.save();
    }

    async reconnectAll(): Promise<number> {
        let successCount = 0;
        for (const server of this.servers) {
            if (server.status === 'error' || server.status === 'disconnected') {
                try {
                    await this.connect(server.id);
                    successCount++;
                } catch (e) {
                    LOGGER.warn('MCPService', 'Reconnect failed', {
                        server: server.name,
                        error: e,
                    });
                }
            }
        }
        return successCount;
    }

    async listResources(serverId: string): Promise<MCPResource[]> {
        const server = this.servers.find((s) => s.id === serverId);
        if (!server) throw new Error(`Server ${serverId} not found`);

        try {
            const result = (await this.rpc(server, 'resources/list')) as {
                resources: MCPResource[];
            };
            const resources: MCPResource[] = (result.resources || []).map((r: MCPResource) => ({
                ...r,
                name: sanitizeExternalString(r.name),
                description: r.description ? sanitizeExternalString(r.description) : undefined,
            }));
            return resources;
        } catch (e) {
            LOGGER.warn('MCPService', 'RPC listResources failed, trying HTTP fallback', {
                error: e,
            });
            try {
                const response = await this.safeFetch(
                    `${server.url.replace(/\/+$/, '')}/resources`,
                );
                const raw = (await response.json()) as MCPResource[];
                return (Array.isArray(raw) ? raw : []).map((r: MCPResource) => ({
                    ...r,
                    name: sanitizeExternalString(r.name),
                    description: r.description ? sanitizeExternalString(r.description) : undefined,
                }));
            } catch (e2) {
                LOGGER.warn('MCPService', 'HTTP listResources also failed', { error: e2 });
                return [];
            }
        }
    }

    async readResource(uri: string): Promise<string> {
        this.validateUri(uri);

        for (const server of this.servers) {
            if (server.status !== 'connected') continue;
            try {
                const result = (await this.rpc(server, 'resources/read', { uri })) as {
                    contents: { text: string }[];
                };
                if (result.contents?.[0]?.text)
                    return sanitizeExternalString(result.contents[0].text);
            } catch (e) {
                LOGGER.warn('MCPService', 'RPC readResource failed', {
                    server: server.name,
                    error: e,
                });
            }
        }

        const connected = this.servers.find((s) => s.status === 'connected');
        if (!connected) return 'No connected MCP servers available';

        try {
            const response = await this.safeFetch(
                `${connected.url.replace(/\/+$/, '')}/resource?uri=${encodeURIComponent(uri)}`,
            );
            return await response.text();
        } catch (e) {
            LOGGER.warn('MCPService', 'HTTP readResource failed', { error: e });
            return `Failed to read resource: ${uri}`;
        }
    }

    async listTools(serverId: string): Promise<MCPTool[]> {
        const server = this.servers.find((s) => s.id === serverId);
        if (!server) throw new Error(`Server ${serverId} not found`);
        try {
            const result = (await this.rpc(server, 'tools/list')) as { tools: MCPTool[] };
            const tools = result.tools || [];
            return tools.map((t) => ({
                ...t,
                name: sanitizeExternalString(t.name),
                description: t.description ? sanitizeExternalString(t.description) : undefined,
                inputSchema: t.inputSchema
                    ? (sanitizeMcpResult(t.inputSchema) as Record<string, unknown>)
                    : undefined,
            }));
        } catch (e) {
            LOGGER.warn('MCPService', 'listTools failed', { server: server.name, error: e });
            return [];
        }
    }

    async callTool(
        serverId: string,
        toolName: string,
        args?: Record<string, unknown>,
    ): Promise<unknown> {
        const server = this.servers.find((s) => s.id === serverId);
        if (!server) throw new Error(`Server ${serverId} not found`);
        const tools = await this.listTools(serverId);
        const tool = tools.find((t) => t.name === sanitizeExternalString(toolName));
        if (tool?.inputSchema && args) {
            if (tool.inputSchema.required) {
                const required = tool.inputSchema.required as string[];
                for (const field of required) {
                    if (!(field in args)) {
                        throw new Error(
                            `Missing required argument "${field}" for tool "${toolName}"`,
                        );
                    }
                }
            }
        }
        const result = await this.rpc(server, 'tools/call', { name: toolName, arguments: args });
        return sanitizeMcpResult(result);
    }

    getServers(): MCPServerConfig[] {
        return [...this.servers];
    }

    getConnectedServers(): MCPServerConfig[] {
        return this.servers.filter((s) => s.status === 'connected');
    }

    getServer(id: string): MCPServerConfig | undefined {
        return this.servers.find((s) => s.id === id);
    }

    addServer(config: Omit<MCPServerConfig, 'status' | 'error'>): void {
        if (this.servers.find((s) => s.id === config.id)) {
            throw new Error(`Server ${config.id} already exists`);
        }
        this.validateServerUrl(config.url);
        this.servers.push({ ...config, status: 'disconnected' });
        this.save();
        this.deps.eventBus.emit(EVENTS.MCP_UPDATED, this.servers);
    }

    removeServer(serverId: string): void {
        this.servers = this.servers.filter((s) => s.id !== serverId);
        this.connectionRetries.delete(serverId);
        this.save();
        this.deps.eventBus.emit(EVENTS.MCP_UPDATED, this.servers);
    }

    updateServer(id: string, updates: Partial<MCPServerConfig>): void {
        if (updates.url) this.validateServerUrl(updates.url);
        this.servers = this.servers.map((s) => (s.id === id ? { ...s, ...updates } : s));
        this.save();
        this.deps.eventBus.emit(EVENTS.MCP_UPDATED, this.servers);
    }

    getConnectionStats() {
        return {
            total: this.servers.length,
            connected: this.servers.filter((s) => s.status === 'connected').length,
            disconnected: this.servers.filter((s) => s.status === 'disconnected').length,
            error: this.servers.filter((s) => s.status === 'error').length,
        };
    }
}
