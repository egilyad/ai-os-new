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
    private bus: PluginEventBusPort;

    constructor(bus?: PluginEventBusPort) {
        this.bus = bus ?? { on: () => () => {} };
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

    /** Полная очистка плагина: инструменты + подписки. */
    unregisterAll(manifestId: string): void {
        this.unregisterTools(manifestId);
        this.unregisterSubscriptions(manifestId);
    }

    /** Очистка хоста при завершении: снимает все подписки (ILifecycle). */
    destroy(): void {
        for (const manifestId of [...this.subscriptions.keys()]) {
            this.unregisterSubscriptions(manifestId);
        }
        this.tools.clear();
    }
}
