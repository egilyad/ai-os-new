import type { PluginManifest } from '../../contracts/plugin';

export type PluginEventHandler = (event: string, data: unknown) => void;

/** Узкий порт EventBus для подписок плагинов. */
export interface PluginEventBusPort {
    on(event: string, callback: (data: unknown) => void): () => void;
}

export interface PluginTool {
    name: string;
    handler?: string;
    manifestId: string;
    execute?: (name: string, args: Record<string, unknown>) => Promise<string>;
    context?: unknown;
}

export interface PluginToolPort {
    execute: (input: unknown, context: unknown) => Promise<unknown>;
}

/** Порт, потребляемый ToolService (см. tool-executor.ts: pluginRegistry.getTool/getToolContext). */
export interface PluginHostRegistryPort {
    getTool: (id: string) => PluginToolPort | undefined;
    getToolContext: (id: string) => unknown;
}

/** Порт MCPService (встроенные локальные MCP-серверы). */
export interface PluginMcpPort {
    registerLocalServer(
        id: string,
        name: string,
        handle: (method: string, params?: unknown) => Promise<unknown>,
    ): void;
    unregisterLocalServer(id: string): void;
    isLocalServer(id: string): boolean;
}

/** Обработчик сервиса плагина (contributes.services). */
export type PluginServiceHandler = (method: string, params?: unknown) => Promise<unknown>;

export interface RegisteredPluginService {
    id: string;
    manifestId: string;
    handle?: PluginServiceHandler;
}

/**
 * PluginHost — лёгкий хост плагинов (SPEC_06).
 *
 * Регистрирует инструменты из манифестов плагинов, позволяет вызывать их и
 * предоставляет порт, совместимый с ToolService (getTool/getToolContext).
 * (Полная изоляция через Worker/sandboxed iframe — следующий слой.)
 */
export class PluginHost {
    private tools = new Map<string, PluginTool>();
    private subscriptions = new Map<string, Array<() => void>>();
    private mcpServers = new Map<string, string>();
    private services = new Map<string, RegisteredPluginService>();
    private bus: PluginEventBusPort;
    private mcp?: PluginMcpPort;

    constructor(bus?: PluginEventBusPort, mcp?: PluginMcpPort) {
        this.bus = bus ?? { on: () => () => {} };
        this.mcp = mcp;
    }

    registerTools(
        manifest: PluginManifest,
        executor?: (name: string, args: Record<string, unknown>) => Promise<string>,
        context?: unknown,
    ): string[] {
        const conflicts: string[] = [];
        for (const t of manifest.contributes.tools ?? []) {
            const existing = this.tools.get(t.name);
            if (existing && existing.manifestId !== manifest.id) {
                conflicts.push(t.name);
                continue;
            }
            this.tools.set(t.name, {
                name: t.name,
                handler: t.handler,
                manifestId: manifest.id,
                execute: executor,
                context,
            });
        }
        return conflicts;
    }

    unregisterTools(manifestId: string): void {
        for (const [name, t] of this.tools) {
            if (t.manifestId === manifestId) this.tools.delete(name);
        }
    }

    listTools(): PluginTool[] {
        return [...this.tools.values()];
    }

    hasTool(name: string): boolean {
        return this.tools.has(name);
    }

    async callTool(name: string, args: Record<string, unknown>): Promise<string> {
        const tool = this.tools.get(name);
        if (!tool) throw new Error(`Plugin tool not found: ${name}`);
        if (!tool.execute) return `Tool ${name} has no executor`;
        return tool.execute(name, args);
    }

    /** Возвращает исполнитель инструмента (порт ToolService). */
    getTool(id: string): PluginToolPort | undefined {
        const tool = this.tools.get(id);
        if (!tool || !tool.execute) return undefined;
        return {
            execute: async (input: unknown) => tool.execute!(id, input as Record<string, unknown>),
        };
    }

    /** Возвращает контекст инструмента (для ToolService). */
    getToolContext(id: string): unknown {
        return this.tools.get(id)?.context;
    }

    /** Порт для ToolService.deps.pluginRegistry. */
    toRegistryPort(): PluginHostRegistryPort {
        return {
            getTool: (id) => this.getTool(id),
            getToolContext: (id) => this.getToolContext(id),
        };
    }

