import type { PluginManifest } from '../../contracts/plugin';

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

    registerTools(
        manifest: PluginManifest,
        executor?: (name: string, args: Record<string, unknown>) => Promise<string>,
        context?: unknown,
    ): void {
        for (const t of manifest.contributes.tools ?? []) {
            this.tools.set(t.name, {
                name: t.name,
                handler: t.handler,
                manifestId: manifest.id,
                execute: executor,
                context,
            });
        }
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
}