    /** Подписывает плагин на события EventBus (contributes.subscriptions). */
    registerSubscriptions(manifest: PluginManifest, handler?: PluginEventHandler): void {
        this.unregisterSubscriptions(manifest.id);
        const unsubs: Array<() => void> = [];
        for (const s of manifest.contributes.subscriptions ?? []) {
            const unsub = this.bus.on(s.event, (data) => handler?.(s.event, data));
            unsubs.push(unsub);
        }
        if (unsubs.length > 0) this.subscriptions.set(manifest.id, unsubs);
    }

    /** Снимает подписки плагина на события. */
    unregisterSubscriptions(manifestId: string): void {
        const unsubs = this.subscriptions.get(manifestId);
        if (!unsubs) return;
        for (const unsub of unsubs) unsub();
        this.subscriptions.delete(manifestId);
    }

    /** Регистрирует встроенные локальные MCP-серверы плагина (contributes.mcpServers). */
    registerMcpServers(manifest: PluginManifest): void {
        if (!this.mcp) return;
        for (const m of manifest.contributes.mcpServers ?? []) {
            const id = m.name.includes(':') ? m.name : `plugin:${manifest.id}:${m.name}`;
            this.mcp.registerLocalServer(id, m.name, async (method, params) => {
                if (method === 'tools/list') {
                    const names = this.listTools()
                        .filter((t) => t.manifestId === manifest.id)
                        .map((t) => ({ name: t.name }));
                    return { tools: names };
                }
                if (method === 'tools/call') {
                    const p = (params ?? {}) as {
                        name?: string;
                        arguments?: Record<string, unknown>;
                    };
                    if (!p.name) throw new Error('MCP tool name required');
                    return {
                        content: [
                            { type: 'text', text: await this.callTool(p.name, p.arguments ?? {}) },
                        ],
                    };
                }
                throw new Error(`MCP method not supported: ${method}`);
            });
            this.mcpServers.set(id, manifest.id);
        }
    }

    /** Снимает встроенные MCP-серверы плагина. */
    unregisterMcpServers(manifestId: string): void {
        if (!this.mcp) return;
        for (const [id, owner] of [...this.mcpServers]) {
            if (owner === manifestId) {
                this.mcp.unregisterLocalServer(id);
                this.mcpServers.delete(id);
            }
        }
    }

    /** Имена встроенных MCP-серверов плагина (для UI). */
    listMcpServers(manifestId: string): string[] {
        return [...this.mcpServers.entries()]
            .filter(([, owner]) => owner === manifestId)
            .map(([id]) => id);
    }

    /** Регистрирует сервисы плагина (contributes.services). */
    registerServices(
        manifest: PluginManifest,
        handlers?: Record<string, PluginServiceHandler>,
    ): void {
        this.unregisterServices(manifest.id);
        for (const s of manifest.contributes.services ?? []) {
            this.services.set(s.id, {
                id: s.id,
                manifestId: manifest.id,
                handle: handlers?.[s.id],
            });
        }
    }

    /** Снимает сервисы плагина. */
    unregisterServices(manifestId: string): void {
        for (const [id, svc] of [...this.services]) {
            if (svc.manifestId === manifestId) this.services.delete(id);
        }
    }

    /** Вызывает метод зарегистрированного сервиса плагина. */
    async callService(id: string, method: string, params?: unknown): Promise<unknown> {
        const svc = this.services.get(id);
        if (!svc) throw new Error(`Plugin service not found: ${id}`);
        if (!svc.handle) throw new Error(`Plugin service ${id} has no handler`);
        return svc.handle(method, params);
    }

    /** Список сервисов плагина (для UI). */
    listServices(manifestId: string): string[] {
        return [...this.services.values()]
            .filter((s) => s.manifestId === manifestId)
            .map((s) => s.id);
    }

    /** Полная очистка плагина: инструменты + подписки + MCP + сервисы. */
    unregisterAll(manifestId: string): void {
        this.unregisterTools(manifestId);
        this.unregisterSubscriptions(manifestId);
        this.unregisterMcpServers(manifestId);
        this.unregisterServices(manifestId);
    }

    /** Очистка хоста при завершении: снимает все подписки и MCP (ILifecycle). */
    destroy(): void {
        for (const manifestId of [...this.subscriptions.keys()]) {
            this.unregisterSubscriptions(manifestId);
        }
        for (const manifestId of [...this.mcpServers.values()]) {
            this.unregisterMcpServers(manifestId);
        }
        for (const manifestId of [
            ...new Set([...this.services.values()].map((s) => s.manifestId)),
        ]) {
            this.unregisterServices(manifestId);
        }
        this.tools.clear();
    }
}
